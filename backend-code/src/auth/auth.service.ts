import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { PrismaService }  from '../database/prisma.service';
import { RedisService }   from '../redis/redis.service';
import { EmailService }   from '../email/email.service';
import { LoggingService } from '../logging/logging.service';
import { RegisterDto }    from './dto/register.dto';
import { LoginDto }       from './dto/login.dto';
import { GithubProfile }  from './strategies/github.strategy';

// ─── TTLs ─────────────────────────────────────────────────────────────────────
const ACCESS_TTL  = 15 * 60;       // 15 min
const REFRESH_TTL = 7 * 24 * 3600; // 7 jours
const MAGIC_TTL   = 15 * 60;       // 15 min
const PREAUTH_TTL = 10 * 60;       // 10 min

// ─── Clés Redis ───────────────────────────────────────────────────────────────
const refreshKey = (jti: string)      => `refresh:${jti}`;
const magicKey   = (token: string)    => `magic:${token}`;
const preAuthKey = (token: string)    => `preauth:${token}`;
const pinAuthKey = (token: string)    => `pinauth:${token}`;
const failKey    = (step: string, userId: string) => `fail:${step}:${userId}`;
const lockedKey  = (userId: string)   => `locked:${userId}`;
const ipFailKey  = (ip: string)       => `fail:ip:${ip}`;

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma:   PrismaService,
    private jwtService: JwtService,
    private config:   ConfigService,
    private redis:    RedisService,
    private email:    EmailService,
    private logging:  LoggingService,
  ) {}

  // ─── Config dynamique (seuils configurables via .env) ──────────────────────

  /** MAX_AUTH_FAILURES — nombre de tentatives avant verrouillage (défaut: 3) */
  private get maxFailures(): number {
    return parseInt(this.config.get<string>('MAX_AUTH_FAILURES') ?? '3', 10);
  }

  /** LOCK_TTL_SECONDS — durée du verrouillage en secondes (défaut: 1800 = 30 min) */
  private get lockTtl(): number {
    return parseInt(this.config.get<string>('LOCK_TTL_SECONDS') ?? '1800', 10);
  }

  /** MAX_IP_FAILURES — échecs depuis une même IP avant SUSPICIOUS_IP (défaut: 10) */
  private get maxIpFailures(): number {
    return parseInt(this.config.get<string>('MAX_IP_FAILURES') ?? '10', 10);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private async checkLocked(userId: string): Promise<void> {
    const locked = await this.redis.get(lockedKey(userId));
    if (locked) {
      throw new HttpException('Compte bloqué temporairement. Réessayez plus tard.', 423);
    }
  }

  /**
   * Incrémente le compteur d'échecs pour le userId + step.
   * Verrouille le compte si maxFailures est atteint.
   * Suit aussi les échecs par IP et émet SUSPICIOUS_IP si nécessaire.
   */
  private async recordFailure(userId: string, step: string, ip?: string): Promise<never> {
    // ── Compteur par user ──────────────────────────────────────────────────
    const key     = failKey(step, userId);
    const current = await this.redis.get(key);
    const count   = parseInt(current ?? '0') + 1;
    await this.redis.set(key, count.toString(), this.lockTtl);

    await this.logging.authFailure(userId, step as any, ip, undefined, `Tentative ${count}/${this.maxFailures}`);

    if (count >= this.maxFailures) {
      await this.redis.set(lockedKey(userId), 'true', this.lockTtl);
      await this.redis.del(key);
      await this.logging.accountLocked(userId, ip, `Bloqué après ${this.maxFailures} tentatives (${step})`);
      throw new HttpException(
        `Compte bloqué après ${this.maxFailures} tentatives échouées. Réessayez dans ${Math.round(this.lockTtl / 60)} minutes.`,
        423,
      );
    }

    // ── Compteur par IP ───────────────────────────────────────────────────
    await this.trackIpFailure(ip, userId);

    const remaining = this.maxFailures - count;
    throw new UnauthorizedException(
      `Code incorrect. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`,
    );
  }

  /**
   * Suit les échecs d'authentification par adresse IP.
   * Émet SUSPICIOUS_IP si l'IP dépasse maxIpFailures en moins d'une heure.
   */
  private async trackIpFailure(ip?: string, userId?: string | null): Promise<void> {
    if (!ip || ip === '127.0.0.1' || ip === '::1') return; // ignorer localhost

    const key     = ipFailKey(ip);
    const current = await this.redis.get(key);
    const count   = parseInt(current ?? '0') + 1;

    // TTL glissant d'1 heure pour la fenêtre de détection
    await this.redis.set(key, count.toString(), 3600);

    if (count >= this.maxIpFailures) {
      await this.logging.suspiciousIp(
        userId ?? null,
        ip,
        `${count} échecs d'authentification depuis cette IP en moins d'1h`,
      );
      // Réinitialiser après alerte pour éviter le flood de logs
      await this.redis.del(key);
    }
  }

  private async clearFailures(userId: string, step: string): Promise<void> {
    await this.redis.del(failKey(step, userId));
  }

  private async generateAndSendOTP(userId: string, userEmail: string): Promise<string> {
    const otp          = Math.floor(100000 + Math.random() * 900000).toString();
    const preAuthToken = crypto.randomUUID();
    await this.redis.set(preAuthKey(preAuthToken), JSON.stringify({ userId, email: userEmail, otp }), PREAUTH_TTL);
    await this.email.sendOTP(userEmail, otp);
    this.logger.log(`OTP envoyé à ${userEmail}`);
    return preAuthToken;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. EMAIL / MOT DE PASSE
  // ═══════════════════════════════════════════════════════════════════════════

  async register(dto: RegisterDto, res: Response, ip?: string): Promise<{ accessToken: string; user: AuthUser }> {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    let user: AuthUser;
    try {
      const created = await this.prisma.user.create({
        data: { email: dto.email, username: dto.username, passwordHash },
      });
      user = { id: created.id, email: created.email, username: created.username };
    } catch (e: any) {
      if (e?.code === 'P2002') {
        // Vérifier quel champ cause le conflit
        if (e.meta?.target?.includes('email')) {
          throw new ConflictException(`Cet email (${dto.email}) est déjà utilisé. Veuillez en utiliser un autre.`);
        }
        if (e.meta?.target?.includes('username')) {
          throw new ConflictException(`Ce nom d'utilisateur (${dto.username}) existe déjà. Veuillez en choisir un autre.`);
        }
        throw new ConflictException('Cet email ou ce nom d\'utilisateur existe déjà. Veuillez en utiliser d\'autres.');
      }
      throw e;
    }
    await this.logging.authSuccess(user.id, 'password', ip);
    // 2FA DÉSACTIVÉ : retourner directement les tokens
    const { accessToken } = await this.issueTokens(user.id, user.email, res, ip);
    return { accessToken, user };
  }

  async login(dto: LoginDto, res: Response, ip?: string): Promise<{ requiresMFA: true; preAuthToken: string; message: string }> {
    const dbUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!dbUser?.passwordHash) {
      await this.logging.authFailure(null, 'password', ip, undefined, `Email inconnu: ${dto.email}`);
      await this.trackIpFailure(ip, null);
      throw new UnauthorizedException('Identifiants invalides');
    }

    await this.checkLocked(dbUser.id);

    const valid = await bcrypt.compare(dto.password, dbUser.passwordHash);
    if (!valid) {
      await this.recordFailure(dbUser.id, 'password', ip);
    }

    await this.clearFailures(dbUser.id, 'password');
    await this.logging.authSuccess(dbUser.id, 'password', ip);

    // 2FA réactivé : mot de passe validé → OTP email → (PIN) → tokens
    const preAuthToken = await this.generateAndSendOTP(dbUser.id, dbUser.email);
    return {
      requiresMFA: true,
      preAuthToken,
      message: 'Code OTP envoyé à votre email. Veuillez vérifier votre boîte de réception.',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. MAGIC LINK
  // ═══════════════════════════════════════════════════════════════════════════

  async requestMagicLink(userEmail: string, ip?: string): Promise<void> {
    const token      = crypto.randomBytes(32).toString('hex');
    await this.redis.set(magicKey(token), userEmail, MAGIC_TTL);
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const link        = `${frontendUrl}/auth/magic?token=${token}`;
    await this.email.sendMagicLink(userEmail, link);
    this.logger.log(`Magic link envoyé à ${userEmail}`);
  }

  async verifyMagicLink(token: string, ip?: string): Promise<{ preAuthToken: string; requiresPassword?: boolean }> {
    const userEmail = await this.redis.get(magicKey(token));
    if (!userEmail) throw new UnauthorizedException('Lien expiré ou invalide');
    await this.redis.del(magicKey(token));

    let dbUser = await this.prisma.user.findUnique({ where: { email: userEmail } });
    if (!dbUser) {
      const base = userEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      dbUser = await this.prisma.user.create({
        data: { email: userEmail, username: `${base}_${crypto.randomBytes(3).toString('hex')}` },
      });
    }

    await this.logging.authSuccess(dbUser.id, 'magic_link', ip);

    // Pas encore de mot de passe : direction création de mot de passe avant l'OTP
    if (!dbUser.passwordHash) {
      const preAuthToken = crypto.randomUUID();
      await this.redis.set(
        preAuthKey(preAuthToken),
        JSON.stringify({ userId: dbUser.id, email: dbUser.email }),
        PREAUTH_TTL,
      );
      return { preAuthToken, requiresPassword: true };
    }

    // OTP réactivé : email vérifié → OTP email → (PIN) → tokens
    const preAuthToken = await this.generateAndSendOTP(dbUser.id, dbUser.email);
    return { preAuthToken };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. GITHUB OAUTH
  // ═══════════════════════════════════════════════════════════════════════════

  async handleGithubCallback(profile: GithubProfile, ip?: string): Promise<string> {
    let dbUser = await this.prisma.user.findFirst({ where: { githubId: profile.githubId } });

    if (!dbUser && profile.email) {
      dbUser = await this.prisma.user.findUnique({ where: { email: profile.email } });
      if (dbUser) {
        dbUser = await this.prisma.user.update({ where: { id: dbUser.id }, data: { githubId: profile.githubId } });
      }
    }

    if (!dbUser) {
      const base     = profile.username.replace(/[^a-zA-Z0-9_]/g, '_');
      const taken    = await this.prisma.user.findUnique({ where: { username: base } });
      const username = taken ? `${base}_${crypto.randomBytes(3).toString('hex')}` : base;
      dbUser = await this.prisma.user.create({
        data: { email: profile.email ?? `gh_${profile.githubId}@no-email.local`, username, githubId: profile.githubId },
      });
    }

    if (dbUser.email.endsWith('@no-email.local')) return `no-email:${dbUser.id}`;

    await this.logging.authSuccess(dbUser.id, 'github', ip);

    // OTP réactivé : compte GitHub validé → OTP email → (PIN) → tokens
    return this.generateAndSendOTP(dbUser.id, dbUser.email);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. OTP VERIFICATION (Facteur 2) → retourne pinAuthToken
  // ═══════════════════════════════════════════════════════════════════════════

  async verify2FA(preAuthToken: string, otp: string, ip?: string): Promise<{ pinAuthToken: string; requiresPinSetup: boolean }> {
    const stored = await this.redis.get(preAuthKey(preAuthToken));
    if (!stored) throw new UnauthorizedException('Code expiré ou invalide');

    const parsed: { userId: string; email: string; otp: string | null } = JSON.parse(stored);

    if (parsed.otp === null) throw new BadRequestException('Veuillez d\'abord créer un mot de passe');

    await this.checkLocked(parsed.userId);

    if (otp !== parsed.otp) {
      await this.recordFailure(parsed.userId, 'otp', ip);
    }

    await this.clearFailures(parsed.userId, 'otp');
    await this.redis.del(preAuthKey(preAuthToken));
    await this.logging.authSuccess(parsed.userId, 'otp_email', ip);

    const dbUser        = await this.prisma.user.findUnique({ where: { id: parsed.userId } });
    const requiresPinSetup = !dbUser?.pin;

    const pinAuthToken = crypto.randomUUID();
    await this.redis.set(pinAuthKey(pinAuthToken), JSON.stringify({ userId: parsed.userId, email: parsed.email }), PREAUTH_TTL);

    return { pinAuthToken, requiresPinSetup };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. PIN SETUP (première connexion)
  // ═══════════════════════════════════════════════════════════════════════════

  async setupPin(pinAuthToken: string, pin: string, res: Response, ip?: string): Promise<{ accessToken: string; user: AuthUser }> {
    const stored = await this.redis.get(pinAuthKey(pinAuthToken));
    if (!stored) throw new UnauthorizedException('Session expirée, recommencez la connexion');

    const parsed: { userId: string; email: string } = JSON.parse(stored);
    await this.checkLocked(parsed.userId);

    const pinHash = await bcrypt.hash(pin, 10);
    await this.prisma.user.update({ where: { id: parsed.userId }, data: { pin: pinHash } });

    await this.redis.del(pinAuthKey(pinAuthToken));

    const dbUser = await this.prisma.user.findUnique({ where: { id: parsed.userId } });
    if (!dbUser) throw new UnauthorizedException('Utilisateur introuvable');

    const user: AuthUser = { id: dbUser.id, email: dbUser.email, username: dbUser.username };
    const { accessToken } = await this.issueTokens(parsed.userId, parsed.email, res, ip);
    return { accessToken, user };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. PIN VERIFICATION (Facteur 3) → émet les vrais tokens
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyPin(pinAuthToken: string, pin: string, res: Response, ip?: string): Promise<{ accessToken: string; user: AuthUser }> {
    const stored = await this.redis.get(pinAuthKey(pinAuthToken));
    if (!stored) throw new UnauthorizedException('Session expirée, recommencez la connexion');

    const parsed: { userId: string; email: string } = JSON.parse(stored);
    await this.checkLocked(parsed.userId);

    const dbUser = await this.prisma.user.findUnique({ where: { id: parsed.userId } });
    if (!dbUser?.pin) throw new BadRequestException('Aucun PIN configuré');

    const valid = await bcrypt.compare(pin, dbUser.pin);
    if (!valid) {
      await this.recordFailure(parsed.userId, 'pin', ip);
    }

    await this.clearFailures(parsed.userId, 'pin');
    await this.redis.del(pinAuthKey(pinAuthToken));
    await this.logging.authSuccess(parsed.userId, 'pin', ip);

    const user: AuthUser = { id: dbUser.id, email: dbUser.email, username: dbUser.username };
    const { accessToken } = await this.issueTokens(parsed.userId, parsed.email, res, ip);
    return { accessToken, user };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SET PASSWORD (utilisateurs magic link)
  // ═══════════════════════════════════════════════════════════════════════════

  async setPassword(preAuthToken: string, password: string, ip?: string): Promise<{ preAuthToken: string }> {
    const stored = await this.redis.get(preAuthKey(preAuthToken));
    if (!stored) throw new UnauthorizedException('Session expirée');

    const parsed: { userId: string; email: string } = JSON.parse(stored);
    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.user.update({ where: { id: parsed.userId }, data: { passwordHash } });
    await this.redis.del(preAuthKey(preAuthToken));

    // Mot de passe créé : OTP réactivé → email → (PIN) → tokens
    const newPreAuthToken = await this.generateAndSendOTP(parsed.userId, parsed.email);
    return { preAuthToken: newPreAuthToken };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REFRESH / LOGOUT / PROFILE
  // ═══════════════════════════════════════════════════════════════════════════

  async refresh(req: Request, res: Response): Promise<{ accessToken: string }> {
    const token = req.cookies?.['refresh_token'] as string | undefined;
    if (!token) throw new UnauthorizedException('Refresh token manquant');

    let payload: { sub: string; email: string; jti: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const stored = await this.redis.get(refreshKey(payload.jti));
    if (!stored || stored !== payload.sub) {
      throw new UnauthorizedException('Session expirée, reconnectez-vous');
    }

    await this.redis.del(refreshKey(payload.jti));
    const { accessToken } = await this.issueTokens(payload.sub, payload.email, res);
    return { accessToken };
  }

  async logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.['refresh_token'] as string | undefined;
    if (token) {
      try {
        const payload = this.jwtService.verify<{ jti: string; sub: string }>(token, {
          secret: this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret',
        });
        await this.redis.del(refreshKey(payload.jti));
        await this.logging.sessionExpired(payload.sub);
      } catch {}
    }
    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'lax', path: '/' });
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, email: true, username: true, githubId: true, trading_preference: true, createdAt: true },
    });
  }

  /**
   * MODE DÉVELOPPEMENT SEULEMENT - Connexion directe sans authentification
   * Crée ou récupère l'utilisateur et émet les tokens JWT
   */
  async devLogin(email: string, res: Response, ip: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Dev mode not available in production');
    }

    // Créer ou récupérer l'utilisateur
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          username: email.split('@')[0],
          passwordHash: '', // Pas de password en dev
        },
      });
    }

    const { accessToken } = await this.issueTokens(user.id, user.email, res, ip);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE — Émission des tokens + SESSION_CREATED
  // ═══════════════════════════════════════════════════════════════════════════

  private async issueTokens(
    userId: string,
    userEmail: string,
    res: Response,
    ip?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = crypto.randomUUID();

    const accessToken = this.jwtService.sign(
      { sub: userId, email: userEmail, jti },
      { secret: this.config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me', expiresIn: `${ACCESS_TTL}s` },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, email: userEmail, jti },
      { secret: this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret', expiresIn: `${REFRESH_TTL}s` },
    );

    await this.redis.set(refreshKey(jti), userId, REFRESH_TTL);

    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true, sameSite: 'lax', secure: isProd,
      maxAge: REFRESH_TTL * 1000, path: '/',
    });

    await this.logging.sessionCreated(userId, ip);

    return { accessToken, refreshToken };
  }
}

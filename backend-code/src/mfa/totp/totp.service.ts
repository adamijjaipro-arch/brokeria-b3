/**
 * TotpService — TOTP RFC 6238 via otplib
 *
 * Flux :
 *  1. enrollInit()   → génère secret + URI otpauth, retourne QR code base64
 *  2. enrollConfirm() → valide le premier code TOTP de l'utilisateur + sauvegarde
 *  3. verify()        → valide un code TOTP lors de la connexion
 *  4. disable()       → révoque le TOTP après vérification
 *
 * Sécurité :
 *  - Le secret TOTP est chiffré AES-256-GCM avant stockage en base.
 *  - La clé de chiffrement est lue depuis TOTP_ENCRYPTION_KEY (.env).
 *  - Le secret temporaire pendant l'enrôlement est stocké dans Redis (TTL 10 min).
 */
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LoggingService } from '../../logging/logging.service';

const TOTP_ENROLL_TTL = 10 * 60; // 10 minutes
const totpEnrollKey = (userId: string) => `totp_enroll:${userId}`;

@Injectable()
export class TotpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logging: LoggingService,
    private readonly config: ConfigService,
  ) {
    // Fenêtre de tolérance : ±1 période (30 s) pour compenser les décalages d'horloge
    authenticator.options = { window: 1 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENRÔLEMENT — Étape 1 : génération du secret + QR code
  // ═══════════════════════════════════════════════════════════════════════════

  async enrollInit(userId: string): Promise<{ qrCodeDataUrl: string; secret: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.totpEnabled) throw new BadRequestException('TOTP déjà activé sur ce compte');

    // Génère un secret base32 (160 bits — OWASP recommande ≥ 128 bits)
    const secret = authenticator.generateSecret(20); // 20 bytes → 160 bits

    // Stocke temporairement dans Redis (pas encore confirmé)
    await this.redis.set(totpEnrollKey(userId), secret, TOTP_ENROLL_TTL);

    const appName = this.config.get<string>('APP_NAME') ?? 'BrokerIA';
    const otpauthUri = authenticator.keyuri(user.email, appName, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri);

    return { qrCodeDataUrl, secret };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENRÔLEMENT — Étape 2 : confirmation par un premier code valide
  // ═══════════════════════════════════════════════════════════════════════════

  async enrollConfirm(userId: string, code: string, ip?: string): Promise<void> {
    const secret = await this.redis.get(totpEnrollKey(userId));
    if (!secret) {
      throw new BadRequestException('Session d\'enrôlement expirée, recommencez');
    }

    const isValid = authenticator.verify({ token: code, secret });
    if (!isValid) {
      await this.logging.authFailure(userId, 'totp', ip, undefined, 'TOTP enroll confirmation failed');
      throw new UnauthorizedException('Code TOTP invalide');
    }

    // Chiffre le secret avant persistance
    const encryptedSecret = this.encrypt(secret);
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: encryptedSecret, totpEnabled: true },
    });

    // Nettoie le secret temporaire
    await this.redis.del(totpEnrollKey(userId));

    await this.logging.mfaEnrolled(userId, 'totp', ip);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VÉRIFICATION — lors de la connexion
  // ═══════════════════════════════════════════════════════════════════════════

  async verify(userId: string, code: string, ip?: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpEnabled || !user.totpSecret) {
      throw new BadRequestException('TOTP non configuré sur ce compte');
    }

    const secret = this.decrypt(user.totpSecret);
    const isValid = authenticator.verify({ token: code, secret });

    if (!isValid) {
      await this.logging.authFailure(userId, 'totp', ip, undefined, 'TOTP verification failed');
      throw new UnauthorizedException('Code TOTP invalide ou expiré');
    }

    await this.logging.authSuccess(userId, 'totp', ip);
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DÉSACTIVATION
  // ═══════════════════════════════════════════════════════════════════════════

  async disable(userId: string, code: string, ip?: string): Promise<void> {
    // Vérifie le code avant de désactiver
    await this.verify(userId, code, ip);

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: null, totpEnabled: false },
    });

    await this.logging.mfaRevoked(userId, 'totp', ip);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUT
  // ═══════════════════════════════════════════════════════════════════════════

  async getStatus(userId: string): Promise<{ totpEnabled: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabled: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return { totpEnabled: user.totpEnabled };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHIFFREMENT AES-256-GCM
  // ═══════════════════════════════════════════════════════════════════════════

  private getEncryptionKey(): Buffer {
    const keyHex = this.config.get<string>('TOTP_ENCRYPTION_KEY');
    if (!keyHex || keyHex.length < 64) {
      throw new Error('TOTP_ENCRYPTION_KEY must be a 64-char hex string (32 bytes / 256 bits)');
    }
    return Buffer.from(keyHex, 'hex');
  }

  private encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag(); // 128-bit auth tag

    // Format stocké : iv(hex):authTag(hex):ciphertext(hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decrypt(stored: string): string {
    const key = this.getEncryptionKey();
    const [ivHex, authTagHex, ciphertextHex] = stored.split(':');

    if (!ivHex || !authTagHex || !ciphertextHex) {
      throw new Error('Invalid encrypted TOTP secret format');
    }

    const iv         = Buffer.from(ivHex, 'hex');
    const authTag    = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  }
}

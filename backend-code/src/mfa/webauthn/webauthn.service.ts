/**
 * WebAuthnService — FIDO2 / WebAuthn via @simplewebauthn/server
 *
 * Flux d'enrôlement :
 *   1. registrationOptions()  → génère un challenge stocké dans Redis
 *   2. registrationVerify()   → valide la réponse de l'authenticateur + stocke la credential
 *
 * Flux d'authentification :
 *   1. authenticationOptions() → génère un challenge
 *   2. authenticationVerify()  → valide + met à jour le compteur
 */
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/types';

// Type local pour éviter la dépendance au client Prisma généré
// (remplacé automatiquement une fois `npx prisma generate` lancé)
interface StoredCredential {
  id:           string;
  userId:       string;
  credentialId: string;
  publicKey:    string;
  counter:      number;
  deviceType:   string | null;
  backedUp:     boolean;
  transports:   string | null;
  aaguid:       string | null;
  createdAt:    Date;
  lastUsedAt:   Date | null;
}

import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LoggingService } from '../../logging/logging.service';

const CHALLENGE_TTL = 5 * 60; // 5 minutes
const challengeKey = (userId: string, type: 'reg' | 'auth') =>
  `webauthn_challenge:${type}:${userId}`;

@Injectable()
export class WebAuthnService {
  private readonly rpName: string;
  private readonly rpID: string;
  private readonly origin: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logging: LoggingService,
    private readonly config: ConfigService,
  ) {
    this.rpName = config.get<string>('WEBAUTHN_RP_NAME') ?? 'BrokerIA';
    this.rpID   = config.get<string>('WEBAUTHN_RP_ID')   ?? 'localhost';
    this.origin = config.get<string>('WEBAUTHN_ORIGIN')  ?? 'http://localhost:3006';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENRÔLEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async registrationOptions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { webAuthnCredentials: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Exclus les credentials déjà enregistrés pour éviter les doublons
    const excludeCredentials = user.webAuthnCredentials.map((cred: StoredCredential) => ({
      id: cred.credentialId,
      type: 'public-key' as const,
      transports: cred.transports
        ? (JSON.parse(cred.transports) as AuthenticatorTransportFuture[])
        : undefined,
    }));

    const options = await generateRegistrationOptions({
      rpName:                  this.rpName,
      rpID:                    this.rpID,
      userID:                  Buffer.from(userId),
      userName:                user.email,
      userDisplayName:         user.username,
      attestationType:         'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey:      'preferred',
        userVerification: 'required', // obligatoire pour compter comme facteur d'inhérence (biométrie / PIN device)
      },
    });

    // Stocke le challenge dans Redis
    await this.redis.set(
      challengeKey(userId, 'reg'),
      options.challenge,
      CHALLENGE_TTL,
    );

    return options;
  }

  async registrationVerify(
    userId: string,
    response: RegistrationResponseJSON,
    ip?: string,
  ): Promise<void> {
    const expectedChallenge = await this.redis.get(challengeKey(userId, 'reg'));
    if (!expectedChallenge) {
      throw new BadRequestException('Challenge expiré, recommencez l\'enrôlement');
    }

    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID:   this.rpID,
        requireUserVerification: false,
      });
    } catch (err) {
      await this.logging.authFailure(userId, 'webauthn', ip, undefined, (err as Error).message);
      throw new UnauthorizedException('Vérification WebAuthn échouée');
    }

    if (!verification.verified || !verification.registrationInfo) {
      await this.logging.authFailure(userId, 'webauthn', ip, undefined, 'WebAuthn registration not verified');
      throw new UnauthorizedException('Enrôlement WebAuthn non vérifié');
    }

    const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp, aaguid } =
      verification.registrationInfo;

    // Persiste la credential en base
    await this.prisma.webAuthnCredential.create({
      data: {
        userId,
        credentialId: credentialID,
        publicKey:    Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
        deviceType:   credentialDeviceType,
        backedUp:     credentialBackedUp,
        transports:   response.response.transports
          ? JSON.stringify(response.response.transports)
          : null,
        aaguid: aaguid ?? null,
      },
    });

    await this.redis.del(challengeKey(userId, 'reg'));
    await this.logging.mfaEnrolled(userId, 'webauthn', ip);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHENTIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  async authenticationOptions(userId: string) {
    const credentials = await this.prisma.webAuthnCredential.findMany({
      where: { userId },
    });
    if (credentials.length === 0) {
      throw new BadRequestException('Aucun dispositif WebAuthn enregistré');
    }

    const allowCredentials = credentials.map((cred: StoredCredential) => ({
      id:         cred.credentialId,
      type:       'public-key' as const,
      transports: cred.transports
        ? (JSON.parse(cred.transports) as AuthenticatorTransportFuture[])
        : undefined,
    }));

    const options = await generateAuthenticationOptions({
      rpID:             this.rpID,
      allowCredentials,
      userVerification: 'required', // force la vérification biométrique ou PIN device
    });

    await this.redis.set(
      challengeKey(userId, 'auth'),
      options.challenge,
      CHALLENGE_TTL,
    );

    return options;
  }

  async authenticationVerify(
    userId: string,
    response: AuthenticationResponseJSON,
    ip?: string,
  ): Promise<boolean> {
    const expectedChallenge = await this.redis.get(challengeKey(userId, 'auth'));
    if (!expectedChallenge) {
      throw new BadRequestException('Challenge expiré, recommencez');
    }

    const storedCredential = await this.prisma.webAuthnCredential.findUnique({
      where: { credentialId: response.id },
    });
    if (!storedCredential || storedCredential.userId !== userId) {
      throw new UnauthorizedException('Credential inconnu');
    }

    const publicKeyBytes = Buffer.from(storedCredential.publicKey, 'base64url');

    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin:  this.origin,
        expectedRPID:    this.rpID,
        authenticator: {
          credentialID:        storedCredential.credentialId,
          credentialPublicKey: publicKeyBytes,
          counter:             storedCredential.counter,
          transports:          storedCredential.transports
            ? (JSON.parse(storedCredential.transports) as AuthenticatorTransportFuture[])
            : undefined,
        },
      });
    } catch (err) {
      await this.logging.authFailure(userId, 'webauthn', ip, undefined, (err as Error).message);
      throw new UnauthorizedException('Vérification WebAuthn échouée');
    }

    if (!verification.verified) {
      await this.logging.authFailure(userId, 'webauthn', ip);
      throw new UnauthorizedException('Authentification WebAuthn non vérifiée');
    }

    // Met à jour le compteur pour la protection contre les replay attacks
    await this.prisma.webAuthnCredential.update({
      where: { credentialId: response.id },
      data: {
        counter:    verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      },
    });

    await this.redis.del(challengeKey(userId, 'auth'));
    await this.logging.authSuccess(userId, 'webauthn', ip);
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTION DES CREDENTIALS
  // ═══════════════════════════════════════════════════════════════════════════

  async listCredentials(userId: string) {
    return this.prisma.webAuthnCredential.findMany({
      where: { userId },
      select: {
        id:          true,
        credentialId: true,
        deviceType:  true,
        backedUp:    true,
        createdAt:   true,
        lastUsedAt:  true,
        aaguid:      true,
      },
    });
  }

  async removeCredential(userId: string, credentialDbId: string, ip?: string): Promise<void> {
    const cred = await this.prisma.webAuthnCredential.findUnique({
      where: { id: credentialDbId },
    });
    if (!cred || cred.userId !== userId) {
      throw new NotFoundException('Credential introuvable');
    }

    await this.prisma.webAuthnCredential.delete({ where: { id: credentialDbId } });
    await this.logging.mfaRevoked(userId, 'webauthn', ip);
  }
}

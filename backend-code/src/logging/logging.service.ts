/**
 * LoggingService — Logs structurés JSON (format normalisé) + émission Syslog UDP (RFC 5424)
 *
 * Chaque événement émet :
 *  1. Un log NestJS (console / stdout)
 *  2. Un enregistrement en base (AuthLog via Prisma)
 *  3. Un message Syslog UDP vers localhost:514 (SIEM)
 */
import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dgram from 'dgram';
import { PrismaService } from '../database/prisma.service';
import { MetricsService } from '../metrics/metrics.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'MFA_ENROLLED'
  | 'MFA_REVOKED'
  | 'ACCOUNT_LOCKED'
  | 'SESSION_CREATED'
  | 'SESSION_EXPIRED'
  | 'SUSPICIOUS_IP';

export type AuthFactor =
  | 'password'
  | 'otp_email'
  | 'totp'
  | 'webauthn'
  | 'pin'
  | 'magic_link'
  | 'github';

export interface SecurityEvent {
  event_type: EventType;
  user_id?: string | null;
  ip?: string;
  user_agent?: string;
  factor?: AuthFactor;
  success: boolean;
  details?: string;
}

export interface StructuredLog extends SecurityEvent {
  timestamp: string;          // ISO 8601
  app: string;                // application name
  env: string;                // production | development
}

// ─── RFC 5424 Syslog severity ─────────────────────────────────────────────────
// 3 = Error, 4 = Warning, 6 = Informational
type SyslogSeverity = 3 | 4 | 6;

const SEVERITY_MAP: Record<EventType, SyslogSeverity> = {
  AUTH_SUCCESS:    6,
  AUTH_FAILURE:    4,
  MFA_ENROLLED:    6,
  MFA_REVOKED:     4,
  ACCOUNT_LOCKED:  3,
  SESSION_CREATED: 6,
  SESSION_EXPIRED: 6,
  SUSPICIOUS_IP:   3,
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class LoggingService implements OnModuleDestroy {
  private readonly nestLogger = new Logger('SecurityAudit');
  private readonly udpClient: dgram.Socket;
  private readonly syslogHost: string;
  private readonly syslogPort: number;
  private readonly appName: string;
  private readonly env: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Optional() private readonly metrics?: MetricsService,
  ) {
    this.syslogHost = config.get<string>('SYSLOG_HOST') ?? 'localhost';
    this.syslogPort = parseInt(config.get<string>('SYSLOG_PORT') ?? '514', 10);
    this.appName    = config.get<string>('APP_NAME') ?? 'brokeria';
    this.env        = config.get<string>('NODE_ENV') ?? 'development';

    this.udpClient = dgram.createSocket('udp4');
    this.udpClient.on('error', (err) =>
      this.nestLogger.warn(`Syslog UDP error: ${err.message}`),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  /** Émet un événement de sécurité sur les 3 canaux (console, DB, syslog) */
  async emit(event: SecurityEvent): Promise<void> {
    const log: StructuredLog = {
      ...event,
      timestamp: new Date().toISOString(),
      app: this.appName,
      env: this.env,
    };

    // 1. Console / stdout (NestJS Logger → JSON)
    const jsonLine = JSON.stringify(log);
    if (log.success) {
      this.nestLogger.log(jsonLine);
    } else {
      this.nestLogger.warn(jsonLine);
    }

    // 2. Persistance en base (AuthLog)
    await this.persistToDb(log);

    // 3. Syslog UDP (RFC 5424) → SIEM
    this.sendSyslog(log);

    // 4. Métriques Prometheus
    this.updateMetrics(log);
  }

  // Raccourcis sémantiques ────────────────────────────────────────────────────

  authSuccess(userId: string, factor: AuthFactor, ip?: string, userAgent?: string) {
    return this.emit({ event_type: 'AUTH_SUCCESS', user_id: userId, factor, ip, user_agent: userAgent, success: true });
  }

  authFailure(userId: string | null, factor: AuthFactor, ip?: string, userAgent?: string, details?: string) {
    return this.emit({ event_type: 'AUTH_FAILURE', user_id: userId, factor, ip, user_agent: userAgent, success: false, details });
  }

  mfaEnrolled(userId: string, factor: AuthFactor, ip?: string) {
    return this.emit({ event_type: 'MFA_ENROLLED', user_id: userId, factor, ip, success: true });
  }

  mfaRevoked(userId: string, factor: AuthFactor, ip?: string) {
    return this.emit({ event_type: 'MFA_REVOKED', user_id: userId, factor, ip, success: true });
  }

  accountLocked(userId: string, ip?: string, details?: string) {
    return this.emit({ event_type: 'ACCOUNT_LOCKED', user_id: userId, ip, success: false, details });
  }

  sessionCreated(userId: string, ip?: string) {
    return this.emit({ event_type: 'SESSION_CREATED', user_id: userId, ip, success: true });
  }

  sessionExpired(userId: string, ip?: string) {
    return this.emit({ event_type: 'SESSION_EXPIRED', user_id: userId, ip, success: false });
  }

  suspiciousIp(userId: string | null, ip: string, details?: string) {
    return this.emit({ event_type: 'SUSPICIOUS_IP', user_id: userId, ip, success: false, details });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE
  // ═══════════════════════════════════════════════════════════════════════════

  private async persistToDb(log: StructuredLog): Promise<void> {
    try {
      await this.prisma.authLog.create({
        data: {
          userId:  log.user_id ?? null,
          action:  log.event_type,
          result:  log.success ? 'success' : 'failure',
          ip:      log.ip ?? null,
          detail:  log.details ?? (log.factor ? `factor:${log.factor}` : null),
        },
      });
    } catch (err) {
      this.nestLogger.warn(`DB log write failed: ${(err as Error).message}`);
    }
  }

  /**
   * Format RFC 5424 :
   *   <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG
   *
   * Facility 1 (user-level) × 8 + severity = PRI
   */
  private sendSyslog(log: StructuredLog): void {
    try {
      const severity   = SEVERITY_MAP[log.event_type];
      const facility   = 1;                          // user-level messages
      const priority   = facility * 8 + severity;
      const hostname   = 'brokeria-backend';
      const procId     = process.pid.toString();
      const msgId      = log.event_type;
      const structData = '-';
      const msg        = JSON.stringify(log);

      const syslogMsg =
        `<${priority}>1 ${log.timestamp} ${hostname} ${this.appName} ${procId} ${msgId} ${structData} ${msg}`;

      const buf = Buffer.from(syslogMsg, 'utf8');
      this.udpClient.send(buf, this.syslogPort, this.syslogHost);
    } catch (err) {
      this.nestLogger.warn(`Syslog send failed: ${(err as Error).message}`);
    }
  }

  private updateMetrics(log: StructuredLog): void {
    if (!this.metrics) return;
    try {
      if (log.event_type === 'AUTH_SUCCESS' || log.event_type === 'AUTH_FAILURE') {
        this.metrics.recordAuthAttempt(
          log.factor ?? 'unknown',
          log.success ? 'success' : 'failure',
        );
      }
      if (log.event_type === 'MFA_ENROLLED') {
        this.metrics.recordMfaEnrollment(log.factor ?? 'unknown', 'enroll');
      }
      if (log.event_type === 'MFA_REVOKED') {
        this.metrics.recordMfaEnrollment(log.factor ?? 'unknown', 'revoke');
      }
      if (log.event_type === 'SESSION_CREATED') {
        this.metrics.incrementActiveSessions();
      }
      if (log.event_type === 'SESSION_EXPIRED') {
        this.metrics.decrementActiveSessions();
      }
      if (log.event_type === 'ACCOUNT_LOCKED') {
        this.metrics.recordAccountLock();
      }
    } catch {
      // Ne pas laisser les métriques crasher le flux auth
    }
  }

  onModuleDestroy() {
    this.udpClient.close();
  }
}

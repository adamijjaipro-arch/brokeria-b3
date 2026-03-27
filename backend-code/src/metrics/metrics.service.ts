/**
 * MetricsService — Prometheus via prom-client
 *
 * Métriques exposées :
 *  - auth_attempts_total          (counter)  par facteur + résultat
 *  - auth_latency_seconds         (histogram) latence des opérations d'auth
 *  - active_sessions_total        (gauge)    sessions Redis actives
 *  - mfa_enrollments_total        (counter)  enrôlements MFA par facteur
 *  - http_errors_5xx_total        (counter)  erreurs serveur
 *  - account_locks_total          (counter)  verrouillages de compte
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry: Registry;

  // ─── Compteurs ────────────────────────────────────────────────────────────
  private readonly authAttempts: Counter<string>;
  private readonly mfaEnrollments: Counter<string>;
  private readonly accountLocks: Counter<string>;
  private readonly http5xxErrors: Counter<string>;

  // ─── Histogrammes ─────────────────────────────────────────────────────────
  private readonly authLatency: Histogram<string>;

  // ─── Jauges ───────────────────────────────────────────────────────────────
  private readonly activeSessions: Gauge<string>;

  constructor() {
    this.registry = new Registry();
    this.registry.setDefaultLabels({ app: 'brokeria' });

    // Métriques système Node.js (CPU, mémoire, event loop…)
    collectDefaultMetrics({ register: this.registry });

    // ── Auth attempts ──────────────────────────────────────────────────────
    this.authAttempts = new Counter({
      name:    'auth_attempts_total',
      help:    'Total authentication attempts by factor and result',
      labelNames: ['factor', 'result'],   // result: success | failure
      registers: [this.registry],
    });

    // ── Auth latency ──────────────────────────────────────────────────────
    this.authLatency = new Histogram({
      name:    'auth_latency_seconds',
      help:    'Authentication operation latency in seconds',
      labelNames: ['factor', 'operation'],
      buckets:  [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    // ── MFA enrollments ────────────────────────────────────────────────────
    this.mfaEnrollments = new Counter({
      name:    'mfa_enrollments_total',
      help:    'Total MFA enrollments by factor',
      labelNames: ['factor', 'action'],   // action: enroll | revoke
      registers: [this.registry],
    });

    // ── Active sessions ────────────────────────────────────────────────────
    this.activeSessions = new Gauge({
      name:    'active_sessions_total',
      help:    'Current number of active sessions (refresh tokens in Redis)',
      registers: [this.registry],
    });

    // ── 5xx errors ─────────────────────────────────────────────────────────
    this.http5xxErrors = new Counter({
      name:    'http_errors_5xx_total',
      help:    'Total HTTP 5xx errors',
      labelNames: ['route'],
      registers: [this.registry],
    });

    // ── Account locks ──────────────────────────────────────────────────────
    this.accountLocks = new Counter({
      name:    'account_locks_total',
      help:    'Total account lockouts triggered by brute-force protection',
      registers: [this.registry],
    });
  }

  onModuleInit() {
    // Les métriques par défaut sont déjà collectées dans le constructeur
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API — appelé depuis LoggingService ou les guards
  // ═══════════════════════════════════════════════════════════════════════════

  recordAuthAttempt(factor: string, result: 'success' | 'failure'): void {
    this.authAttempts.inc({ factor, result });
  }

  /** Retourne un timer Prometheus — appeler timer() pour enregistrer la durée */
  startAuthTimer(factor: string, operation: string): () => void {
    return this.authLatency.startTimer({ factor, operation });
  }

  recordMfaEnrollment(factor: string, action: 'enroll' | 'revoke'): void {
    this.mfaEnrollments.inc({ factor, action });
  }

  setActiveSessions(count: number): void {
    this.activeSessions.set(count);
  }

  incrementActiveSessions(): void {
    this.activeSessions.inc();
  }

  decrementActiveSessions(): void {
    this.activeSessions.dec();
  }

  record5xxError(route: string): void {
    this.http5xxErrors.inc({ route });
  }

  recordAccountLock(): void {
    this.accountLocks.inc();
  }

  /** Retourne les métriques au format texte Prometheus */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}

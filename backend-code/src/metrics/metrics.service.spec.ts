/**
 * Tests unitaires — MetricsService
 * Vérifie : compteurs, jauges, format prometheus
 */
import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();
    service = module.get<MetricsService>(MetricsService);
  });

  it('getMetrics retourne du texte Prometheus non vide', async () => {
    const metrics = await service.getMetrics();
    expect(typeof metrics).toBe('string');
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics).toContain('auth_attempts_total');
  });

  it('recordAuthAttempt incrémente le compteur auth_attempts_total', async () => {
    service.recordAuthAttempt('password', 'success');
    service.recordAuthAttempt('password', 'failure');
    service.recordAuthAttempt('totp', 'success');

    const metrics = await service.getMetrics();
    expect(metrics).toContain('auth_attempts_total');
    expect(metrics).toContain('factor="password"');
    expect(metrics).toContain('factor="totp"');
  });

  it('recordMfaEnrollment incrémente mfa_enrollments_total', async () => {
    service.recordMfaEnrollment('totp', 'enroll');
    service.recordMfaEnrollment('webauthn', 'enroll');
    service.recordMfaEnrollment('totp', 'revoke');

    const metrics = await service.getMetrics();
    expect(metrics).toContain('mfa_enrollments_total');
  });

  it('activeSessions gauge monte et descend', async () => {
    service.setActiveSessions(10);
    service.incrementActiveSessions();
    service.decrementActiveSessions();

    const metrics = await service.getMetrics();
    expect(metrics).toContain('active_sessions_total');
  });

  it('record5xxError incrémente http_errors_5xx_total', async () => {
    service.record5xxError('/auth/login');
    const metrics = await service.getMetrics();
    expect(metrics).toContain('http_errors_5xx_total');
  });

  it('recordAccountLock incrémente account_locks_total', async () => {
    service.recordAccountLock();
    const metrics = await service.getMetrics();
    expect(metrics).toContain('account_locks_total');
  });

  it('startAuthTimer retourne une fonction qui enregistre la durée', async () => {
    const done = service.startAuthTimer('password', 'login');
    expect(typeof done).toBe('function');
    // Simule une opération rapide
    await new Promise((r) => setTimeout(r, 10));
    done();

    const metrics = await service.getMetrics();
    expect(metrics).toContain('auth_latency_seconds');
  });

  it('getContentType retourne le bon content-type Prometheus', () => {
    const ct = service.getContentType();
    expect(ct).toContain('text/plain');
  });
});

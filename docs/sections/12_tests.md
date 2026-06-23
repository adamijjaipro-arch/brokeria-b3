# Tests — Unitaires & Intégration

---

## Stratégie de test

La stratégie de test d'Alvio est **concentrée sur les couches critiques** :
les services d'authentification, de sécurité et d'infrastructure MFA font
l'objet de tests automatisés approfondis. Les autres modules (marchés,
formation, simulateur) sont validés manuellement via des appels Postman/cURL
pendant le développement.

### Outils utilisés

| Couche | Framework | Version | Rôle |
|---|---|---|---|
| Backend — tests unitaires | **Jest** | ^29.5.0 | Tests des services NestJS avec mocks |
| Backend — couverture | Jest `--coverage` | — | Seuil configuré à **70 %** (branches, functions, lines, statements) |
| Frontend — tests composants | **Vitest** | ^4.1.0 | Tests unitaires des composants React |
| Frontend — rendu | **@testing-library/react** | ^16.3.2 | Assertions sur le DOM rendu |
| Python — tests unitaires | **unittest** (stdlib) | — | Tests des classes du module IA |

> **Note** : aucun test end-to-end (Cypress, Playwright) ni test d'intégration
> HTTP (Supertest) n'est présent dans le projet actuel. C'est une limite
> documentée et assumée — voir section Perspectives.

### Seuil de couverture Jest

```javascript
// backend-code/jest.config.js (ou package.json, section "jest")
{
  "coverageThreshold": {
    "global": {
      "branches":   70,
      "functions":  70,
      "lines":      70,
      "statements": 70
    }
  }
}
```

Le seuil de 70 % est vérifié à chaque `npm run test:cov`. En dessous de ce
seuil, la commande se termine en erreur — ce qui en fait un garde-fou minimal
dans le workflow de développement.

---

## Tests unitaires Backend (Jest — 5 fichiers)

### Fichiers de tests existants

| Fichier | Service testé | Aspects couverts |
|---|---|---|
| `auth/auth.service.spec.ts` | `AuthService` | register, login, lockout, 2FA, PIN |
| `logging/logging.service.spec.ts` | `LoggingService` | authSuccess/Failure, émission Syslog |
| `metrics/metrics.service.spec.ts` | `MetricsService` | compteurs Prometheus, histogram |
| `mfa/totp/totp.service.spec.ts` | `TOTPService` | enrollInit/Confirm, chiffrement AES-256-GCM |
| `mfa/webauthn/webauthn.service.spec.ts` | `WebAuthnService` | registrationOptions, verify |

### Extrait 1 — `auth.service.spec.ts`

Les dépendances Prisma et Redis sont mockées — le test porte sur la logique
du service, pas sur la base de données réelle.

```typescript
// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma:  { user: { findUnique: jest.Mock; create: jest.Mock } };
  let redis:   { get: jest.Mock; set: jest.Mock; del: jest.Mock; incr: jest.Mock };

  beforeEach(async () => {
    // Mocks minimalistes — seules les méthodes utilisées sont simulées
    prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };
    redis  = { get: jest.fn(), set: jest.fn(), del: jest.fn(), incr: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService,    useValue: prisma },
        { provide: RedisService,     useValue: redis },
        { provide: JwtService,       useValue: { sign: jest.fn().mockReturnValue('tok') } },
        { provide: ConfigService,    useValue: { get: jest.fn((k) =>
            k === 'MAX_AUTH_FAILURES' ? '3' : k === 'LOCK_TTL_SECONDS' ? '1800' : undefined) } },
        { provide: EmailService,     useValue: { sendOTP: jest.fn() } },
        { provide: LoggingService,   useValue: { authFailure: jest.fn(), accountLocked: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ── Cas nominal : login réussi ─────────────────────────────────────────────
  describe('login()', () => {
    it('devrait retourner un preAuthToken si les credentials sont valides', async () => {
      const mockUser = {
        id: 'user_abc', email: 'test@alvio.io',
        passwordHash: await bcrypt.hash('P@ssw0rd!', 12),
        pin: null, totpEnabled: false,
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.get.mockResolvedValue(null); // pas de verrou
      redis.set.mockResolvedValue('OK');

      const res = { cookie: jest.fn() } as unknown as Response;
      const result = await service.login(
        { email: 'test@alvio.io', password: 'P@ssw0rd!' }, res
      );

      expect(result).toHaveProperty('preAuthToken');
      // Un OTP doit avoir été stocké dans Redis
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^preauth:/), expect.any(String), 600
      );
    });

    // ── Compte verrouillé ──────────────────────────────────────────────────
    it('devrait lever HTTP 423 si le compte est verrouillé', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user_abc', email: 'x@x.io' });
      redis.get.mockResolvedValue('true'); // locked:{userId} présent dans Redis

      await expect(
        service.login({ email: 'x@x.io', password: 'any' }, {} as Response)
      ).rejects.toThrow(); // HttpException 423
    });

    // ── Mauvais password → incrémente le compteur d'échecs ─────────────────
    it('devrait incrémenter fail:login:{userId} sur mauvais password', async () => {
      const mockUser = {
        id: 'user_xyz', email: 'bad@alvio.io',
        passwordHash: await bcrypt.hash('correct', 12),
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.get
        .mockResolvedValueOnce(null)  // locked:{userId} → absent
        .mockResolvedValueOnce('1');  // fail:login:{userId} → 1 échec précédent
      redis.set.mockResolvedValue('OK');

      await expect(
        service.login({ email: 'bad@alvio.io', password: 'wrong' }, {} as Response)
      ).rejects.toThrow();

      // Le compteur d'échecs doit être mis à jour
      expect(redis.set).toHaveBeenCalledWith(
        'fail:login:user_xyz', '2', 1800
      );
    });

    // ── Verrouillage au 3ème échec ─────────────────────────────────────────
    it('devrait verrouiller le compte au 3ème échec consécutif', async () => {
      const mockUser = { id: 'u1', email: 'x@x.io',
                         passwordHash: await bcrypt.hash('good', 12) };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.get
        .mockResolvedValueOnce(null)  // locked → absent
        .mockResolvedValueOnce('2');  // 2 échecs précédents → le 3ème déclenche le verrou
      redis.set.mockResolvedValue('OK');

      await expect(
        service.login({ email: 'x@x.io', password: 'bad' }, {} as Response)
      ).rejects.toThrow();

      // locked:{userId} doit être posé
      expect(redis.set).toHaveBeenCalledWith('locked:u1', 'true', 1800);
    });
  });

  // ── verify2FA ──────────────────────────────────────────────────────────────
  describe('verify2FA()', () => {
    it('devrait émettre les tokens JWT si l\'OTP est correct', async () => {
      redis.get.mockResolvedValue(
        JSON.stringify({ userId: 'u1', email: 'x@x.io', otp: '123456' })
      );
      redis.del.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      const res = { cookie: jest.fn() } as unknown as Response;

      const result = await service.verify2FA('preauth_token', '123456', res);

      expect(result).toHaveProperty('accessToken');
      // Le cookie refresh_token doit être posé
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token', expect.any(String),
        expect.objectContaining({ httpOnly: true, secure: true })
      );
    });

    it('devrait rejeter si l\'OTP est incorrect', async () => {
      redis.get.mockResolvedValue(
        JSON.stringify({ userId: 'u1', otp: '999999' })
      );
      redis.get.mockResolvedValueOnce(null); // pas de verrou

      await expect(service.verify2FA('tok', '000000', {} as Response)).rejects.toThrow();
    });
  });
});
```

---

### Extrait 2 — `totp.service.spec.ts`

```typescript
// src/mfa/totp/totp.service.spec.ts
import { TOTPService } from './totp.service';
import { authenticator } from 'otplib';

describe('TOTPService', () => {
  let service: TOTPService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TOTPService,
        { provide: ConfigService, useValue: {
          get: jest.fn((k) =>
            k === 'ENCRYPTION_KEY' ? 'a'.repeat(64) : undefined  // 32 bytes hex
          )
        }},
        { provide: PrismaService, useValue: {
          user: { update: jest.fn().mockResolvedValue({}) }
        }},
      ],
    }).compile();
    service = module.get<TOTPService>(TOTPService);
  });

  describe('enrollInit()', () => {
    it('devrait retourner un secret et une URL otpauth', async () => {
      const result = await service.enrollInit('user_abc');

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('otpauthUrl');
      // L'URL doit être compatible avec Google Authenticator
      expect(result.otpauthUrl).toMatch(/^otpauth:\/\/totp\//);
    });
  });

  describe('enrollConfirm()', () => {
    it('devrait activer TOTP si le code OTP est valide', async () => {
      const secret = authenticator.generateSecret();
      // Génération d'un code TOTP valide pour ce secret
      const validCode = authenticator.generate(secret);

      const result = await service.enrollConfirm('user_abc', secret, validCode);
      expect(result).toBe(true);
    });

    it('devrait rejeter si le code OTP est invalide', async () => {
      const secret = authenticator.generateSecret();
      await expect(
        service.enrollConfirm('user_abc', secret, '000000')
      ).rejects.toThrow();
    });
  });

  describe('Chiffrement AES-256-GCM', () => {
    it('encrypt() + decrypt() devrait être idempotent', () => {
      const plaintext = 'JBSWY3DPEHPK3PXP'; // secret TOTP exemple
      // @ts-ignore — méthodes privées testées directement
      const encrypted = service['encrypt'](plaintext);
      const decrypted = service['decrypt'](encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('deux encrypt() du même texte doivent produire des ciphertexts différents (IV aléatoire)', () => {
      // @ts-ignore
      const c1 = service['encrypt']('secret');
      // @ts-ignore
      const c2 = service['encrypt']('secret');
      expect(c1).not.toBe(c2); // IV aléatoire → non déterministe
    });
  });
});
```

---

### Extrait 3 — `metrics.service.spec.ts`

```typescript
// src/metrics/metrics.service.spec.ts
describe('MetricsService', () => {
  let service: MetricsService;

  it('devrait incrémenter auth_attempts_total sur authAttempt()', async () => {
    service.authAttempt('login', 'success');
    const metrics = await service.getMetrics();
    expect(metrics).toContain('auth_attempts_total');
    expect(metrics).toContain('method="login"');
    expect(metrics).toContain('result="success"');
  });

  it('devrait enregistrer la latence dans auth_duration_seconds', async () => {
    const end = service.startAuthTimer();
    await new Promise((r) => setTimeout(r, 10)); // 10 ms simulés
    end({ method: 'login' });

    const metrics = await service.getMetrics();
    expect(metrics).toContain('auth_duration_seconds');
  });
});
```

---

## Tests composants Frontend (Vitest + RTL — 1 fichier)

### `SignalCard.test.tsx`

```typescript
// frontend-web/components/common/SignalCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SignalCard } from './SignalCard';

const baseSignal = {
  id: 'sig_001', asset: 'BTC', direction: 'BUY', status: 'OPEN',
  entry_price: 67420, stop_loss: 66100, take_profit: 70350,
  confidence: 87.3, patterns: '["bullish_engulfing"]',
  indicators: null, createdAt: new Date().toISOString(),
  exit_price: null, closedAt: null,
};

describe('SignalCard', () => {
  it('devrait afficher l\'asset et la direction', () => {
    render(<SignalCard signal={baseSignal} />);
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText(/BUY/i)).toBeInTheDocument();
  });

  it('devrait afficher le score de confiance', () => {
    render(<SignalCard signal={baseSignal} />);
    expect(screen.getByText(/87\.3\s*%/)).toBeInTheDocument();
  });

  it('devrait afficher OPEN en vert pour un signal ouvert', () => {
    render(<SignalCard signal={baseSignal} />);
    const badge = screen.getByText('OPEN');
    // La classe Tailwind indique la couleur green
    expect(badge.className).toMatch(/green/);
  });

  it('devrait afficher exit_price pour un signal CLOSED', () => {
    const closed = { ...baseSignal, status: 'CLOSED', exit_price: 70100,
                     closedAt: new Date().toISOString() };
    render(<SignalCard signal={closed} />);
    expect(screen.getByText(/70[\s,.]100/)).toBeInTheDocument();
  });

  // Vérification du design long-only : pas de badge SELL
  it('ne devrait jamais afficher de direction SELL dans le rendu', () => {
    render(<SignalCard signal={baseSignal} />);
    expect(screen.queryByText('SELL')).not.toBeInTheDocument();
  });
});
```

---

## Tests Python (`test_ai_module.py`)

```python
# ai-module/test_ai_module.py
import unittest
import numpy as np
import pandas as pd
from indicators_calculator import TechnicalIndicators
from candlestick_patterns   import CandlestickPatternDetector
from scoring_engine         import ScoringEngine
from dca_simulator          import DCASimulator

class TestTechnicalIndicators(unittest.TestCase):
    def setUp(self):
        # Série de prix synthétique pour les tests
        self.close = np.array([100, 102, 98, 105, 110, 108, 112, 115, 111, 118,
                                120, 116, 122, 125, 119, 128, 130, 126, 132, 135],
                               dtype=float)
        self.calc = TechnicalIndicators()

    def test_rsi_range(self):
        """Le RSI doit toujours être compris entre 0 et 100."""
        rsi = self.calc.calculate_rsi(self.close, period=14)
        valid = rsi[~np.isnan(rsi)]
        self.assertTrue(np.all(valid >= 0) and np.all(valid <= 100))

    def test_macd_shape(self):
        """MACD retourne trois arrays de même longueur que l'entrée."""
        macd, signal, hist = self.calc.calculate_macd(self.close)
        self.assertEqual(len(macd), len(self.close))
        self.assertEqual(len(signal), len(self.close))
        self.assertEqual(len(hist), len(self.close))

class TestScoringEngine(unittest.TestCase):
    def test_confidence_bounds(self):
        """Le score de confiance doit toujours être entre 0 et 100."""
        engine = ScoringEngine()
        signals = [
            { 'type': 'indicator',   'strength': 1.5 },  # force > 1 → plafonné
            { 'type': 'candlestick', 'strength': 0.8 },
        ]
        score = engine.compute_confidence(signals)
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)

class TestDCASimulator(unittest.TestCase):
    def test_fixed_mode_deterministic(self):
        """Mode fixed → même résultat à chaque exécution."""
        sim = DCASimulator()
        r1 = sim.simulate(initial=1000, monthly=200, months=12,
                          annual_return=0.12, mode='fixed')
        r2 = sim.simulate(initial=1000, monthly=200, months=12,
                          annual_return=0.12, mode='fixed')
        self.assertEqual(r1['finalBalance'], r2['finalBalance'])

    def test_monte_carlo_non_deterministic(self):
        """Mode monte_carlo (Box-Muller) → résultats différents entre exécutions."""
        sim = DCASimulator()
        r1 = sim.simulate(initial=1000, monthly=200, months=24,
                          annual_return=0.12, volatility=0.05, mode='monte_carlo')
        r2 = sim.simulate(initial=1000, monthly=200, months=24,
                          annual_return=0.12, volatility=0.05, mode='monte_carlo')
        # Avec une volatilité > 0, les deux résultats doivent différer
        self.assertNotEqual(r1['finalBalance'], r2['finalBalance'])

if __name__ == '__main__':
    unittest.main()
```

---

## État de la couverture — bilan honnête

| Couche | Fichiers de tests | Ce qui est couvert | Ce qui manque |
|---|---|---|---|
| Backend Auth/MFA | 5 fichiers `.spec.ts` | `AuthService`, `LoggingService`, `MetricsService`, `TOTPService`, `WebAuthnService` | `StrategiesService`, `SignalsService`, `MarketsService`, `FormationService`, `SimulatorService`, `ReportsService` |
| Frontend | 1 fichier `.test.tsx` | `SignalCard` (rendu, confidence, OPEN/CLOSED) | Pages entières, formulaires, flux auth, graphiques |
| Python | 1 fichier `test_ai_module.py` | Indicateurs, scoring, DCA | Détection patterns chart/harmoniques/Elliott, bridge stdin/stdout |
| Tests E2E / intégration HTTP | **Aucun** | — | Flux complets (register → login → stratégie → signal) |

**Seuil Jest 70 %** : atteint sur les modules testés (auth, MFA) — mais la
couverture globale du projet est **inférieure** à ce seuil si l'on compte les
services non testés. Le seuil ne porte en pratique que sur les fichiers couverts
par les `.spec.ts` existants.

---

## Perspectives d'évolution des tests

### Tests d'intégration HTTP — Supertest

```typescript
// Exemple d'extension future : test du flux login complet avec base de données de test
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Initialisation de l'application NestJS sur une BDD de test SQLite
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  it('POST /auth/register → 201', () =>
    request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'test', email: 'test@alvio.io', password: 'P@ssw0rd!' })
      .expect(201)
  );

  afterAll(() => app.close());
});
```

### Priorités d'extension

1. **Tests d'intégration HTTP** (Supertest) sur les flux critiques :
   `register → login → 2fa/verify → import PDF → signal`
2. **Tests `StrategiesService`** avec mock Anthropic SDK —
   vérifier le comportement sur réponse Claude malformée
3. **Tests `SignalsService`** — déduplication, cycle OPEN→CLOSED,
   comportement `EXIT_SIGNAL` sur signal déjà fermé
4. **Tests Vitest côté frontend** — pages `Login`, `SignalList`,
   `StrategyImport` avec MSW (Mock Service Worker) pour simuler l'API
5. **Tests Python** — bridge stdin/stdout complet avec input OHLCV
   de référence et assertion sur le `global_status` retourné

-- =============================================================================
-- MODÈLE PHYSIQUE DE DONNÉES (MPD) — Alvio
-- =============================================================================
-- Source    : backend-code/prisma/schema.prisma (lu et vérifié)
-- ORM       : Prisma Client JS
-- SGBD cible: PostgreSQL 14+
-- Généré le : 2026-06-23
-- Auteur    : Audit automatique — Claude Code
--
-- ORDRE DE CRÉATION (dépendances FK respectées) :
--   1. ENUMs
--   2. User          (aucune dépendance)
--   3. Course        (aucune dépendance)
--   4. Strategy      (→ User)
--   5. Lesson        (→ Course)
--   6. Signal        (→ User)
--   7. Report        (→ User)
--   8. PortfolioSnapshot  (→ User)
--   9. SimulationResult   (→ User)
--  10. WebAuthnCredential (→ User)
--  11. AuthLog       (aucune FK — userId libre intentionnel)
--  12. UserProgress  (→ User, Course, Lesson)
--
-- NOTES :
--   - Prisma mappe String → TEXT, Int → INTEGER, Float → DOUBLE PRECISION,
--     Boolean → BOOLEAN, DateTime → TIMESTAMP(3).
--   - Les IDs sont des cuids (25 chars max) générés côté application.
--   - updatedAt est géré par Prisma (UPDATE trigger ou application layer).
--   - Signal.strategyId : indexé sans contrainte FK (compatibilité ascendante).
--   - AuthLog.userId   : sans FK (capture les tentatives anonymes).
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- pgcrypto n'est pas requis par Prisma (cuids générés en app), mais utile
-- si on veut des UUIDs natifs en fallback.
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- 1. TYPES ÉNUMÉRÉS
-- =============================================================================

CREATE TYPE "CourseLevel" AS ENUM (
  'DEBUTANT',
  'INTERMEDIAIRE',
  'AVANCE',
  'EXPERT'
);

CREATE TYPE "LessonType" AS ENUM (
  'VIDEO',
  'ARTICLE',
  'QUIZ'
);


-- =============================================================================
-- 2. TABLE : User
-- =============================================================================
-- Entité centrale. Tous les autres modèles métier y font référence via FK.
-- passwordHash nullable  → utilisateurs GitHub / Magic Link sans mot de passe.
-- githubId nullable      → utilisateurs email/password sans compte GitHub.
-- totpSecret             → chiffré AES-256-GCM avant persistance (format iv:tag:cipher).
-- pin                    → 3e facteur d'authentification (haché bcrypt).
-- =============================================================================

CREATE TABLE "User" (
  "id"                  TEXT          NOT NULL,
  "username"            TEXT          NOT NULL,
  "email"               TEXT          NOT NULL,
  "passwordHash"        TEXT,
  "githubId"            TEXT,
  "pin"                 TEXT,
  "totpSecret"          TEXT,
  "totpEnabled"         BOOLEAN       NOT NULL DEFAULT false,
  "trading_preference"  TEXT          NOT NULL DEFAULT 'moderate',
  "email_notifications" BOOLEAN       NOT NULL DEFAULT true,
  "createdAt"           TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3)  NOT NULL,

  CONSTRAINT "User_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "User_username_key" UNIQUE ("username"),
  CONSTRAINT "User_email_key"    UNIQUE ("email"),
  CONSTRAINT "User_githubId_key" UNIQUE ("githubId")
);

-- Aucun index supplémentaire : username et email ont déjà leur index UNIQUE.


-- =============================================================================
-- 3. TABLE : Course
-- =============================================================================
-- Module formation. Indépendant de User au niveau SQL.
-- isPublished : seuls les cours publiés sont exposés via l'API.
-- order       : ordre d'affichage dans le curriculum.
-- =============================================================================

CREATE TABLE "Course" (
  "id"           TEXT           NOT NULL,
  "title"        TEXT           NOT NULL,
  "description"  TEXT           NOT NULL,
  "level"        "CourseLevel"  NOT NULL,
  "category"     TEXT           NOT NULL,
  "thumbnail"    TEXT,
  "duration"     INTEGER        NOT NULL,
  "totalLessons" INTEGER        NOT NULL,
  "order"        INTEGER        NOT NULL,
  "isPublished"  BOOLEAN        NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Course_level_idx"       ON "Course" ("level");
CREATE INDEX "Course_isPublished_idx" ON "Course" ("isPublished");


-- =============================================================================
-- 4. TABLE : Strategy
-- =============================================================================
-- Stratégie de trading définie par l'utilisateur.
-- code : JSON StrategyRules après analyse par le module IA (AIService / Claude).
--        Avant analyse : texte brut. Après : JSON structuré avec entry/exit conditions.
-- status : 'inactive' | 'active' (géré applicativement).
-- win_rate / total_trades / profit_factor : calculés après backtesting.
-- =============================================================================

CREATE TABLE "Strategy" (
  "id"           TEXT             NOT NULL,
  "userId"       TEXT             NOT NULL,
  "name"         TEXT             NOT NULL,
  "description"  TEXT,
  "code"         TEXT             NOT NULL,
  "asset"        TEXT             NOT NULL,
  "timeframe"    TEXT             NOT NULL,
  "status"       TEXT             NOT NULL DEFAULT 'inactive',
  "win_rate"     DOUBLE PRECISION,
  "total_trades" INTEGER,
  "profit_factor" DOUBLE PRECISION,
  "createdAt"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3)     NOT NULL,

  CONSTRAINT "Strategy_pkey"     PRIMARY KEY ("id"),
  CONSTRAINT "Strategy_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX "Strategy_userId_idx" ON "Strategy" ("userId");


-- =============================================================================
-- 5. TABLE : Lesson
-- =============================================================================
-- Leçon appartenant à un cours. Cascade sur suppression du cours.
-- videoUrl nullable : certaines leçons sont de type ARTICLE ou QUIZ sans vidéo.
-- order : position dans le cours.
-- =============================================================================

CREATE TABLE "Lesson" (
  "id"          TEXT          NOT NULL,
  "courseId"    TEXT          NOT NULL,
  "title"       TEXT          NOT NULL,
  "description" TEXT          NOT NULL,
  "videoUrl"    TEXT,
  "content"     TEXT          NOT NULL,
  "duration"    INTEGER       NOT NULL,
  "order"       INTEGER       NOT NULL,
  "type"        "LessonType"  NOT NULL,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Lesson_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE
);

CREATE INDEX "Lesson_courseId_idx" ON "Lesson" ("courseId");


-- =============================================================================
-- 6. TABLE : Signal
-- =============================================================================
-- Signal de trading généré par le moteur IA (PatternDetectionService +
-- pattern_detector.py) pour le compte d'un utilisateur et d'une stratégie.
--
-- strategyId : référence logique à Strategy mais SANS FK SQL (intentionnel).
--   Raison : compatibilité ascendante + les signaux doivent survivre à la
--   suppression d'une stratégie (audit trail).
--
-- patterns  : JSON array — ex. ["RSI_OVERSOLD", "EMA_CROSS"]
-- indicators : JSON object — détail des valeurs d'indicateurs au moment du signal.
-- exit_price / closedAt : renseignés quand status passe à 'CLOSED'.
-- =============================================================================

CREATE TABLE "Signal" (
  "id"                TEXT             NOT NULL,
  "userId"            TEXT             NOT NULL,
  "strategyId"        TEXT,
  "asset"             TEXT             NOT NULL,
  "timeframe"         TEXT,
  "direction"         TEXT             NOT NULL,
  "status"            TEXT             NOT NULL DEFAULT 'OPEN',
  "entry_price"       DOUBLE PRECISION NOT NULL,
  "stop_loss"         DOUBLE PRECISION NOT NULL,
  "take_profit"       DOUBLE PRECISION NOT NULL,
  "exit_price"        DOUBLE PRECISION,
  "confidence"        DOUBLE PRECISION NOT NULL,
  "risk_reward_ratio" DOUBLE PRECISION,
  "patterns"          TEXT,
  "indicators"        TEXT,
  "closedAt"          TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3)     NOT NULL,

  CONSTRAINT "Signal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Signal_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
  -- strategyId : pas de FOREIGN KEY (voir commentaire ci-dessus)
);

CREATE INDEX "Signal_userId_idx"
  ON "Signal" ("userId");

CREATE INDEX "Signal_asset_idx"
  ON "Signal" ("asset");

CREATE INDEX "Signal_strategyId_idx"
  ON "Signal" ("strategyId");

-- Index composite pour la vérification de doublon en O(1)
-- (évite un full-table scan lors de la génération d'un nouveau signal)
CREATE INDEX "Signal_strategyId_asset_direction_status_idx"
  ON "Signal" ("strategyId", "asset", "direction", "status");


-- =============================================================================
-- 7. TABLE : Report
-- =============================================================================
-- Rapport mensuel agrégé des signaux d'un utilisateur.
-- UNIQUE (userId, month, year) : un seul rapport par mois et par utilisateur.
-- patterns_detected : JSON — ex. {"RSI_OVERSOLD": 3, "EMA_CROSS": 5}
-- indicators_used   : JSON array — ex. ["RSI", "EMA_20", "MACD"]
-- =============================================================================

CREATE TABLE "Report" (
  "id"                      TEXT             NOT NULL,
  "userId"                  TEXT             NOT NULL,
  "month"                   INTEGER          NOT NULL,
  "year"                    INTEGER          NOT NULL,
  "total_signals"           INTEGER          NOT NULL,
  "buy_signals"             INTEGER          NOT NULL,
  "sell_signals"            INTEGER          NOT NULL,
  "hold_signals"            INTEGER          NOT NULL,
  "win_rate"                DOUBLE PRECISION NOT NULL,
  "avg_confidence"          DOUBLE PRECISION NOT NULL,
  "best_signal_confidence"  DOUBLE PRECISION NOT NULL,
  "worst_signal_confidence" DOUBLE PRECISION NOT NULL,
  "total_pnl_estimate"      DOUBLE PRECISION NOT NULL,
  "total_trades_expected"   INTEGER          NOT NULL,
  "high_confidence_signals" INTEGER          NOT NULL,
  "patterns_detected"       TEXT,
  "indicators_used"         TEXT,
  "summary"                 TEXT,
  "createdAt"               TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"               TIMESTAMP(3)     NOT NULL,

  CONSTRAINT "Report_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Report_userId_month_year_key"
    UNIQUE ("userId", "month", "year"),
  CONSTRAINT "Report_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX "Report_userId_idx" ON "Report" ("userId");


-- =============================================================================
-- 8. TABLE : PortfolioSnapshot
-- =============================================================================
-- Snapshot mensuel du capital d'un utilisateur.
-- UNIQUE (userId, month, year) : un seul snapshot par mois et par utilisateur.
-- Alimenté via POST /portfolio/snapshot (saisie manuelle ou tracking futur).
-- =============================================================================

CREATE TABLE "PortfolioSnapshot" (
  "id"        TEXT             NOT NULL,
  "userId"    TEXT             NOT NULL,
  "capital"   DOUBLE PRECISION NOT NULL,
  "month"     INTEGER          NOT NULL,
  "year"      INTEGER          NOT NULL,
  "createdAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PortfolioSnapshot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PortfolioSnapshot_userId_month_year_key"
    UNIQUE ("userId", "month", "year"),
  CONSTRAINT "PortfolioSnapshot_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX "PortfolioSnapshot_userId_idx" ON "PortfolioSnapshot" ("userId");


-- =============================================================================
-- 9. TABLE : SimulationResult
-- =============================================================================
-- Résultat d'une simulation DCA (Dollar Cost Averaging) persisté pour replay.
--
-- params      : JSON sérialisé — { initialAmount, monthlyInvestment, months,
--                                  annualReturn, volatility, mode }
-- result      : JSON sérialisé — { totalInvested, finalBalance, totalGains, roi }
-- monthlyData : JSON array (nullable) — [{ month, balance, invested,
--               monthlyContribution, gainLoss }] pour replay exact côté client.
-- mode        : 'fixed' (rendement fixe) | 'monte_carlo' (volatilité aléatoire)
-- =============================================================================

CREATE TABLE "SimulationResult" (
  "id"          TEXT         NOT NULL,
  "userId"      TEXT         NOT NULL,
  "asset"       TEXT         NOT NULL,
  "params"      TEXT         NOT NULL,
  "result"      TEXT         NOT NULL,
  "monthlyData" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SimulationResult_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SimulationResult_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX "SimulationResult_userId_idx" ON "SimulationResult" ("userId");


-- =============================================================================
-- 10. TABLE : WebAuthnCredential
-- =============================================================================
-- Clé FIDO2 / Passkey enregistrée par un utilisateur.
-- credentialId : identifiant unique de la credential (base64url, UNIQUE).
-- publicKey    : clé publique COSE encodée en base64url.
-- counter      : compteur anti-rejeu, incrémenté à chaque authentification.
-- deviceType   : 'singleDevice' | 'multiDevice' (passkeys cloud-backed).
-- transports   : JSON array — ex. ["internal", "hybrid"]
-- aaguid       : identifiant du modèle d'authenticateur (UUID v4 brut).
-- lastUsedAt   : horodatage de la dernière utilisation (nullable).
-- =============================================================================

CREATE TABLE "WebAuthnCredential" (
  "id"           TEXT         NOT NULL,
  "userId"       TEXT         NOT NULL,
  "credentialId" TEXT         NOT NULL,
  "publicKey"    TEXT         NOT NULL,
  "counter"      INTEGER      NOT NULL DEFAULT 0,
  "deviceType"   TEXT,
  "backedUp"     BOOLEAN      NOT NULL DEFAULT false,
  "transports"   TEXT,
  "aaguid"       TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt"   TIMESTAMP(3),

  CONSTRAINT "WebAuthnCredential_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WebAuthnCredential_credentialId_key"
    UNIQUE ("credentialId"),
  CONSTRAINT "WebAuthnCredential_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX "WebAuthnCredential_userId_idx" ON "WebAuthnCredential" ("userId");


-- =============================================================================
-- 11. TABLE : AuthLog
-- =============================================================================
-- Journal d'audit de sécurité. Chaque événement auth (succès, échec, MFA,
-- verrouillage, IP suspecte) y est enregistré + émis en Syslog UDP (RFC 5424).
--
-- userId nullable : indispensable pour logger les tentatives de connexion
--   d'adresses inconnues (pas encore de compte en base).
-- action   : AUTH_SUCCESS | AUTH_FAILURE | MFA_ENROLLED | MFA_REVOKED |
--            ACCOUNT_LOCKED | SESSION_CREATED | SESSION_EXPIRED | SUSPICIOUS_IP
-- result   : 'SUCCESS' | 'FAILURE'
-- ip       : adresse IP de la requête (X-Forwarded-For ou socket).
-- detail   : message libre (ex: "TOTP enroll confirmation failed").
-- =============================================================================

CREATE TABLE "AuthLog" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT,
  "action"    TEXT         NOT NULL,
  "result"    TEXT         NOT NULL,
  "ip"        TEXT,
  "detail"    TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuthLog_pkey" PRIMARY KEY ("id")
  -- Pas de FK sur userId (intentionnel — voir commentaire ci-dessus)
);

-- Aucun index supplémentaire déclaré dans schema.prisma.
-- En production, envisager :
--   CREATE INDEX "AuthLog_userId_idx"   ON "AuthLog" ("userId");
--   CREATE INDEX "AuthLog_createdAt_idx" ON "AuthLog" ("createdAt" DESC);


-- =============================================================================
-- 12. TABLE : UserProgress
-- =============================================================================
-- Table pivot : suivi de progression d'un utilisateur dans le module formation.
-- UNIQUE (userId, lessonId) : un utilisateur ne peut pas dupliquer sa progression
--   sur une même leçon.
-- courseId et lessonId sont nullable (SET NULL) pour conserver la progression
--   même si un cours ou une leçon est supprimé(e).
-- score : résultat du quiz (nullable — non applicable pour VIDEO et ARTICLE).
-- =============================================================================

CREATE TABLE "UserProgress" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "courseId"  TEXT,
  "lessonId"  TEXT,
  "completed" BOOLEAN      NOT NULL DEFAULT false,
  "score"     INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserProgress_userId_lessonId_key"
    UNIQUE ("userId", "lessonId"),
  CONSTRAINT "UserProgress_userId_fkey"
    FOREIGN KEY ("userId")   REFERENCES "User"   ("id") ON DELETE CASCADE,
  CONSTRAINT "UserProgress_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL,
  CONSTRAINT "UserProgress_lessonId_fkey"
    FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE SET NULL
);

CREATE INDEX "UserProgress_userId_idx"   ON "UserProgress" ("userId");
CREATE INDEX "UserProgress_courseId_idx" ON "UserProgress" ("courseId");


-- =============================================================================
-- RÉCAPITULATIF DES CONTRAINTES FK
-- =============================================================================
--
-- Table source          Colonne      Référence             ON DELETE
-- ─────────────────────────────────────────────────────────────────────
-- Strategy              userId       User(id)              CASCADE
-- Lesson                courseId     Course(id)            CASCADE
-- Signal                userId       User(id)              CASCADE
-- Report                userId       User(id)              CASCADE
-- PortfolioSnapshot     userId       User(id)              CASCADE
-- SimulationResult      userId       User(id)              CASCADE
-- WebAuthnCredential    userId       User(id)              CASCADE
-- UserProgress          userId       User(id)              CASCADE
-- UserProgress          courseId     Course(id)            SET NULL
-- UserProgress          lessonId     Lesson(id)            SET NULL
--
-- COLONNES SANS FK SQL (intentionnel) :
-- Signal.strategyId   → index uniquement (Signal survit à la suppression d'une Strategy)
-- AuthLog.userId      → nullable libre (logs des tentatives anonymes)
--
-- =============================================================================


-- =============================================================================
-- RÉCAPITULATIF DES INDEX
-- =============================================================================
--
-- Table                 Index                                       Colonnes
-- ─────────────────────────────────────────────────────────────────────────────
-- User                  User_username_key (UNIQUE)                  (username)
-- User                  User_email_key (UNIQUE)                     (email)
-- User                  User_githubId_key (UNIQUE)                  (githubId)
-- Course                Course_level_idx                            (level)
-- Course                Course_isPublished_idx                      (isPublished)
-- Strategy              Strategy_userId_idx                         (userId)
-- Lesson                Lesson_courseId_idx                         (courseId)
-- Signal                Signal_userId_idx                           (userId)
-- Signal                Signal_asset_idx                            (asset)
-- Signal                Signal_strategyId_idx                       (strategyId)
-- Signal                Signal_strategyId_asset_direction_status_idx (strategyId,asset,direction,status)
-- Report                Report_userId_month_year_key (UNIQUE)       (userId,month,year)
-- Report                Report_userId_idx                           (userId)
-- PortfolioSnapshot     PortfolioSnapshot_userId_month_year_key (UNIQUE) (userId,month,year)
-- PortfolioSnapshot     PortfolioSnapshot_userId_idx                (userId)
-- SimulationResult      SimulationResult_userId_idx                 (userId)
-- WebAuthnCredential    WebAuthnCredential_credentialId_key (UNIQUE) (credentialId)
-- WebAuthnCredential    WebAuthnCredential_userId_idx               (userId)
-- UserProgress          UserProgress_userId_lessonId_key (UNIQUE)   (userId,lessonId)
-- UserProgress          UserProgress_userId_idx                     (userId)
-- UserProgress          UserProgress_courseId_idx                   (courseId)
--
-- =============================================================================

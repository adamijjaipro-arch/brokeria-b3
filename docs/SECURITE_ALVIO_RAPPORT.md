# SÉCURITÉ ALVIO — Résumé Technique
*Vérifié directement dans le code source (backend-code/src, frontend-web) le 2026-07-10.*

## 1. Authentification JWT Double Token

- Access token : **15 minutes** (`ACCESS_TTL = 15 * 60`)
- Refresh token : **7 jours**, stocké en Redis indexé par `jti` (`refresh:{jti}` → userId)
- Cookie refresh : `httpOnly`, `sameSite: 'lax'`, `secure` en production uniquement
- Révocation immédiate au logout (suppression de la clé Redis)

Code (`backend-code/src/auth/auth.service.ts:482-498`) :
```typescript
const accessToken = this.jwtService.sign(
  { sub: userId, email: userEmail, jti },
  { secret: JWT_SECRET, expiresIn: '900s' }
);
await this.redis.set(refreshKey(jti), userId, REFRESH_TTL); // 7 jours
res.cookie('refresh_token', refreshToken, {
  httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: REFRESH_TTL * 1000,
});
```

## 2. Chiffrement des Mots de Passe

- Algorithme : bcrypt
- Rounds : **12** pour le mot de passe, **10** pour le PIN

Code (`auth.service.ts:161`, `:197`, `:331`) :
```typescript
const passwordHash = await bcrypt.hash(dto.password, 12);
const valid = await bcrypt.compare(dto.password, dbUser.passwordHash);
const pinHash = await bcrypt.hash(pin, 10); // PIN : 10 rounds
```

## 3. Multi-Facteur d'Authentification (MFA)

- **TOTP (RFC 6238)** via `otplib`, secret 160 bits, fenêtre de tolérance ±30s, **secret chiffré AES-256-GCM avant stockage en base** (pas en clair)
- **WebAuthn FIDO2** (clés de sécurité) — `mfa/webauthn/webauthn.service.ts`
- **Magic Link** par email (token aléatoire 32 octets, TTL 15 min)
- **PIN** personnel (bcrypt, 10 rounds)
- **GitHub OAuth** (login social)
- Flux réel observé : mot de passe → OTP email → PIN → tokens (chaîne à plusieurs facteurs, pas juste "MFA optionnel")

Code (`backend-code/src/mfa/totp/totp.service.ts:55, 159-171`) :
```typescript
const secret = authenticator.generateSecret(20); // 160 bits
// ... chiffrement avant persistance :
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const authTag = cipher.getAuthTag(); // 128-bit auth tag
```

## 4. Protection OWASP Top 10

### SQL Injection ✅
- ORM Prisma exclusivement — aucun `$queryRaw`/SQL brut trouvé dans `auth.service.ts`

```typescript
const user = await this.prisma.user.findUnique({
  where: { email: dto.email } // paramétré automatiquement par Prisma
});
```

### XSS — ⚠️ partiel
- React/JSX échappe automatiquement le HTML rendu (protection native, réelle)
- `ValidationPipe({ transform: true })` global côté NestJS (`main.ts:14`) valide/transforme les DTOs entrants
- **Pas de header `Content-Security-Policy`** dans `next.config.js` — seulement `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection` (header legacy, ignoré par les navigateurs modernes), `Referrer-Policy`. À ajouter si le jury pose la question.

```javascript
// next.config.js:55-58 — headers réellement présents
{ key: 'X-Content-Type-Options', value: 'nosniff' },
{ key: 'X-Frame-Options', value: 'DENY' },
{ key: 'X-XSS-Protection', value: '1; mode=block' },
{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
```

### CSRF ✅
- Cookie refresh_token : `httpOnly` + `SameSite=Lax` (empêche l'envoi cross-site en requête simple)
- Access token transmis hors cookie (Authorization header côté client), donc pas exploitable via un formulaire cross-site classique

```typescript
res.cookie('refresh_token', token, { httpOnly: true, sameSite: 'lax', secure: isProd });
```

### Brute-Force ✅ (mécanisme réel — corrige les chiffres génériques)
- Pas de rate-limiting générique par requête (pas de `ThrottlerModule`)
- Compteur d'échecs **par utilisateur** en Redis : blocage après **3 tentatives** (configurable via `MAX_AUTH_FAILURES`), TTL de déblocage **30 min** (`LOCK_TTL_SECONDS=1800`), HTTP 423
- Compteur d'échecs **par IP** : au-delà de **10 échecs/heure** (`MAX_IP_FAILURES`), un événement `SUSPICIOUS_IP` est loggé (alerte, pas de blocage direct)

```typescript
const count = parseInt(await this.redis.get(failKey)) + 1;
if (count >= maxFailures) { // 3 par défaut
  await this.redis.set(lockedKey(userId), 'true', lockTtl); // 1800s
  throw new HttpException('Compte bloqué', 423);
}
```

### Injection de Logs ✅
- `LoggingService` centralisé (NestJS), pas d'interpolation brute d'input utilisateur observée dans les logs d'auth

## 5. Données Sensibles

- Secret TOTP : **AES-256-GCM**, clé lue depuis `TOTP_ENCRYPTION_KEY` (.env, 256 bits) — confirmé dans le code
- Tokens temporaires (OTP, magic link, pré-auth) : Redis avec TTL courts (10-15 min)
- Mots de passe / PIN : jamais stockés en clair (bcrypt uniquement)

---

**Points à surveiller avant la soutenance :**
1. Absence de header CSP — à mentionner comme axe d'amélioration plutôt que de prétendre qu'il existe.
2. Pas de rate-limiting générique par requête HTTP — seulement anti-bruteforce ciblé sur l'auth. Si le jury demande "et si on spam un autre endpoint ?", la réponse honnête est "pas encore protégé, roadmap".

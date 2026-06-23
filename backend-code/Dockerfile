FROM node:18-alpine
RUN apk add --no-cache openssl python3 py3-pip

WORKDIR /app

# ── Python AI engine dependencies (pattern_detector.py needs only pandas+numpy) ─
RUN pip3 install --no-cache-dir --break-system-packages pandas numpy

# ── Node.js dependencies ──────────────────────────────────────────────────────
COPY package*.json ./
RUN npm install

# ── Code source ───────────────────────────────────────────────────────────────
COPY . .

# ── Génération Prisma + compilation NestJS ────────────────────────────────────
RUN npx prisma generate
RUN npm run build

# ── Variables d'environnement ─────────────────────────────────────────────────
ENV NODE_ENV=production

# Railway injecte PORT automatiquement (l'app lit process.env.PORT)
EXPOSE 3000

# ── Démarrage : migration DB → lancement ─────────────────────────────────────
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && npm run start:prod"]

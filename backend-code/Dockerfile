FROM node:18-alpine
WORKDIR /app

# ── Dépendances ───────────────────────────────────────────────────────────────
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

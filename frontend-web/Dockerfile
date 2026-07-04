# Stage 1 : Builder
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci --no-audit --no-fund

COPY . .

# next.config.js sets output: 'standalone', producing a minimal
# .next/standalone server + pruned node_modules
RUN npm run build -- --no-lint

# Stage 2 : Production runtime
FROM node:22-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Standalone output already contains the pruned node_modules + server.js
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]

# Stage 1 : Builder
FROM node:22-alpine AS builder

WORKDIR /app

# openssl is required by the Prisma query engine on Alpine
RUN apk add --no-cache openssl

# Install Node dependencies (ALL, including devDeps for build)
COPY package*.json .npmrc ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
RUN npm run build

# Stage 2 : Production runtime
FROM node:22-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Install runtime system deps for the Python AI module
RUN apk add --no-cache openssl python3 py3-pip && \
    pip3 install --no-cache-dir --break-system-packages pandas numpy

# Reuse the builder's node_modules (already installed + Prisma client
# generated there) instead of re-running npm install in this stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/ai-module ./ai-module

# Switch to non-root user
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3001

ENV NODE_ENV=production

# Database migrations run as a separate step (npm run migrate:deploy), not here
CMD ["node", "dist/main"]

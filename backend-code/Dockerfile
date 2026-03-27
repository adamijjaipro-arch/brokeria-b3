FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY ai-module ./ai-module
COPY prisma ./prisma

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]

#!/bin/sh
set -e

echo "⏳ Generating Prisma client..."
npx prisma generate

echo "🔄 Pushing schema to database..."
npx prisma db push --skip-generate --accept-data-loss

echo "✅ Database setup complete!"
echo "🚀 Starting NestJS application..."
exec node dist/main.js

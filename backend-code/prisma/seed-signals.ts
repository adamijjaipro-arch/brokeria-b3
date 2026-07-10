/**
 * Seed — Signaux de Trading (données de test réalistes)
 *
 * Insère 5 signaux sur des assets réellement supportés par le pipeline de
 * détection (assetToCoinId dans PatternDetectionService : BTC, ETH, SOL),
 * pour un utilisateur existant, afin de valider le flux réel de bout en bout
 * (backend → BDD → frontend) sans dépendre du scheduler ni du module Python.
 *
 * Usage : npx ts-node prisma/seed-signals.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed signaux...');

  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!user) {
    console.error(
      '❌ Aucun utilisateur trouvé en base. Créez un compte (register ou dev-login) avant de lancer ce seed.',
    );
    process.exit(1);
  }
  console.log(`  👤 Utilisateur cible : ${user.email} (${user.id})`);

  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3_600_000);

  const signals = [
    {
      asset:       'BTC',
      timeframe:   '4H',
      direction:   'BUY',
      status:      'OPEN',
      entry_price: 67234.5,
      stop_loss:   66000,
      take_profit: 69000,
      confidence:  88.4,
      patterns:    JSON.stringify(['Bullish Engulfing', 'Golden Cross']),
      indicators:  JSON.stringify({ tp1: 69000, tp2: 70500, rsi: 58.4, ema_50: 66890.2 }),
      createdAt:   hoursAgo(2),
    },
    {
      asset:       'ETH',
      timeframe:   '1H',
      direction:   'BUY',
      status:      'OPEN',
      entry_price: 3456.2,
      stop_loss:   3380,
      take_profit: 3600,
      confidence:  82.1,
      patterns:    JSON.stringify(['Ascending Triangle']),
      indicators:  JSON.stringify({ tp1: 3600, rsi: 61.2, macd: 12.4 }),
      createdAt:   hoursAgo(5),
    },
    {
      asset:       'SOL',
      timeframe:   '4H',
      direction:   'BUY',
      status:      'CLOSED',
      entry_price: 134.2,
      stop_loss:   132,
      take_profit: 138,
      exit_price:  137.6,
      confidence:  79.6,
      patterns:    JSON.stringify(['Double Bottom', 'RSI Oversold']),
      indicators:  JSON.stringify({ tp1: 138, rsi: 33.8 }),
      createdAt:   hoursAgo(30),
      closedAt:    hoursAgo(4),
    },
    {
      asset:       'BTC',
      timeframe:   '1D',
      direction:   'BUY',
      status:      'OPEN',
      entry_price: 68500,
      stop_loss:   67200,
      take_profit: 71000,
      confidence:  91.2,
      patterns:    JSON.stringify(['Breakout', 'Volume Surge']),
      indicators:  JSON.stringify({ tp1: 71000, tp2: 72800, rsi: 64.7 }),
      createdAt:   hoursAgo(8),
    },
    {
      asset:       'ETH',
      timeframe:   '15M',
      direction:   'BUY',
      status:      'OPEN',
      entry_price: 3402.8,
      stop_loss:   3350,
      take_profit: 3470,
      confidence:  74.3,
      patterns:    JSON.stringify(['EMA Cross']),
      indicators:  JSON.stringify({ tp1: 3470 }),
      createdAt:   hoursAgo(1),
    },
  ];

  for (const signal of signals) {
    const created = await prisma.signal.create({
      data: { ...signal, userId: user.id },
    });
    console.log(
      `  ✅ Signal créé : ${created.asset} ${created.direction} (${created.status}) — confiance ${created.confidence}%`,
    );
  }

  const total = await prisma.signal.count({ where: { userId: user.id } });
  console.log(`\n✨ Seed terminé : ${signals.length} signaux créés (total pour cet utilisateur : ${total}).`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

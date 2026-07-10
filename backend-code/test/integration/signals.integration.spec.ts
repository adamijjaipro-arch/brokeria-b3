/**
 * Tests d'intégration — Signals via une vraie base Postgres/Redis (docker-compose.test.yml).
 * Aucun mock Prisma ici : création, isolation multi-utilisateur, cascade delete, tri réel.
 */
import request from 'supertest';
import { createIntegrationTestApp, cleanDatabase, IntegrationTestContext } from './test-app';

describe('Signals Integration Tests (Real DB)', () => {
  let ctx: IntegrationTestContext;

  beforeAll(async () => {
    ctx = await createIntegrationTestApp();
    await cleanDatabase(ctx.prisma);
  });

  afterAll(async () => {
    if (!ctx) return; // createIntegrationTestApp() a échoué avant d'assigner ctx
    await cleanDatabase(ctx.prisma);
    await ctx.app.close();
  });

  async function registerAndGetToken(email: string, username: string): Promise<{ token: string; userId: string }> {
    const res = await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email, username, password: 'SecureP@ss123' })
      .expect(201);
    return { token: res.body.data.accessToken, userId: res.body.data.user.id };
  }

  it('crée un signal en base réelle avec tous les champs', async () => {
    const { token } = await registerAndGetToken('signalowner@example.com', 'signalowner');

    const res = await request(ctx.app.getHttpServer())
      .post('/signals')
      .set('Authorization', `Bearer ${token}`)
      .send({ asset: 'BTC/USDT', direction: 'BUY', confidence: 92.5, entryPrice: 65000, stopLoss: 62000, takeProfit: 70000 })
      .expect(201);

    expect(res.body.data.asset).toBe('BTC/USDT');
    expect(res.body.data.entry_price).toBe(65000);

    const inDb = await ctx.prisma.signal.findUnique({ where: { id: res.body.data.id } });
    expect(inDb).not.toBeNull();
    expect(inDb!.asset).toBe('BTC/USDT');
  });

  it('rejette la création de signal sans authentification (guard JWT réel, pas mocké)', async () => {
    await request(ctx.app.getHttpServer())
      .post('/signals')
      .send({ asset: 'BTC/USDT', direction: 'BUY', confidence: 80, entryPrice: 1, stopLoss: 1, takeProfit: 1 })
      .expect(401);
  });

  it('rejette confidence hors bornes [0,100] via le ValidationPipe réel', async () => {
    const { token } = await registerAndGetToken('boundstest@example.com', 'boundstest');

    await request(ctx.app.getHttpServer())
      .post('/signals')
      .set('Authorization', `Bearer ${token}`)
      .send({ asset: 'ETH/USDT', direction: 'BUY', confidence: 150, entryPrice: 1, stopLoss: 1, takeProfit: 1 })
      .expect(400);
  });

  it("n'autorise un utilisateur à voir que ses propres signaux (isolation multi-tenant réelle)", async () => {
    const user1 = await registerAndGetToken('isouser1@example.com', 'isouser1');
    const user2 = await registerAndGetToken('isouser2@example.com', 'isouser2');

    await request(ctx.app.getHttpServer())
      .post('/signals')
      .set('Authorization', `Bearer ${user1.token}`)
      .send({ asset: 'SOL/USDT', direction: 'BUY', confidence: 80, entryPrice: 100, stopLoss: 90, takeProfit: 120 })
      .expect(201);

    const res = await request(ctx.app.getHttpServer())
      .get('/signals')
      .set('Authorization', `Bearer ${user2.token}`)
      .expect(200);

    expect(res.body.data).toHaveLength(0);
    expect(res.body.data.every((s: any) => s.userId !== user1.userId)).toBe(true);
  });

  it('supprime les signaux en cascade quand leur utilisateur est supprimé (onDelete: Cascade du schéma Prisma)', async () => {
    const user = await registerAndGetToken('cascadeuser@example.com', 'cascadeuser');

    await request(ctx.app.getHttpServer())
      .post('/signals')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ asset: 'ADA/USDT', direction: 'BUY', confidence: 70, entryPrice: 1, stopLoss: 0.9, takeProfit: 1.2 })
      .expect(201);

    expect(await ctx.prisma.signal.count({ where: { userId: user.userId } })).toBe(1);

    await ctx.prisma.user.delete({ where: { id: user.userId } });

    expect(await ctx.prisma.signal.count({ where: { userId: user.userId } })).toBe(0);
  });

  it('retourne les signaux les plus récents en premier (orderBy createdAt desc réel)', async () => {
    const { token } = await registerAndGetToken('recenttest@example.com', 'recenttest');

    for (const asset of ['XRP/USDT', 'DOT/USDT', 'LINK/USDT']) {
      await request(ctx.app.getHttpServer())
        .post('/signals')
        .set('Authorization', `Bearer ${token}`)
        .send({ asset, direction: 'BUY', confidence: 75, entryPrice: 1, stopLoss: 0.9, takeProfit: 1.2 })
        .expect(201);
    }

    const res = await request(ctx.app.getHttpServer())
      .get('/signals/recent')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].asset).toBe('LINK/USDT'); // le dernier créé
  });
});

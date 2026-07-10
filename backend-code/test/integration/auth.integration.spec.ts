/**
 * Tests d'intégration — AuthService via une vraie base Postgres/Redis (docker-compose.test.yml).
 * Aucun mock Prisma/Redis ici : on vérifie le comportement réel de bout en bout via HTTP.
 */
import request from 'supertest';
import { createIntegrationTestApp, cleanDatabase, IntegrationTestContext } from './test-app';

describe('Auth Integration Tests (Real DB)', () => {
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

  it('crée un utilisateur en base réelle et retourne un accessToken', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'integration@example.com', username: 'inttestuser', password: 'SecureP@ss123' })
      .expect(201);

    expect(res.body.data.accessToken).toBeDefined();

    const user = await ctx.prisma.user.findUnique({ where: { email: 'integration@example.com' } });
    expect(user).not.toBeNull();
    expect(user!.email).toBe('integration@example.com');
  });

  it('refuse un email déjà utilisé (contrainte unique réelle en base)', async () => {
    await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'duplicate@example.com', username: 'dupuser1', password: 'SecureP@ss123' })
      .expect(201);

    await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'duplicate@example.com', username: 'dupuser2', password: 'SecureP@ss123' })
      .expect(409);
  });

  it('refuse un username déjà utilisé (contrainte unique réelle en base)', async () => {
    await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'usera@example.com', username: 'sameusername', password: 'SecureP@ss123' })
      .expect(201);

    await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'userb@example.com', username: 'sameusername', password: 'SecureP@ss123' })
      .expect(409);
  });

  it('rejette un mot de passe trop court via le vrai ValidationPipe (pas simulé)', async () => {
    await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'weakpass@example.com', username: 'weakpassuser', password: 'weak' })
      .expect(400);

    const user = await ctx.prisma.user.findUnique({ where: { email: 'weakpass@example.com' } });
    expect(user).toBeNull(); // rien n'a été créé en base
  });

  it('hache le mot de passe en base — jamais stocké en clair', async () => {
    const password = 'MySecurePassword123!';
    await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'hash@example.com', username: 'hashtestuser', password })
      .expect(201);

    const user = await ctx.prisma.user.findUnique({ where: { email: 'hash@example.com' } });
    expect(user!.passwordHash).not.toBe(password);
    expect(user!.passwordHash).toHaveLength(60); // longueur fixe d'un hash bcrypt
  });

  it('déclenche le flux MFA au login (requiresMFA), sans émettre de token immédiatement', async () => {
    await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'loginflow@example.com', username: 'loginflowuser', password: 'SecureP@ss123' })
      .expect(201);

    const res = await request(ctx.app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'loginflow@example.com', password: 'SecureP@ss123' })
      .expect(200);

    expect(res.body.data.requiresMFA).toBe(true);
    expect(res.body.data.preAuthToken).toBeDefined();
    expect(res.body.data.accessToken).toBeUndefined();
  });

  it('refuse le login avec un mauvais mot de passe (bcrypt.compare réel)', async () => {
    await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'badpass@example.com', username: 'badpassuser', password: 'CorrectPass123!' })
      .expect(201);

    await request(ctx.app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'badpass@example.com', password: 'WrongPassword!' })
      .expect(401);
  });

  it('verrouille le compte après 3 échecs de login (compteur Redis réel, TTL réel)', async () => {
    await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'bruteforce@example.com', username: 'bruteforceuser', password: 'CorrectPass123!' })
      .expect(201);

    await request(ctx.app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bruteforce@example.com', password: 'wrong1' })
      .expect(401);
    await request(ctx.app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bruteforce@example.com', password: 'wrong2' })
      .expect(401);

    // 3e échec → verrouillage (423)
    await request(ctx.app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bruteforce@example.com', password: 'wrong3' })
      .expect(423);

    // Même le bon mot de passe est refusé tant que le compte est verrouillé
    await request(ctx.app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bruteforce@example.com', password: 'CorrectPass123!' })
      .expect(423);
  });

  it('refuse le refresh sans cookie (vrai middleware cookie-parser, pas de mock)', async () => {
    await request(ctx.app.getHttpServer()).post('/auth/refresh').expect(401);
  });
});

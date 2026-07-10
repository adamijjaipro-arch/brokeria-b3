/**
 * Charge .env.test dans process.env AVANT que Jest ne require les fichiers de test.
 * Nécessaire car PrismaClient lit process.env.DATABASE_URL directement à la
 * construction (pas via le ConfigService de Nest) — l'ordre d'exécution doit
 * garantir que ces variables existent avant toute instanciation de PrismaService.
 */
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

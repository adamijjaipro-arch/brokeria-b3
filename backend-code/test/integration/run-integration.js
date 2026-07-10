#!/usr/bin/env node
/**
 * Orchestrateur des tests d'intégration.
 * Lève Postgres/Redis de test (docker-compose.test.yml, healthcheck-driven —
 * pas de `sleep` fixe), applique les migrations Prisma, exécute Jest, puis
 * démonte toujours les conteneurs (succès ou échec) via try/finally.
 * Pur Node (pas de && / ; shell) pour rester identique sur Windows et Linux CI.
 */
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test') });

const backendRoot = path.resolve(__dirname, '../..');
const composeFile = path.join(backendRoot, 'docker-compose.test.yml');

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: backendRoot, env: process.env });
}

let exitCode = 0;
try {
  run(`docker compose -f "${composeFile}" up -d --wait`);
  run('npx prisma migrate deploy --schema=./prisma/schema.prisma');
  // --forceExit : filet de sécurité. Si un module Nest échoue à se compiler
  // (ex. un provider lève dans son constructeur), app.close() n'est jamais
  // appelé et des connexions Prisma/Redis restent ouvertes — Jest ne se
  // termine alors jamais tout seul (déjà arrivé : un job GitHub Actions est
  // resté bloqué 48min avant annulation manuelle). --forceExit garantit que
  // le process se termine une fois les résultats des tests calculés/affichés,
  // sans jamais masquer un échec de test.
  run('npx jest --config ./test/jest-integration.json --runInBand --forceExit');
} catch (err) {
  exitCode = 1;
} finally {
  try {
    run(`docker compose -f "${composeFile}" down`);
  } catch {
    // best-effort teardown
  }
}
process.exit(exitCode);

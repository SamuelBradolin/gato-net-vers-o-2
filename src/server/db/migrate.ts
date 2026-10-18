import { testPostgresConnection, runPostgresMigrations } from './postgres.js';

async function main() {
  console.log('====================================================');
  console.log('GATO NET — EXECUTOR DE MIGRAÇÕES POSTGRESQL 16');
  console.log('VPS Virtarix - Ubuntu 24.04 LTS');
  console.log('====================================================');

  const connected = await testPostgresConnection();
  if (!connected) {
    console.warn('Aviso: PostgreSQL não detectado ou DATABASE_URL não definida.');
    console.warn('O sistema continuará utilizando o repositório server-side persistente.');
    process.exit(0);
  }

  await runPostgresMigrations();
  console.log('Migrações concluídas com sucesso no PostgreSQL.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro na execução de migrações:', err);
  process.exit(1);
});

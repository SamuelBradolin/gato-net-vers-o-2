import { hashPassword } from '../auth/argon2.js';
import { createAdmin, countAdmins, findAdminByEmail } from '../db/repository.js';
import { testPostgresConnection, runPostgresMigrations } from '../db/postgres.js';

async function main() {
  console.log('====================================================');
  console.log('GATO NET — INSTALADOR SEGURO DE ADMINISTRADOR (ARGON2ID)');
  console.log('====================================================');

  const args = process.argv.slice(2);
  const emailArg = args[0] || process.env.ADMIN_EMAIL;
  const passwordArg = args[1] || process.env.ADMIN_PASSWORD;
  const nameArg = args[2] || process.env.ADMIN_NAME || 'Administrador Principal';

  if (!emailArg || !passwordArg) {
    console.error('Uso: npm run setup:admin <email> <senha> [nome]');
    console.error('Exemplo: npm run setup:admin admin@gatonet.tv "SenhaForte#2026" "Admin Gato Net"');
    process.exit(1);
  }

  if (passwordArg.length < 8) {
    console.error('Erro: A senha precisa ter pelo menos 8 caracteres.');
    process.exit(1);
  }

  // Check Postgres
  const isPg = await testPostgresConnection();
  if (isPg) {
    await runPostgresMigrations();
  }

  const existing = await findAdminByEmail(emailArg);
  if (existing) {
    console.error(`Erro: Já existe um administrador cadastrado com o e-mail: ${emailArg}`);
    process.exit(1);
  }

  console.log('[1/3] Gerando hash criptográfico Argon2id com salt aleatório...');
  const password_hash = await hashPassword(passwordArg);

  console.log('[2/3] Registrando Super Administrador no banco...');
  const admin = await createAdmin({
    name: nameArg,
    email: emailArg.toLowerCase().trim(),
    password_hash,
    role: 'superadmin',
    is_active: true,
    failed_attempts: 0,
    locked_until: null,
    last_login_at: null
  });

  console.log('[3/3] Sucesso!');
  console.log(`Administrador "${admin.name}" (${admin.email}) configurado com privilégios de SuperAdmin.`);
  console.log('Nenhuma credencial padrão pública foi utilizada.');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Falha no setup de admin:', err);
  process.exit(1);
});

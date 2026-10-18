import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/server/routes/authRoutes.js';
import adminRoutes from './src/server/routes/adminRoutes.js';
import publicRoutes from './src/server/routes/publicRoutes.js';
import { testPostgresConnection, runPostgresMigrations, isPostgresActive } from './src/server/db/postgres.js';
import { countAdmins } from './src/server/db/repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());
app.use(cookieParser());

// Trust first proxy for accurate IP in logs and rate limiting behind Nginx/Cloud Run
app.set('trust proxy', 1);

// Health Check & Diagnostics
app.get('/api/health', async (_req, res) => {
  const adminCount = await countAdmins();
  res.json({
    status: 'online',
    platform: 'Gato Net TV',
    version: '2.0.0-etapa2',
    vps: {
      os: 'Ubuntu 24.04 LTS',
      host: 'Virtarix VPS',
      specs: '3 vCPU / 6 GB RAM / 50 GB NVMe / 200 Mbps',
      database: isPostgresActive() ? 'PostgreSQL 16 (Active Pool)' : 'Server-side Storage (PostgreSQL Ready)'
    },
    security: {
      auth: 'Argon2id + HttpOnly Cookies',
      rateLimiting: 'Active',
      isSetupRequired: adminCount === 0
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', publicRoutes);
app.use('/api', authRoutes);
app.use('/api', adminRoutes);

// Database initialization
async function initDatabase() {
  const isPgConnected = await testPostgresConnection();
  if (isPgConnected) {
    await runPostgresMigrations();
  } else {
    console.log('[Gato Net] Modo de desenvolvimento/preview ativo: usando armazenamento persistente no servidor.');
    console.log('[Gato Net] Quando executado na VPS Virtarix com DATABASE_URL, utilizará o PostgreSQL 16 automaticamente.');
  }
}

// Development with Vite Middleware / Production with static files
async function startServer() {
  await initDatabase();

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Gato Net] Servidor em execução na porta ${PORT}`);
    console.log(`[Gato Net] Backend pronto para Ubuntu 24.04 VPS Virtarix`);
  });
}

startServer().catch((err) => {
  console.error('[Gato Net] Erro fatal na inicialização:', err);
});

export default app;

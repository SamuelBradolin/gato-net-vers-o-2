import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API Health Check & VPS Diagnostics
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    platform: 'Gato Net TV',
    version: '1.0.0-etapa1',
    vps: {
      os: 'Ubuntu 24.04 LTS',
      host: 'Virtarix VPS',
      specs: '3 vCPU / 6 GB RAM / 50 GB NVMe / 200 Mbps',
      database: 'PostgreSQL 16 (Etapa 2)'
    },
    timestamp: new Date().toISOString()
  });
});

// Production Static Serving
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server
if (process.env.NODE_ENV === 'production') {
  app.listen(PORT, () => {
    console.log(`[Gato Net] Servidor em execução na porta ${PORT} para VPS Virtarix`);
  });
}

export default app;

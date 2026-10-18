import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

let pool: pg.Pool | null = null;
let isConnected = false;

export function getPostgresPool(): pg.Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    const isSsl = connectionString.includes('sslmode=require') || process.env.NODE_ENV === 'production';
    pool = new Pool({
      connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected pool client error:', err.message);
      isConnected = false;
    });
  }

  return pool;
}

export async function testPostgresConnection(): Promise<boolean> {
  const p = getPostgresPool();
  if (!p) return false;

  try {
    const res = await p.query('SELECT NOW() AS current_time');
    isConnected = true;
    console.log('[PostgreSQL] Connected successfully to database. Time:', res.rows[0].current_time);
    return true;
  } catch (err: any) {
    console.warn('[PostgreSQL] Database not reachable or not yet provisioned on VPS:', err.message);
    isConnected = false;
    return false;
  }
}

export async function runPostgresMigrations(): Promise<void> {
  const p = getPostgresPool();
  if (!p) return;

  try {
    console.log('[PostgreSQL] Running migrations...');
    const migrationsDir = path.resolve(__dirname, '../../../migrations');
    if (!fs.existsSync(migrationsDir)) return;

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      console.log(`[PostgreSQL] Executing migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await p.query(sql);
    }
    console.log('[PostgreSQL] All migrations completed successfully.');
  } catch (err: any) {
    console.error('[PostgreSQL] Migration error:', err.message);
  }
}

export function isPostgresActive(): boolean {
  return isConnected;
}

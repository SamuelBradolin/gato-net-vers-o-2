import {
  AdminUser,
  AdminSession,
  AdminAuditLog,
  DbCategory,
  DbChannel,
  BackupStreamItem,
  DbStreamSource,
  DbSubscriber,
  DbSubscriptionPlan,
  DbPaymentConfigs,
  DbAppearanceConfigs,
  DbAdSlot,
  DbAccessModes,
  DbPlaybackSession,
  DbManualOrder,
  PasswordResetToken,
  DbFeaturedHighlight,
  DbFeaturedSettings,
  DbPrerollCampaign,
  DbPrerollEvent,
  DbInPlaySettings,
  DbAuthorizedIframeDomain,
  DbFootballTeam,
  DbFootballMatch,
  DbFootballAgendaSettings
} from './schema.js';
import { loadDatabase, saveDatabase } from './fileStorage.js';
import { getPostgresPool, isPostgresActive } from './postgres.js';
import { generatePixCopyPaste } from '../utils/pix.js';
import { validateStreamUrl } from '../utils/security.js';
import crypto from 'crypto';

// ==========================================
// 1. ADMINS & PERMISSIONS
// ==========================================
export async function countAdmins(): Promise<number> {
  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query('SELECT COUNT(*) as count FROM admins WHERE is_active = true');
    return parseInt(res.rows[0].count, 10);
  }
  const db = loadDatabase();
  return db.admins.filter(a => a.is_active).length;
}

export async function findAdminByEmail(email: string): Promise<AdminUser | null> {
  const cleanEmail = email.toLowerCase().trim();
  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query('SELECT * FROM admins WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
    return res.rows[0] || null;
  }
  const db = loadDatabase();
  return db.admins.find(a => a.email.toLowerCase() === cleanEmail) || null;
}

export async function getAdminById(id: string): Promise<AdminUser | null> {
  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query('SELECT * FROM admins WHERE id = $1 LIMIT 1', [id]);
    return res.rows[0] || null;
  }
  const db = loadDatabase();
  return db.admins.find(a => a.id === id) || null;
}

export async function createAdmin(admin: Omit<AdminUser, 'id' | 'created_at' | 'updated_at'>): Promise<AdminUser> {
  const id = `admin_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const newAdmin: AdminUser = {
    ...admin,
    id,
    created_at: now,
    updated_at: now
  };

  if (isPostgresActive()) {
    await getPostgresPool()!.query(
      `INSERT INTO admins (id, name, email, password_hash, role, is_active, failed_attempts, locked_until, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [newAdmin.id, newAdmin.name, newAdmin.email, newAdmin.password_hash, newAdmin.role, newAdmin.is_active, newAdmin.failed_attempts, newAdmin.locked_until, newAdmin.created_at, newAdmin.updated_at]
    );
    return newAdmin;
  }

  const db = loadDatabase();
  db.admins.push(newAdmin);
  saveDatabase(db);
  return newAdmin;
}

export async function updateAdmin(id: string, updates: Partial<AdminUser>): Promise<AdminUser | null> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    fields.push(`updated_at = $${idx}`);
    values.push(now);
    values.push(id);

    const query = `UPDATE admins SET ${fields.join(', ')} WHERE id = $${idx + 1} RETURNING *`;
    const res = await getPostgresPool()!.query(query, values);
    return res.rows[0] || null;
  }

  const db = loadDatabase();
  const index = db.admins.findIndex(a => a.id === id);
  if (index === -1) return null;

  db.admins[index] = { ...db.admins[index], ...updates, updated_at: now };
  saveDatabase(db);
  return db.admins[index];
}

// ==========================================
// 2. SESSIONS & COOKIES
// ==========================================
export async function createAdminSession(adminId: string, tokenHash: string, ip: string | null, userAgent: string | null, expiresInHours = 24): Promise<AdminSession> {
  const id = `sess_${crypto.randomUUID()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString();

  const session: AdminSession = {
    id,
    admin_id: adminId,
    token_hash: tokenHash,
    ip_address: ip,
    user_agent: userAgent,
    expires_at: expiresAt,
    created_at: now.toISOString()
  };

  if (isPostgresActive()) {
    await getPostgresPool()!.query(
      `INSERT INTO admin_sessions (id, admin_id, token_hash, ip_address, user_agent, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [session.id, session.admin_id, session.token_hash, session.ip_address, session.user_agent, session.expires_at, session.created_at]
    );
    return session;
  }

  const db = loadDatabase();
  // Clean expired sessions
  const nowIso = now.toISOString();
  db.admin_sessions = db.admin_sessions.filter(s => s.expires_at > nowIso);
  db.admin_sessions.push(session);
  saveDatabase(db);
  return session;
}

export async function findAdminSession(tokenHash: string): Promise<{ session: AdminSession; admin: AdminUser } | null> {
  const nowIso = new Date().toISOString();

  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query(
      `SELECT s.*, a.name, a.email, a.role, a.is_active, a.locked_until
       FROM admin_sessions s
       JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = $1 AND s.expires_at > $2 AND a.is_active = true
       LIMIT 1`,
      [tokenHash, nowIso]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    const session: AdminSession = {
      id: row.id,
      admin_id: row.admin_id,
      token_hash: row.token_hash,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      expires_at: row.expires_at,
      created_at: row.created_at
    };
    const admin: AdminUser = {
      id: row.admin_id,
      name: row.name,
      email: row.email,
      password_hash: '',
      role: row.role,
      is_active: row.is_active,
      failed_attempts: 0,
      locked_until: row.locked_until,
      last_login_at: null,
      created_at: '',
      updated_at: ''
    };
    return { session, admin };
  }

  const db = loadDatabase();
  const session = db.admin_sessions.find(s => s.token_hash === tokenHash && s.expires_at > nowIso);
  if (!session) return null;

  const admin = db.admins.find(a => a.id === session.admin_id && a.is_active);
  if (!admin) return null;

  return { session, admin };
}

export async function deleteAdminSession(tokenHash: string): Promise<void> {
  if (isPostgresActive()) {
    await getPostgresPool()!.query('DELETE FROM admin_sessions WHERE token_hash = $1', [tokenHash]);
    return;
  }
  const db = loadDatabase();
  db.admin_sessions = db.admin_sessions.filter(s => s.token_hash !== tokenHash);
  saveDatabase(db);
}

export async function deleteAllAdminSessions(adminId: string): Promise<void> {
  if (isPostgresActive()) {
    await getPostgresPool()!.query('DELETE FROM admin_sessions WHERE admin_id = $1', [adminId]);
    return;
  }
  const db = loadDatabase();
  db.admin_sessions = db.admin_sessions.filter(s => s.admin_id !== adminId);
  saveDatabase(db);
}

export async function createPasswordResetToken(adminId: string, tokenHash: string, expiresInMinutes = 15): Promise<PasswordResetToken> {
  const id = `reset_${crypto.randomUUID()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000).toISOString();

  const token: PasswordResetToken = {
    id,
    admin_id: adminId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    used: false,
    created_at: now.toISOString()
  };

  if (isPostgresActive()) {
    await getPostgresPool()!.query(
      `INSERT INTO password_reset_tokens (id, admin_id, token_hash, expires_at, used, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [token.id, token.admin_id, token.token_hash, token.expires_at, token.used, token.created_at]
    );
    return token;
  }

  const db = loadDatabase();
  if (!db.password_reset_tokens) db.password_reset_tokens = [];
  db.password_reset_tokens.push(token);
  saveDatabase(db);
  return token;
}

export async function findPasswordResetToken(tokenHash: string): Promise<{ token: PasswordResetToken; admin: AdminUser } | null> {
  const nowIso = new Date().toISOString();

  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query(
      `SELECT t.*, a.id as a_id, a.name, a.email, a.role, a.is_active, a.failed_attempts, a.locked_until
       FROM password_reset_tokens t
       JOIN admins a ON a.id = t.admin_id
       WHERE t.token_hash = $1 AND t.used = false AND t.expires_at > $2 AND a.is_active = true
       LIMIT 1`,
      [tokenHash, nowIso]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    const token: PasswordResetToken = {
      id: row.id,
      admin_id: row.admin_id,
      token_hash: row.token_hash,
      expires_at: row.expires_at,
      used: row.used,
      created_at: row.created_at
    };
    const admin: AdminUser = {
      id: row.a_id,
      name: row.name,
      email: row.email,
      password_hash: '',
      role: row.role,
      is_active: row.is_active,
      failed_attempts: row.failed_attempts,
      locked_until: row.locked_until,
      last_login_at: null,
      created_at: '',
      updated_at: ''
    };
    return { token, admin };
  }

  const db = loadDatabase();
  if (!db.password_reset_tokens) db.password_reset_tokens = [];
  const token = db.password_reset_tokens.find(t => t.token_hash === tokenHash && !t.used && t.expires_at > nowIso);
  if (!token) return null;

  const admin = db.admins.find(a => a.id === token.admin_id && a.is_active);
  if (!admin) return null;

  return { token, admin };
}

export async function markPasswordResetTokenUsed(tokenHash: string): Promise<void> {
  if (isPostgresActive()) {
    await getPostgresPool()!.query('UPDATE password_reset_tokens SET used = true WHERE token_hash = $1', [tokenHash]);
    return;
  }
  const db = loadDatabase();
  if (!db.password_reset_tokens) return;
  const token = db.password_reset_tokens.find(t => t.token_hash === tokenHash);
  if (token) {
    token.used = true;
    saveDatabase(db);
  }
}

export async function updateAdminPassword(adminId: string, newPasswordHash: string): Promise<void> {
  await updateAdmin(adminId, {
    password_hash: newPasswordHash,
    failed_attempts: 0,
    locked_until: null
  });
  await deleteAllAdminSessions(adminId);
}


// ==========================================
// 3. AUDIT LOGS
// ==========================================
export async function createAuditLog(
  adminId: string | null,
  adminEmail: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, any> | null,
  ip: string | null
): Promise<AdminAuditLog> {
  const log: AdminAuditLog = {
    id: `log_${crypto.randomUUID()}`,
    admin_id: adminId,
    admin_email: adminEmail,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    ip_address: ip,
    created_at: new Date().toISOString()
  };

  if (isPostgresActive()) {
    await getPostgresPool()!.query(
      `INSERT INTO admin_audit_logs (id, admin_id, admin_email, action, entity_type, entity_id, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [log.id, log.admin_id, log.admin_email, log.action, log.entity_type, log.entity_id, JSON.stringify(log.details), log.ip_address, log.created_at]
    );
    return log;
  }

  const db = loadDatabase();
  db.admin_audit_logs.unshift(log);
  if (db.admin_audit_logs.length > 500) {
    db.admin_audit_logs = db.admin_audit_logs.slice(0, 500);
  }
  saveDatabase(db);
  return log;
}

export async function getAuditLogs(limit = 50): Promise<AdminAuditLog[]> {
  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query('SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT $1', [limit]);
    return res.rows;
  }
  const db = loadDatabase();
  return db.admin_audit_logs.slice(0, limit);
}

// ==========================================
// 4. CHANNELS & CATEGORIES
// ==========================================
export async function getCategories(): Promise<DbCategory[]> {
  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query('SELECT * FROM categories ORDER BY display_order ASC');
    return res.rows;
  }
  const db = loadDatabase();
  return db.categories.sort((a, b) => a.display_order - b.display_order);
}

export async function createCategory(cat: Omit<DbCategory, 'created_at' | 'updated_at'>): Promise<DbCategory> {
  const now = new Date().toISOString();
  const newCat: DbCategory = { ...cat, created_at: now, updated_at: now };

  if (isPostgresActive()) {
    await getPostgresPool()!.query(
      `INSERT INTO categories (id, name, slug, display_order, icon_name, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [newCat.id, newCat.name, newCat.slug, newCat.display_order, newCat.icon_name, newCat.is_active, newCat.created_at, newCat.updated_at]
    );
    return newCat;
  }

  const db = loadDatabase();
  db.categories.push(newCat);
  saveDatabase(db);
  return newCat;
}

export async function updateCategory(id: string, updates: Partial<DbCategory>): Promise<DbCategory | null> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id') continue;
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    fields.push(`updated_at = $${idx}`);
    values.push(now);
    values.push(id);

    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx + 1} RETURNING *`;
    const res = await getPostgresPool()!.query(query, values);
    return res.rows[0] || null;
  }

  const db = loadDatabase();
  const idx = db.categories.findIndex(c => c.id === id);
  if (idx === -1) return null;

  db.categories[idx] = { ...db.categories[idx], ...updates, updated_at: now };
  saveDatabase(db);
  return db.categories[idx];
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  const channels = await getChannels(false);
  const inUse = channels.some(c => c.category_id === id);
  if (inUse) {
    return {
      success: false,
      message: 'Não é possível excluir esta categoria pois existem canais associados a ela. Mova os canais antes de excluir.'
    };
  }

  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query('DELETE FROM categories WHERE id = $1', [id]);
    return { success: (res.rowCount || 0) > 0 };
  }

  const db = loadDatabase();
  const prevLen = db.categories.length;
  db.categories = db.categories.filter(c => c.id !== id);
  saveDatabase(db);
  return { success: db.categories.length < prevLen };
}

export async function getChannels(onlyActive = false): Promise<DbChannel[]> {
  if (isPostgresActive()) {
    const query = onlyActive
      ? `SELECT c.*, cat.name as category_name 
         FROM channels c 
         LEFT JOIN categories cat ON cat.id = c.category_id 
         WHERE c.is_active = true AND (c.status IS NULL OR c.status != 'inactive')
         ORDER BY c.number ASC`
      : `SELECT c.*, cat.name as category_name 
         FROM channels c 
         LEFT JOIN categories cat ON cat.id = c.category_id 
         ORDER BY c.number ASC`;
    const res = await getPostgresPool()!.query(query);
    return res.rows.map(r => ({
      ...r,
      alternative_streams: typeof r.alternative_streams === 'string' ? JSON.parse(r.alternative_streams) : (r.alternative_streams || []),
      status: r.status || (r.is_active ? 'active' : 'inactive'),
      access_permission: r.access_permission || (r.is_locked ? 'restricted' : 'free'),
      player_type: r.player_type || 'internal',
      iframe_code: r.iframe_code || null,
      iframe_url: r.iframe_url || null
    }));
  }
  const db = loadDatabase();
  const list = onlyActive 
    ? db.channels.filter(c => c.is_active && c.status !== 'inactive') 
    : db.channels;
  return list.map(c => ({
    ...c,
    player_type: c.player_type || 'internal',
    iframe_code: c.iframe_code || null,
    iframe_url: c.iframe_url || null
  })).sort((a, b) => a.number - b.number);
}

export async function getChannelById(id: string): Promise<DbChannel | null> {
  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query(
      `SELECT c.*, cat.name as category_name 
       FROM channels c 
       LEFT JOIN categories cat ON cat.id = c.category_id 
       WHERE c.id = $1 LIMIT 1`,
      [id]
    );
    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      ...r,
      alternative_streams: typeof r.alternative_streams === 'string' ? JSON.parse(r.alternative_streams) : (r.alternative_streams || []),
      status: r.status || (r.is_active ? 'active' : 'inactive'),
      access_permission: r.access_permission || (r.is_locked ? 'restricted' : 'free'),
      player_type: r.player_type || 'internal',
      iframe_code: r.iframe_code || null,
      iframe_url: r.iframe_url || null
    };
  }
  const db = loadDatabase();
  const found = db.channels.find(c => c.id === id);
  if (!found) return null;
  return {
    ...found,
    player_type: found.player_type || 'internal',
    iframe_code: found.iframe_code || null,
    iframe_url: found.iframe_url || null
  };
}

export async function createChannel(channel: Omit<DbChannel, 'created_at' | 'updated_at'>): Promise<DbChannel> {
  const now = new Date().toISOString();
  const status = channel.status || (channel.is_active === false ? 'inactive' : 'active');
  const access_permission = channel.access_permission || (channel.is_locked ? 'restricted' : 'free');
  const isActive = status !== 'inactive';
  const isLocked = access_permission === 'restricted';

  const newChan: DbChannel = {
    ...channel,
    status,
    access_permission,
    is_active: isActive,
    is_locked: isLocked,
    created_at: now,
    updated_at: now
  };

  if (isPostgresActive()) {
    try {
      await getPostgresPool()!.query(
        `INSERT INTO channels (
           id, number, name, category_id, logo_url, backup_image_url, stream_url,
           alternative_streams, resolution, aspect_ratio, current_program, current_program_time,
           next_program, is_live, is_locked, is_featured, is_active, status, access_permission,
           player_type, iframe_code, iframe_url,
           description, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`,
        [
          newChan.id,
          newChan.number,
          newChan.name,
          newChan.category_id,
          newChan.logo_url,
          newChan.backup_image_url || null,
          newChan.stream_url,
          JSON.stringify(newChan.alternative_streams || []),
          newChan.resolution || '1080p',
          newChan.aspect_ratio || '16:9',
          newChan.current_program || 'Transmissão Ao Vivo',
          newChan.current_program_time || '20:00 - 22:00',
          newChan.next_program || null,
          Boolean(newChan.is_live),
          newChan.is_locked,
          Boolean(newChan.is_featured),
          newChan.is_active,
          newChan.status,
          newChan.access_permission,
          newChan.player_type || 'internal',
          newChan.iframe_code || null,
          newChan.iframe_url || null,
          newChan.description || '',
          newChan.created_at,
          newChan.updated_at
        ]
      );
    } catch (err: any) {
      console.warn('[PostgreSQL] createChannel full insert fallback:', err.message);
      // Fallback without new columns if migration is pending
      await getPostgresPool()!.query(
        `INSERT INTO channels (
           id, number, name, category_id, logo_url, backup_image_url, stream_url,
           alternative_streams, resolution, aspect_ratio, current_program, current_program_time,
           next_program, is_live, is_locked, is_featured, is_active, description, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          newChan.id,
          newChan.number,
          newChan.name,
          newChan.category_id,
          newChan.logo_url,
          newChan.backup_image_url || null,
          newChan.stream_url,
          JSON.stringify(newChan.alternative_streams || []),
          newChan.resolution || '1080p',
          newChan.aspect_ratio || '16:9',
          newChan.current_program || 'Transmissão Ao Vivo',
          newChan.current_program_time || '20:00 - 22:00',
          newChan.next_program || null,
          Boolean(newChan.is_live),
          newChan.is_locked,
          Boolean(newChan.is_featured),
          newChan.is_active,
          newChan.description || '',
          newChan.created_at,
          newChan.updated_at
        ]
      );
    }
    return newChan;
  }

  const db = loadDatabase();
  db.channels.push(newChan);
  saveDatabase(db);
  return newChan;
}

export async function updateChannel(id: string, updates: Partial<DbChannel>): Promise<DbChannel | null> {
  const now = new Date().toISOString();
  
  if (updates.status !== undefined) {
    updates.is_active = updates.status !== 'inactive';
  }
  if (updates.access_permission !== undefined) {
    updates.is_locked = updates.access_permission === 'restricted';
  }

  if (isPostgresActive()) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id') continue;
      fields.push(`${key} = $${idx}`);
      values.push(key === 'alternative_streams' ? JSON.stringify(val) : val);
      idx++;
    }
    fields.push(`updated_at = $${idx}`);
    values.push(now);
    values.push(id);

    try {
      const query = `UPDATE channels SET ${fields.join(', ')} WHERE id = $${idx + 1} RETURNING *`;
      const res = await getPostgresPool()!.query(query, values);
      if (res.rows[0]) {
        const r = res.rows[0];
        return {
          ...r,
          alternative_streams: typeof r.alternative_streams === 'string' ? JSON.parse(r.alternative_streams) : (r.alternative_streams || []),
          status: r.status || (r.is_active ? 'active' : 'inactive'),
          access_permission: r.access_permission || (r.is_locked ? 'restricted' : 'free')
        };
      }
    } catch (err: any) {
      console.warn('[PostgreSQL] updateChannel error:', err.message);
    }
  }

  const db = loadDatabase();
  const index = db.channels.findIndex(c => c.id === id);
  if (index === -1) return null;

  db.channels[index] = { ...db.channels[index], ...updates, updated_at: now };
  saveDatabase(db);
  return db.channels[index];
}

export async function deleteChannel(id: string): Promise<boolean> {
  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query('DELETE FROM channels WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  }
  const db = loadDatabase();
  const prevLen = db.channels.length;
  db.channels = db.channels.filter(c => c.id !== id);
  saveDatabase(db);
  return db.channels.length < prevLen;
}

// ==========================================
// 5. STREAM SOURCES
// ==========================================
export async function getStreamSources(): Promise<DbStreamSource[]> {
  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query('SELECT * FROM stream_sources ORDER BY is_primary DESC, created_at ASC');
    return res.rows;
  }
  const db = loadDatabase();
  return db.stream_sources;
}

// ==========================================
// 6. SUBSCRIBERS
// ==========================================
export async function getSubscribers(): Promise<DbSubscriber[]> {
  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query('SELECT * FROM subscribers ORDER BY created_at DESC');
    return res.rows;
  }
  const db = loadDatabase();
  return db.subscribers;
}

export async function createSubscriber(subscriber: Omit<DbSubscriber, 'id' | 'created_at' | 'updated_at'>): Promise<DbSubscriber> {
  const id = `sub_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const newSub: DbSubscriber = { ...subscriber, id, created_at: now, updated_at: now };

  if (isPostgresActive()) {
    await getPostgresPool()!.query(
      `INSERT INTO subscribers (id, full_name, whatsapp, email, password_hash, status, notes, plan_id, plan_name, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [newSub.id, newSub.full_name, newSub.whatsapp, newSub.email, newSub.password_hash || '', newSub.status, newSub.notes || null, newSub.plan_id || null, newSub.plan_name || null, newSub.expires_at || null, newSub.created_at, newSub.updated_at]
    );
    return newSub;
  }

  const db = loadDatabase();
  db.subscribers.unshift(newSub);
  saveDatabase(db);
  return newSub;
}

export async function updateSubscriber(id: string, updates: Partial<DbSubscriber>): Promise<DbSubscriber | null> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    fields.push(`updated_at = $${idx}`);
    values.push(now);
    values.push(id);

    const query = `UPDATE subscribers SET ${fields.join(', ')} WHERE id = $${idx + 1} RETURNING *`;
    const res = await getPostgresPool()!.query(query, values);
    return res.rows[0] || null;
  }

  const db = loadDatabase();
  const index = db.subscribers.findIndex(s => s.id === id);
  if (index === -1) return null;

  db.subscribers[index] = { ...db.subscribers[index], ...updates, updated_at: now };
  saveDatabase(db);
  return db.subscribers[index];
}

// ==========================================
// 7. SUBSCRIPTION PLANS (TOTALMENTE EDITÁVEIS)
// ==========================================
export async function getSubscriptionPlans(onlyActive = false): Promise<DbSubscriptionPlan[]> {
  if (isPostgresActive()) {
    const query = onlyActive
      ? 'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY display_order ASC, price ASC'
      : 'SELECT * FROM subscription_plans ORDER BY display_order ASC, price ASC';
    const res = await getPostgresPool()!.query(query);
    return res.rows.map(r => ({
      ...r,
      price: parseFloat(r.price),
      duration_days: r.duration_days || (r.duration_months ? r.duration_months * 30 : 30),
      features: typeof r.features === 'string' ? JSON.parse(r.features) : (r.features || []),
      allowed_category_ids: typeof r.allowed_category_ids === 'string' ? JSON.parse(r.allowed_category_ids) : (r.allowed_category_ids || []),
      allowed_channel_ids: typeof r.allowed_channel_ids === 'string' ? JSON.parse(r.allowed_channel_ids) : (r.allowed_channel_ids || [])
    }));
  }
  const db = loadDatabase();
  const list = onlyActive ? db.subscription_plans.filter(p => p.is_active) : db.subscription_plans;
  return list.sort((a, b) => a.display_order - b.display_order);
}

export async function getSubscriptionPlanById(id: string): Promise<DbSubscriptionPlan | null> {
  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query('SELECT * FROM subscription_plans WHERE id = $1 LIMIT 1', [id]);
    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      ...r,
      price: parseFloat(r.price),
      duration_days: r.duration_days || (r.duration_months ? r.duration_months * 30 : 30),
      features: typeof r.features === 'string' ? JSON.parse(r.features) : (r.features || []),
      allowed_category_ids: typeof r.allowed_category_ids === 'string' ? JSON.parse(r.allowed_category_ids) : (r.allowed_category_ids || []),
      allowed_channel_ids: typeof r.allowed_channel_ids === 'string' ? JSON.parse(r.allowed_channel_ids) : (r.allowed_channel_ids || [])
    };
  }
  const db = loadDatabase();
  return db.subscription_plans.find(p => p.id === id) || null;
}

export async function createSubscriptionPlan(plan: Omit<DbSubscriptionPlan, 'id' | 'created_at' | 'updated_at'>): Promise<DbSubscriptionPlan> {
  const id = `plan_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const newPlan: DbSubscriptionPlan = {
    ...plan,
    id,
    duration_months: Math.max(1, Math.round((plan.duration_days || 30) / 30)),
    created_at: now,
    updated_at: now
  };

  if (isPostgresActive()) {
    await getPostgresPool()!.query(
      `INSERT INTO subscription_plans (
        id, name, badge, price, period_label, duration_days, duration_months, description,
        features, max_screens, allowed_scope, allowed_category_ids, allowed_channel_ids,
        is_popular, is_active, display_order, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        newPlan.id, newPlan.name, newPlan.badge, newPlan.price, newPlan.period_label,
        newPlan.duration_days, newPlan.duration_months, newPlan.description,
        JSON.stringify(newPlan.features), newPlan.max_screens, newPlan.allowed_scope,
        JSON.stringify(newPlan.allowed_category_ids), JSON.stringify(newPlan.allowed_channel_ids),
        newPlan.is_popular, newPlan.is_active, newPlan.display_order, newPlan.created_at, newPlan.updated_at
      ]
    );
    return newPlan;
  }

  const db = loadDatabase();
  db.subscription_plans.push(newPlan);
  saveDatabase(db);
  return newPlan;
}

export async function updateSubscriptionPlan(id: string, updates: Partial<DbSubscriptionPlan>): Promise<DbSubscriptionPlan | null> {
  const now = new Date().toISOString();
  if (updates.duration_days) {
    updates.duration_months = Math.max(1, Math.round(updates.duration_days / 30));
  }

  if (isPostgresActive()) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id' || key === 'created_at') continue;
      fields.push(`${key} = $${idx}`);
      if (key === 'features' || key === 'allowed_category_ids' || key === 'allowed_channel_ids') {
        values.push(JSON.stringify(val));
      } else {
        values.push(val);
      }
      idx++;
    }
    fields.push(`updated_at = $${idx}`);
    values.push(now);
    values.push(id);

    const query = `UPDATE subscription_plans SET ${fields.join(', ')} WHERE id = $${idx + 1} RETURNING *`;
    const res = await getPostgresPool()!.query(query, values);
    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      ...r,
      price: parseFloat(r.price),
      duration_days: r.duration_days,
      features: typeof r.features === 'string' ? JSON.parse(r.features) : (r.features || []),
      allowed_category_ids: typeof r.allowed_category_ids === 'string' ? JSON.parse(r.allowed_category_ids) : (r.allowed_category_ids || []),
      allowed_channel_ids: typeof r.allowed_channel_ids === 'string' ? JSON.parse(r.allowed_channel_ids) : (r.allowed_channel_ids || [])
    };
  }

  const db = loadDatabase();
  const index = db.subscription_plans.findIndex(p => p.id === id);
  if (index === -1) return null;

  db.subscription_plans[index] = { ...db.subscription_plans[index], ...updates, updated_at: now };
  saveDatabase(db);
  return db.subscription_plans[index];
}

export async function deleteSubscriptionPlan(id: string): Promise<{ success: boolean; archived: boolean; message: string }> {
  if (isPostgresActive()) {
    const checkRes = await getPostgresPool()!.query(
      'SELECT COUNT(*) as count FROM subscribers WHERE plan_id = $1',
      [id]
    );
    const hasSubscribers = parseInt(checkRes.rows[0].count, 10) > 0;

    if (hasSubscribers) {
      await getPostgresPool()!.query('UPDATE subscription_plans SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
      return {
        success: true,
        archived: true,
        message: 'O plano possui assinaturas vinculadas e foi arquivado/desativado para manter o histórico financeiro.'
      };
    }

    const delRes = await getPostgresPool()!.query('DELETE FROM subscription_plans WHERE id = $1', [id]);
    return {
      success: (delRes.rowCount || 0) > 0,
      archived: false,
      message: 'Plano excluído com sucesso.'
    };
  }

  const db = loadDatabase();
  const hasSubscribers = db.subscribers.some(s => s.plan_id === id);

  if (hasSubscribers) {
    const idx = db.subscription_plans.findIndex(p => p.id === id);
    if (idx !== -1) {
      db.subscription_plans[idx].is_active = false;
      db.subscription_plans[idx].updated_at = new Date().toISOString();
      saveDatabase(db);
    }
    return {
      success: true,
      archived: true,
      message: 'O plano possui assinaturas vinculadas e foi arquivado/desativado para manter o histórico financeiro.'
    };
  }

  const prevLen = db.subscription_plans.length;
  db.subscription_plans = db.subscription_plans.filter(p => p.id !== id);
  saveDatabase(db);
  return {
    success: db.subscription_plans.length < prevLen,
    archived: false,
    message: 'Plano excluído com sucesso.'
  };
}

// ==========================================
// 8. PAYMENT CONFIGS (PIX & PAYPAL)
// ==========================================
export async function getPaymentConfigs(): Promise<DbPaymentConfigs> {
  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query('SELECT * FROM payment_configs WHERE id = $1 LIMIT 1', ['primary']);
    return res.rows[0];
  }
  const db = loadDatabase();
  return db.payment_configs;
}

export async function updatePaymentConfigs(updates: Partial<DbPaymentConfigs>): Promise<DbPaymentConfigs> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id') continue;
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    fields.push(`updated_at = $${idx}`);
    values.push(now);

    const query = `UPDATE payment_configs SET ${fields.join(', ')} WHERE id = 'primary' RETURNING *`;
    const res = await getPostgresPool()!.query(query, values);
    return res.rows[0];
  }

  const db = loadDatabase();
  db.payment_configs = { ...db.payment_configs, ...updates, updated_at: now };
  saveDatabase(db);
  return db.payment_configs;
}

// ==========================================
// 9. APPEARANCE CONFIGS
// ==========================================
export async function getAppearanceConfigs(): Promise<DbAppearanceConfigs> {
  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query('SELECT * FROM appearance_configs WHERE id = $1 LIMIT 1', ['primary']);
    return res.rows[0];
  }
  const db = loadDatabase();
  return db.appearance_configs;
}

export async function updateAppearanceConfigs(updates: Partial<DbAppearanceConfigs>): Promise<DbAppearanceConfigs> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id') continue;
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    fields.push(`updated_at = $${idx}`);
    values.push(now);

    const query = `UPDATE appearance_configs SET ${fields.join(', ')} WHERE id = 'primary' RETURNING *`;
    const res = await getPostgresPool()!.query(query, values);
    return res.rows[0];
  }

  const db = loadDatabase();
  db.appearance_configs = { ...db.appearance_configs, ...updates, updated_at: now };
  saveDatabase(db);
  return db.appearance_configs;
}

// ==========================================
// 10. AD SLOTS
// ==========================================
export async function getAdSlots(): Promise<DbAdSlot[]> {
  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query('SELECT * FROM ad_slots ORDER BY id ASC');
    return res.rows;
  }
  const db = loadDatabase();
  return db.ad_slots;
}

export async function updateAdSlot(id: string, updates: Partial<DbAdSlot>): Promise<DbAdSlot | null> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id') continue;
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    fields.push(`updated_at = $${idx}`);
    values.push(now);
    values.push(id);

    const query = `UPDATE ad_slots SET ${fields.join(', ')} WHERE id = $${idx + 1} RETURNING *`;
    const res = await getPostgresPool()!.query(query, values);
    return res.rows[0] || null;
  }

  const db = loadDatabase();
  const index = db.ad_slots.findIndex(a => a.id === id);
  if (index === -1) return null;

  db.ad_slots[index] = { ...db.ad_slots[index], ...updates, updated_at: now };
  saveDatabase(db);
  return db.ad_slots[index];
}

// ==========================================
// 11. ACCESS MODES (1, 2, 3)
// ==========================================
export async function getAccessModes(): Promise<DbAccessModes> {
  if (isPostgresActive()) {
    const res = await getPostgresPool()!.query('SELECT * FROM access_modes WHERE id = $1 LIMIT 1', ['primary']);
    return res.rows[0];
  }
  const db = loadDatabase();
  return db.access_modes;
}

export async function updateAccessModes(updates: Partial<DbAccessModes>): Promise<DbAccessModes> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id') continue;
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    fields.push(`updated_at = $${idx}`);
    values.push(now);

    const query = `UPDATE access_modes SET ${fields.join(', ')} WHERE id = 'primary' RETURNING *`;
    const res = await getPostgresPool()!.query(query, values);
    return res.rows[0];
  }

  const db = loadDatabase();
  db.access_modes = { ...db.access_modes, ...updates, updated_at: now };
  saveDatabase(db);
  return db.access_modes;
}

// ==========================================
// 12. PLAYBACK SESSIONS & ACCESS VERIFICATION
// ==========================================
export async function verifyPlaybackAccess(
  channelId: string,
  userEmail?: string | null
): Promise<{
  authorized: boolean;
  mode: 'free' | 'free_registered' | 'subscription';
  reason?: string;
  subscriber?: DbSubscriber | null;
}> {
  const accessModes = await getAccessModes();
  const currentMode = accessModes.current_mode;

  // Modo 1 — Gratuito sem cadastro
  if (currentMode === 'free') {
    return {
      authorized: true,
      mode: 'free'
    };
  }

  // Se não foi fornecido e-mail
  if (!userEmail) {
    if (currentMode === 'free_registered') {
      return {
        authorized: false,
        mode: 'free_registered',
        reason: 'O Modo 2 está ativo: é necessário criar uma conta gratuita para assistir.'
      };
    }
    return {
      authorized: false,
      mode: 'subscription',
      reason: 'O Modo 3 está ativo: faça login para acessar canais protegidos.'
    };
  }

  const cleanEmail = userEmail.toLowerCase().trim();
  const subscribers = await getSubscribers();
  const subscriber = subscribers.find(s => s.email.toLowerCase() === cleanEmail) || null;

  if (!subscriber) {
    return {
      authorized: false,
      mode: currentMode,
      reason: 'Usuário não cadastrado na plataforma.'
    };
  }

  // Modo 2 — Gratuito com cadastro
  if (currentMode === 'free_registered') {
    if (subscriber.status === 'blocked') {
      return {
        authorized: false,
        mode: 'free_registered',
        reason: 'Sua conta está bloqueada pela moderação.'
      };
    }
    return {
      authorized: true,
      mode: 'free_registered',
      subscriber
    };
  }

  // Modo 3 — Assinatura paga
  const channel = await getChannelById(channelId);
  if (channel && !channel.is_locked) {
    return {
      authorized: true,
      mode: 'subscription',
      subscriber
    };
  }

  if (subscriber.status !== 'active') {
    return {
      authorized: false,
      mode: 'subscription',
      reason: subscriber.status === 'pending'
        ? 'Sua assinatura está aguardando liberação do pagamento via Pix ou PayPal.'
        : 'Sua assinatura está inativa.'
    };
  }

  if (subscriber.expires_at) {
    const expiryDate = new Date(subscriber.expires_at);
    const now = new Date();
    if (expiryDate < now) {
      await updateSubscriber(subscriber.id, { status: 'expired' });
      return {
        authorized: false,
        mode: 'subscription',
        reason: 'Sua assinatura venceu. Renove seu plano para continuar assistindo aos canais exclusivos.'
      };
    }
  }

  // Check plan-specific channel/category restrictions if allowed_scope is custom
  if (subscriber.plan_id && channel) {
    const plan = await getSubscriptionPlanById(subscriber.plan_id);
    if (plan && plan.allowed_scope === 'custom') {
      const allowedCats = plan.allowed_category_ids || [];
      const allowedChans = plan.allowed_channel_ids || [];
      const isCatAllowed = allowedCats.includes(channel.category_id);
      const isChanAllowed = allowedChans.includes(channel.id);
      if (!isCatAllowed && !isChanAllowed) {
        return {
          authorized: false,
          mode: 'subscription',
          reason: `Seu plano atual (${plan.name}) não inclui a categoria ou o canal solicitado.`
        };
      }
    }
  }

  return {
    authorized: true,
    mode: 'subscription',
    subscriber
  };
}

// ==========================================
// 13. PLAYBACK SESSIONS & SIMULTANEOUS SCREENS CONTROL
// ==========================================

export async function cleanupExpiredPlaybackSessions(timeoutSeconds = 45): Promise<number> {
  const now = new Date();
  const threshold = new Date(now.getTime() - timeoutSeconds * 1000).toISOString();

  if (isPostgresActive()) {
    try {
      const res = await getPostgresPool()!.query(
        `UPDATE playback_sessions
         SET is_active = false, ended_at = NOW(), ended_reason = 'heartbeat_timeout'
         WHERE is_active = true AND last_heartbeat < (NOW() - make_interval(secs => $1))`,
        [timeoutSeconds]
      );
      return res.rowCount || 0;
    } catch (err: any) {
      console.warn('[PostgreSQL] Failed to cleanup sessions:', err.message);
      return 0;
    }
  }

  const db = loadDatabase();
  let modified = 0;
  if (!Array.isArray(db.playback_sessions)) {
    db.playback_sessions = [];
  }

  db.playback_sessions = db.playback_sessions.map(s => {
    if (s.is_active && new Date(s.last_heartbeat).getTime() < new Date(threshold).getTime()) {
      modified++;
      return {
        ...s,
        is_active: false,
        ended_at: now.toISOString(),
        ended_reason: 'heartbeat_timeout'
      };
    }
    return s;
  });

  if (modified > 0) {
    saveDatabase(db);
  }
  return modified;
}

export async function getActiveSessionsForSubscriber(subscriberId: string): Promise<DbPlaybackSession[]> {
  await cleanupExpiredPlaybackSessions();
  if (isPostgresActive()) {
    try {
      const res = await getPostgresPool()!.query(
        'SELECT * FROM playback_sessions WHERE subscriber_id = $1 AND is_active = true ORDER BY started_at DESC',
        [subscriberId]
      );
      return res.rows;
    } catch (err: any) {
      console.warn('[PostgreSQL] getActiveSessionsForSubscriber fallback:', err.message);
    }
  }
  const db = loadDatabase();
  return (db.playback_sessions || []).filter(s => s.subscriber_id === subscriberId && s.is_active);
}

export async function startPlaybackSession(params: {
  channelId: string;
  userEmail?: string | null;
  deviceInfo?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{
  authorized: boolean;
  limitReached?: boolean;
  maxScreens?: number;
  activeScreensCount?: number;
  activeSessions?: DbPlaybackSession[];
  reason?: string;
  session?: DbPlaybackSession;
  playbackToken?: string;
}> {
  // First clean up expired/abandoned sessions
  await cleanupExpiredPlaybackSessions();

  const { channelId, userEmail, deviceInfo, ipAddress, userAgent } = params;
  const channel = await getChannelById(channelId);
  const channelName = channel ? channel.name : 'Canal Desconhecido';

  const accessCheck = await verifyPlaybackAccess(channelId, userEmail);
  if (!accessCheck.authorized) {
    return {
      authorized: false,
      reason: accessCheck.reason
    };
  }

  const accessModes = await getAccessModes();
  const currentMode = accessModes.current_mode;

  // Modo 1: Acesso livre sem cadastro
  if (currentMode === 'free') {
    const sessionId = `sess_${crypto.randomUUID().slice(0, 12)}`;
    const playbackToken = `pb_${crypto.randomUUID().replace(/-/g, '')}`;
    const now = new Date().toISOString();
    const session: DbPlaybackSession = {
      id: sessionId,
      subscriber_id: null,
      channel_id: channelId,
      channel_name: channelName,
      device_info: deviceInfo || 'Navegador Web (Visitante)',
      playback_token: playbackToken,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      started_at: now,
      last_heartbeat: now,
      is_active: true
    };

    if (isPostgresActive()) {
      try {
        await getPostgresPool()!.query(
          `INSERT INTO playback_sessions (id, subscriber_id, channel_id, channel_name, device_info, playback_token, ip_address, user_agent, started_at, last_heartbeat, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [session.id, session.subscriber_id, session.channel_id, session.channel_name, session.device_info, session.playback_token, session.ip_address, session.user_agent, session.started_at, session.last_heartbeat, session.is_active]
        );
      } catch (err: any) {
        console.warn('[PostgreSQL] startPlaybackSession fallback:', err.message);
      }
    }

    const db = loadDatabase();
    if (!Array.isArray(db.playback_sessions)) db.playback_sessions = [];
    db.playback_sessions.push(session);
    saveDatabase(db);

    return {
      authorized: true,
      session,
      playbackToken,
      maxScreens: 999,
      activeScreensCount: 1
    };
  }

  // Subscriber session control (Modo 2 e 3)
  const subscriber = accessCheck.subscriber;
  if (!subscriber) {
    return {
      authorized: false,
      reason: 'Assinante não identificado para controle de telas.'
    };
  }

  // Determine max allowed screens from plan
  let maxScreens = 1;
  let planName = 'Plano Padrão';
  if (subscriber.plan_id) {
    const plan = await getSubscriptionPlanById(subscriber.plan_id);
    if (plan) {
      maxScreens = plan.max_screens || 1;
      planName = plan.name;
    }
  }

  // Check active sessions
  const activeSessions = await getActiveSessionsForSubscriber(subscriber.id);

  // Impede novas sessões quando o limite do plano for atingido
  if (activeSessions.length >= maxScreens) {
    return {
      authorized: false,
      limitReached: true,
      maxScreens,
      activeScreensCount: activeSessions.length,
      activeSessions,
      reason: `Limite de telas atingido. O seu plano (${planName}) permite até ${maxScreens} tela(s) simultânea(s). No momento há ${activeSessions.length} aparelho(s) assistindo. Encerre uma das sessões para liberar o acesso.`
    };
  }

  const sessionId = `sess_${crypto.randomUUID().slice(0, 12)}`;
  const playbackToken = `pb_${crypto.randomUUID().replace(/-/g, '')}`;
  const now = new Date().toISOString();

  const session: DbPlaybackSession = {
    id: sessionId,
    subscriber_id: subscriber.id,
    subscriber_email: subscriber.email,
    subscriber_name: subscriber.full_name,
    channel_id: channelId,
    channel_name: channelName,
    device_info: deviceInfo || 'Dispositivo Web',
    playback_token: playbackToken,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    started_at: now,
    last_heartbeat: now,
    is_active: true
  };

  if (isPostgresActive()) {
    try {
      await getPostgresPool()!.query(
        `INSERT INTO playback_sessions (id, subscriber_id, channel_id, channel_name, device_info, playback_token, ip_address, user_agent, started_at, last_heartbeat, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [session.id, session.subscriber_id, session.channel_id, session.channel_name, session.device_info, session.playback_token, session.ip_address, session.user_agent, session.started_at, session.last_heartbeat, session.is_active]
      );
    } catch (err: any) {
      console.warn('[PostgreSQL] startPlaybackSession insert fallback:', err.message);
    }
  }

  const db = loadDatabase();
  if (!Array.isArray(db.playback_sessions)) db.playback_sessions = [];
  db.playback_sessions.push(session);
  saveDatabase(db);

  return {
    authorized: true,
    session,
    playbackToken,
    maxScreens,
    activeScreensCount: activeSessions.length + 1
  };
}

export async function heartbeatPlaybackSession(sessionId: string, playbackToken?: string): Promise<{
  success: boolean;
  terminated?: boolean;
  reason?: string;
}> {
  const now = new Date().toISOString();

  if (isPostgresActive()) {
    try {
      const checkRes = await getPostgresPool()!.query(
        'SELECT id, is_active, ended_reason, playback_token FROM playback_sessions WHERE id = $1 LIMIT 1',
        [sessionId]
      );
      if (!checkRes.rows[0]) {
        return { success: false, terminated: true, reason: 'Sessão inexistente ou expirada' };
      }
      const s = checkRes.rows[0];
      if (playbackToken && s.playback_token && s.playback_token !== playbackToken) {
        return { success: false, terminated: true, reason: 'Token de reprodução inválido' };
      }
      if (!s.is_active) {
        return { success: false, terminated: true, reason: s.ended_reason || 'Sessão encerrada' };
      }

      await getPostgresPool()!.query(
        'UPDATE playback_sessions SET last_heartbeat = NOW() WHERE id = $1',
        [sessionId]
      );
      return { success: true };
    } catch (err: any) {
      console.warn('[PostgreSQL] heartbeat error:', err.message);
    }
  }

  const db = loadDatabase();
  const session = (db.playback_sessions || []).find(s => s.id === sessionId);
  if (!session) {
    return { success: false, terminated: true, reason: 'Sessão inexistente ou expirada' };
  }
  if (playbackToken && session.playback_token && session.playback_token !== playbackToken) {
    return { success: false, terminated: true, reason: 'Token de reprodução inválido' };
  }
  if (!session.is_active) {
    return { success: false, terminated: true, reason: session.ended_reason || 'Sessão encerrada' };
  }

  session.last_heartbeat = now;
  saveDatabase(db);
  return { success: true };
}

export async function endPlaybackSession(sessionId: string, reason = 'user_closed', subscriberId?: string): Promise<boolean> {
  const now = new Date().toISOString();

  if (isPostgresActive()) {
    try {
      let query = 'UPDATE playback_sessions SET is_active = false, ended_at = NOW(), ended_reason = $1 WHERE id = $2';
      const params: any[] = [reason, sessionId];
      if (subscriberId) {
        query += ' AND subscriber_id = $3';
        params.push(subscriberId);
      }
      const res = await getPostgresPool()!.query(query, params);
      return (res.rowCount || 0) > 0;
    } catch (err: any) {
      console.warn('[PostgreSQL] endPlaybackSession error:', err.message);
    }
  }

  const db = loadDatabase();
  const session = (db.playback_sessions || []).find(s => s.id === sessionId);
  if (!session) return false;
  if (subscriberId && session.subscriber_id !== subscriberId) return false;

  session.is_active = false;
  session.ended_at = now;
  session.ended_reason = reason;
  saveDatabase(db);
  return true;
}

export async function terminateSessionByAdmin(sessionId: string, adminEmail: string): Promise<boolean> {
  return endPlaybackSession(sessionId, `Encerrada pelo administrador (${adminEmail})`);
}

export async function getSubscriberSessions(subscriberEmail: string): Promise<{
  subscriber: DbSubscriber | null;
  maxScreens: number;
  activeSessions: DbPlaybackSession[];
  recentSessions: DbPlaybackSession[];
}> {
  await cleanupExpiredPlaybackSessions();
  const cleanEmail = subscriberEmail.toLowerCase().trim();
  const subscribers = await getSubscribers();
  const sub = subscribers.find(s => s.email.toLowerCase() === cleanEmail) || null;
  if (!sub) {
    return { subscriber: null, maxScreens: 1, activeSessions: [], recentSessions: [] };
  }

  let maxScreens = 1;
  if (sub.plan_id) {
    const plan = await getSubscriptionPlanById(sub.plan_id);
    if (plan) maxScreens = plan.max_screens || 1;
  }

  if (isPostgresActive()) {
    try {
      const res = await getPostgresPool()!.query(
        'SELECT * FROM playback_sessions WHERE subscriber_id = $1 ORDER BY started_at DESC LIMIT 20',
        [sub.id]
      );
      const rows = res.rows;
      return {
        subscriber: sub,
        maxScreens,
        activeSessions: rows.filter((r: any) => r.is_active),
        recentSessions: rows
      };
    } catch (err: any) {
      console.warn('[PostgreSQL] getSubscriberSessions error:', err.message);
    }
  }

  const db = loadDatabase();
  const userSessions = (db.playback_sessions || [])
    .filter(s => s.subscriber_id === sub.id)
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

  return {
    subscriber: sub,
    maxScreens,
    activeSessions: userSessions.filter(s => s.is_active),
    recentSessions: userSessions.slice(0, 20)
  };
}

export async function getPlaybackStatistics(): Promise<any> {
  await cleanupExpiredPlaybackSessions();

  const subscribers = await getSubscribers();
  const plans = await getSubscriptionPlans();
  const channels = await getChannels(false);

  let allSessions: DbPlaybackSession[] = [];
  if (isPostgresActive()) {
    try {
      const res = await getPostgresPool()!.query('SELECT * FROM playback_sessions ORDER BY started_at DESC LIMIT 100');
      allSessions = res.rows;
    } catch (err: any) {
      console.warn('[PostgreSQL] getPlaybackStatistics sessions query error:', err.message);
    }
  }

  if (allSessions.length === 0) {
    const db = loadDatabase();
    allSessions = db.playback_sessions || [];
  }

  const activeSessions = allSessions.filter(s => s.is_active);
  const activeSessionsCount = activeSessions.length;

  // Plan map for fast screen lookup
  const planMap = new Map<string, DbSubscriptionPlan>();
  plans.forEach(p => planMap.set(p.id, p));

  // Channel map for names
  const channelMap = new Map<string, DbChannel>();
  channels.forEach(c => channelMap.set(c.id, c));

  // Group active sessions by subscriber
  const subSessionsMap = new Map<string, DbPlaybackSession[]>();
  activeSessions.forEach(s => {
    if (s.subscriber_id) {
      const arr = subSessionsMap.get(s.subscriber_id) || [];
      arr.push(s);
      subSessionsMap.set(s.subscriber_id, arr);
    }
  });

  const subscribersWithSessions = Array.from(subSessionsMap.entries()).map(([subId, sessList]) => {
    const sub = subscribers.find(u => u.id === subId);
    const plan = sub?.plan_id ? planMap.get(sub.plan_id) : null;
    return {
      subscriberId: subId,
      subscriberName: sub?.full_name || 'Assinante Desconhecido',
      subscriberEmail: sub?.email || '',
      planName: plan?.name || sub?.plan_name || 'Plano Padrão',
      maxScreens: plan?.max_screens || 1,
      activeSessionsCount: sessList.length,
      activeSessions: sessList.map(s => ({
        sessionId: s.id,
        channelId: s.channel_id,
        channelName: s.channel_name || channelMap.get(s.channel_id)?.name || 'Canal',
        deviceInfo: s.device_info || 'Web',
        startedAt: s.started_at,
        ipAddress: s.ip_address
      }))
    };
  });

  // Audience by Channel
  const channelAudienceMap = new Map<string, number>();
  activeSessions.forEach(s => {
    const count = channelAudienceMap.get(s.channel_id) || 0;
    channelAudienceMap.set(s.channel_id, count + 1);
  });

  const audienceByChannel = channels
    .map(c => ({
      channelId: c.id,
      channelName: c.name,
      categoryName: c.category_name || '',
      viewersCount: channelAudienceMap.get(c.id) || 0
    }))
    .sort((a, b) => b.viewersCount - a.viewersCount);

  // Recent Sessions History
  const recentSessionsHistory = allSessions.slice(0, 30).map(s => {
    const sub = s.subscriber_id ? subscribers.find(u => u.id === s.subscriber_id) : null;
    const chan = channelMap.get(s.channel_id);
    const startMs = new Date(s.started_at).getTime();
    const endMs = s.ended_at ? new Date(s.ended_at).getTime() : new Date(s.last_heartbeat).getTime();
    const durationSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));

    return {
      id: s.id,
      subscriberEmail: s.subscriber_email || sub?.email || (s.subscriber_id ? 'Assinante' : 'Visitante Anônimo'),
      subscriberName: s.subscriber_name || sub?.full_name || '',
      channelName: s.channel_name || chan?.name || 'Canal',
      deviceInfo: s.device_info || 'Web',
      startedAt: s.started_at,
      endedAt: s.ended_at,
      durationSeconds,
      status: s.is_active ? 'active' : 'ended',
      endedReason: s.ended_reason,
      ipAddress: s.ip_address
    };
  });

  const totalSubscribers = subscribers.length;
  const activeSubscribers = subscribers.filter(s => s.status === 'active').length;

  return {
    totalSubscribers,
    activeSubscribers,
    activeSessionsCount,
    peakConcurrentViewers: Math.max(activeSessionsCount, 1),
    subscribersWithSessions,
    audienceByChannel,
    recentSessionsHistory
  };
}

// ==========================================
// 14. MANUAL PAYMENT ORDERS & FINANCIAL MANAGEMENT
// ==========================================

export async function createManualOrder(params: {
  subscriberId?: string;
  subscriberName?: string;
  subscriberEmail: string;
  subscriberWhatsapp?: string;
  planId: string;
  paymentMethod: 'pix' | 'paypal';
  notes?: string;
}): Promise<DbManualOrder> {
  const plan = await getSubscriptionPlanById(params.planId);
  if (!plan) {
    throw new Error('Plano de assinatura não encontrado');
  }

  const orderId = `ord_${crypto.randomUUID().slice(0, 12)}`;
  const orderCode = `PED-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();
  const paymentConfigs = await getPaymentConfigs();

  let pixCopyPaste: string | null = null;
  if (params.paymentMethod === 'pix') {
    pixCopyPaste = generatePixCopyPaste({
      key: paymentConfigs.pix_key,
      recipientName: paymentConfigs.pix_recipient_name,
      city: paymentConfigs.pix_city,
      amount: plan.price,
      txId: orderCode
    });
  }

  // Find or determine subscriber_id
  let subId = params.subscriberId;
  if (!subId) {
    const existingSubs = await getSubscribers();
    const found = existingSubs.find(s => s.email.toLowerCase() === params.subscriberEmail.toLowerCase().trim());
    if (found) {
      subId = found.id;
    } else {
      // Create initial pending subscriber if not registered yet
      const newSub = await createSubscriber({
        full_name: params.subscriberName || 'Cliente Gato Net',
        whatsapp: params.subscriberWhatsapp || '11999999999',
        email: params.subscriberEmail.toLowerCase().trim(),
        status: 'pending',
        plan_id: plan.id,
        plan_name: plan.name,
        notes: `Pedido manual ${orderCode} aguardando comprovante`
      });
      subId = newSub.id;
    }
  }

  const order: DbManualOrder = {
    id: orderId,
    order_code: orderCode,
    subscriber_id: subId,
    subscriber_name: params.subscriberName,
    subscriber_email: params.subscriberEmail.toLowerCase().trim(),
    subscriber_whatsapp: params.subscriberWhatsapp,
    plan_id: plan.id,
    plan_name: plan.name,
    plan_duration_days: plan.duration_days || 30,
    payment_method: params.paymentMethod,
    amount: plan.price,
    status: 'pending',
    notes: params.notes || null,
    receipt_url: null,
    receipt_code: null,
    pix_copy_paste: pixCopyPaste,
    reviewed_by_admin_id: null,
    reviewed_by_admin_email: null,
    reviewed_at: null,
    rejection_reason: null,
    created_at: now,
    updated_at: now
  };

  if (isPostgresActive()) {
    try {
      await getPostgresPool()!.query(
        `INSERT INTO manual_orders (
           id, order_code, subscriber_id, subscriber_name, subscriber_email, subscriber_whatsapp,
           plan_id, plan_name, plan_duration_days, payment_method, amount, status, notes,
           receipt_url, receipt_code, pix_copy_paste, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          order.id,
          order.order_code,
          order.subscriber_id,
          order.subscriber_name || null,
          order.subscriber_email || null,
          order.subscriber_whatsapp || null,
          order.plan_id,
          order.plan_name || null,
          order.plan_duration_days || 30,
          order.payment_method,
          order.amount,
          order.status,
          order.notes || null,
          order.receipt_url || null,
          order.receipt_code || null,
          order.pix_copy_paste || null,
          order.created_at,
          order.updated_at
        ]
      );
    } catch (err: any) {
      console.warn('[PostgreSQL] createManualOrder full insert fallback:', err.message);
      await getPostgresPool()!.query(
        `INSERT INTO manual_orders (id, subscriber_id, plan_id, payment_method, amount, status, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [order.id, order.subscriber_id, order.plan_id, order.payment_method, order.amount, order.status, order.notes || null, order.created_at, order.updated_at]
      );
    }
  }

  const db = loadDatabase();
  if (!Array.isArray(db.manual_orders)) db.manual_orders = [];
  db.manual_orders.unshift(order);
  saveDatabase(db);

  return order;
}

export async function getManualOrders(filter?: { status?: string; subscriberId?: string }): Promise<DbManualOrder[]> {
  if (isPostgresActive()) {
    try {
      let query = 'SELECT * FROM manual_orders';
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (filter?.status) {
        conditions.push(`status = $${idx++}`);
        params.push(filter.status);
      }
      if (filter?.subscriberId) {
        conditions.push(`subscriber_id = $${idx++}`);
        params.push(filter.subscriberId);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      query += ' ORDER BY created_at DESC LIMIT 200';

      const res = await getPostgresPool()!.query(query, params);
      return res.rows.map(r => ({
        ...r,
        amount: parseFloat(r.amount) || 0
      }));
    } catch (err: any) {
      console.warn('[PostgreSQL] getManualOrders fallback:', err.message);
    }
  }

  const db = loadDatabase();
  let list = db.manual_orders || [];
  if (filter?.status) {
    list = list.filter(o => o.status === filter.status);
  }
  if (filter?.subscriberId) {
    list = list.filter(o => o.subscriber_id === filter.subscriberId);
  }
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getManualOrderById(idOrCode: string): Promise<DbManualOrder | null> {
  if (isPostgresActive()) {
    try {
      const res = await getPostgresPool()!.query(
        'SELECT * FROM manual_orders WHERE id = $1 OR order_code = $1 LIMIT 1',
        [idOrCode]
      );
      if (res.rows[0]) {
        const r = res.rows[0];
        return { ...r, amount: parseFloat(r.amount) || 0 };
      }
    } catch (err: any) {
      console.warn('[PostgreSQL] getManualOrderById fallback:', err.message);
    }
  }

  const db = loadDatabase();
  return (db.manual_orders || []).find(o => o.id === idOrCode || o.order_code === idOrCode) || null;
}

export async function submitOrderReceipt(
  orderId: string,
  receiptData: { receipt_url?: string; receipt_code?: string; notes?: string }
): Promise<DbManualOrder | null> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    try {
      const res = await getPostgresPool()!.query(
        `UPDATE manual_orders
         SET receipt_url = COALESCE($1, receipt_url),
             receipt_code = COALESCE($2, receipt_code),
             notes = COALESCE($3, notes),
             updated_at = $4
         WHERE id = $5 OR order_code = $5
         RETURNING *`,
        [receiptData.receipt_url || null, receiptData.receipt_code || null, receiptData.notes || null, now, orderId]
      );
      if (res.rows[0]) {
        const r = res.rows[0];
        return { ...r, amount: parseFloat(r.amount) || 0 };
      }
    } catch (err: any) {
      console.warn('[PostgreSQL] submitOrderReceipt fallback:', err.message);
    }
  }

  const db = loadDatabase();
  const order = (db.manual_orders || []).find(o => o.id === orderId || o.order_code === orderId);
  if (!order) return null;

  if (receiptData.receipt_url) order.receipt_url = receiptData.receipt_url;
  if (receiptData.receipt_code) order.receipt_code = receiptData.receipt_code;
  if (receiptData.notes) order.notes = receiptData.notes;
  order.updated_at = now;
  saveDatabase(db);
  return order;
}

export async function approveManualOrder(
  orderId: string,
  adminId: string,
  adminEmail: string
): Promise<{ success: boolean; order?: DbManualOrder; subscriber?: DbSubscriber; message?: string }> {
  const order = await getManualOrderById(orderId);
  if (!order) {
    return { success: false, message: 'Pedido não encontrado.' };
  }

  // Impede aprovações duplicadas
  if (order.status !== 'pending') {
    return {
      success: false,
      message: `Este pedido já foi ${order.status === 'approved' ? 'aprovado' : 'rejeitado'} anteriormente e não pode ser processado novamente.`
    };
  }

  const plan = await getSubscriptionPlanById(order.plan_id);
  const durationDays = plan?.duration_days || order.plan_duration_days || 30;
  const now = new Date();

  // Find subscriber by id or email
  let subscriber: DbSubscriber | null = null;
  const subscribers = await getSubscribers();
  if (order.subscriber_id) {
    subscriber = subscribers.find(s => s.id === order.subscriber_id) || null;
  }
  if (!subscriber && order.subscriber_email) {
    subscriber = subscribers.find(s => s.email.toLowerCase() === order.subscriber_email?.toLowerCase()) || null;
  }

  // Calculate expiration date (accumulate if currently active)
  let baseDate = now;
  if (subscriber?.expires_at) {
    const currentExpiry = new Date(subscriber.expires_at);
    if (currentExpiry > now && subscriber.status === 'active') {
      baseDate = currentExpiry;
    }
  }
  const newExpiresAt = new Date(baseDate.getTime() + durationDays * 86400000).toISOString().slice(0, 10);

  // Update or create subscriber
  if (subscriber) {
    subscriber = await updateSubscriber(subscriber.id, {
      status: 'active',
      plan_id: order.plan_id,
      plan_name: plan?.name || order.plan_name || 'Plano Gato Net',
      expires_at: newExpiresAt,
      notes: `Aprovado por ${adminEmail} (Pedido ${order.order_code}) em ${now.toLocaleDateString('pt-BR')}`
    });
  } else {
    subscriber = await createSubscriber({
      full_name: order.subscriber_name || 'Assinante Gato Net',
      whatsapp: order.subscriber_whatsapp || '11999999999',
      email: order.subscriber_email || `cliente_${order.order_code.toLowerCase()}@gatonet.tv`,
      status: 'active',
      plan_id: order.plan_id,
      plan_name: plan?.name || order.plan_name || 'Plano Gato Net',
      expires_at: newExpiresAt,
      notes: `Criado e aprovado por ${adminEmail} (Pedido ${order.order_code})`
    });
  }

  // Update order status to approved
  const nowIso = now.toISOString();
  if (isPostgresActive()) {
    try {
      await getPostgresPool()!.query(
        `UPDATE manual_orders
         SET status = 'approved',
             reviewed_by_admin_id = $1,
             reviewed_by_admin_email = $2,
             reviewed_at = $3,
             updated_at = $3
         WHERE id = $4`,
        [adminId, adminEmail, nowIso, order.id]
      );
    } catch (err: any) {
      console.warn('[PostgreSQL] approveManualOrder order update fallback:', err.message);
    }
  }

  const db = loadDatabase();
  const dbOrder = (db.manual_orders || []).find(o => o.id === order.id);
  if (dbOrder) {
    dbOrder.status = 'approved';
    dbOrder.reviewed_by_admin_id = adminId;
    dbOrder.reviewed_by_admin_email = adminEmail;
    dbOrder.reviewed_at = nowIso;
    dbOrder.updated_at = nowIso;
    saveDatabase(db);
  }

  order.status = 'approved';
  order.reviewed_by_admin_id = adminId;
  order.reviewed_by_admin_email = adminEmail;
  order.reviewed_at = nowIso;

  await createAuditLog(
    adminId,
    adminEmail,
    'APPROVE_MANUAL_PAYMENT',
    'manual_orders',
    order.id,
    {
      order_code: order.order_code,
      amount: order.amount,
      plan_name: plan?.name || order.plan_name,
      subscriber_email: order.subscriber_email,
      new_expires_at: newExpiresAt
    },
    null
  );

  return {
    success: true,
    order,
    subscriber: subscriber || undefined,
    message: `Pagamento de R$ ${order.amount.toFixed(2)} aprovado com sucesso! Assinatura ativada até ${newExpiresAt}.`
  };
}

export async function rejectManualOrder(
  orderId: string,
  adminId: string,
  adminEmail: string,
  reason: string
): Promise<{ success: boolean; order?: DbManualOrder; message?: string }> {
  const order = await getManualOrderById(orderId);
  if (!order) {
    return { success: false, message: 'Pedido não encontrado.' };
  }

  if (order.status !== 'pending') {
    return {
      success: false,
      message: `Este pedido já foi ${order.status === 'approved' ? 'aprovado' : 'rejeitado'} anteriormente.`
    };
  }

  const nowIso = new Date().toISOString();
  if (isPostgresActive()) {
    try {
      await getPostgresPool()!.query(
        `UPDATE manual_orders
         SET status = 'rejected',
             rejection_reason = $1,
             reviewed_by_admin_id = $2,
             reviewed_by_admin_email = $3,
             reviewed_at = $4,
             updated_at = $4
         WHERE id = $5`,
        [reason, adminId, adminEmail, nowIso, order.id]
      );
    } catch (err: any) {
      console.warn('[PostgreSQL] rejectManualOrder order update fallback:', err.message);
    }
  }

  const db = loadDatabase();
  const dbOrder = (db.manual_orders || []).find(o => o.id === order.id);
  if (dbOrder) {
    dbOrder.status = 'rejected';
    dbOrder.rejection_reason = reason;
    dbOrder.reviewed_by_admin_id = adminId;
    dbOrder.reviewed_by_admin_email = adminEmail;
    dbOrder.reviewed_at = nowIso;
    dbOrder.updated_at = nowIso;
    saveDatabase(db);
  }

  order.status = 'rejected';
  order.rejection_reason = reason;
  order.reviewed_by_admin_id = adminId;
  order.reviewed_by_admin_email = adminEmail;
  order.reviewed_at = nowIso;

  await createAuditLog(
    adminId,
    adminEmail,
    'REJECT_MANUAL_PAYMENT',
    'manual_orders',
    order.id,
    { order_code: order.order_code, reason, subscriber_email: order.subscriber_email },
    null
  );

  return {
    success: true,
    order,
    message: 'Pedido de pagamento rejeitado com sucesso.'
  };
}

export async function getFinancialHistory(): Promise<{
  totalRevenue: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  orders: DbManualOrder[];
}> {
  const allOrders = await getManualOrders();
  const approved = allOrders.filter(o => o.status === 'approved');
  const pending = allOrders.filter(o => o.status === 'pending');
  const rejected = allOrders.filter(o => o.status === 'rejected');

  const totalRevenue = approved.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  return {
    totalRevenue,
    pendingCount: pending.length,
    approvedCount: approved.length,
    rejectedCount: rejected.length,
    orders: allOrders
  };
}

// ==========================================
// 15. FEATURED PROGRAMMING HIGHLIGHTS (DESTAQUES DA PROGRAMAÇÃO)
// ==========================================
export async function getFeaturedSettings(): Promise<DbFeaturedSettings> {
  if (isPostgresActive()) {
    try {
      const res = await getPostgresPool()!.query('SELECT * FROM featured_settings WHERE id = $1 LIMIT 1', ['primary']);
      if (res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (err: any) {
      console.warn('[Featured] Failed to query PostgreSQL featured_settings, falling back to storage:', err.message);
    }
  }
  const db = loadDatabase();
  return db.featured_settings || {
    id: 'primary',
    autoplay_interval_seconds: 6,
    max_active_highlights: 6,
    playback_banner_enabled: true,
    updated_at: new Date().toISOString()
  };
}

export async function updateFeaturedSettings(updates: Partial<DbFeaturedSettings>): Promise<DbFeaturedSettings> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, val] of Object.entries(updates)) {
        if (key === 'id') continue;
        fields.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
      fields.push(`updated_at = $${idx}`);
      values.push(now);

      const query = `UPDATE featured_settings SET ${fields.join(', ')} WHERE id = 'primary' RETURNING *`;
      const res = await getPostgresPool()!.query(query, values);
      if (res.rows.length > 0) return res.rows[0];
    } catch (err: any) {
      console.warn('[Featured] Failed to update PostgreSQL featured_settings, falling back to storage:', err.message);
    }
  }

  const db = loadDatabase();
  db.featured_settings = {
    ...(db.featured_settings || {
      id: 'primary',
      autoplay_interval_seconds: 6,
      max_active_highlights: 6,
      playback_banner_enabled: true,
      updated_at: now
    }),
    ...updates,
    updated_at: now
  };
  saveDatabase(db);
  return db.featured_settings;
}

export async function getFeaturedHighlights(includeInactive = false): Promise<DbFeaturedHighlight[]> {
  if (isPostgresActive()) {
    try {
      const query = includeInactive
        ? 'SELECT * FROM featured_highlights ORDER BY display_order ASC, created_at ASC'
        : 'SELECT * FROM featured_highlights WHERE is_active = true ORDER BY display_order ASC, created_at ASC';
      const res = await getPostgresPool()!.query(query);
      return res.rows;
    } catch (err: any) {
      console.warn('[Featured] Failed to query PostgreSQL featured_highlights, falling back to storage:', err.message);
    }
  }

  const db = loadDatabase();
  const list = db.featured_highlights || [];
  const filtered = includeInactive ? list : list.filter(item => item.is_active);
  return filtered.sort((a, b) => a.display_order - b.display_order);
}

export async function getFeaturedHighlightById(id: string): Promise<DbFeaturedHighlight | null> {
  if (isPostgresActive()) {
    try {
      const res = await getPostgresPool()!.query('SELECT * FROM featured_highlights WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] || null;
    } catch (err: any) {
      console.warn('[Featured] Error fetching highlight by id:', err.message);
    }
  }

  const db = loadDatabase();
  return (db.featured_highlights || []).find(f => f.id === id) || null;
}

export async function createFeaturedHighlight(
  data: Omit<DbFeaturedHighlight, 'created_at' | 'updated_at'>
): Promise<DbFeaturedHighlight> {
  const now = new Date().toISOString();
  const highlight: DbFeaturedHighlight = {
    ...data,
    created_at: now,
    updated_at: now
  };

  if (isPostgresActive()) {
    try {
      const query = `
        INSERT INTO featured_highlights (
          id, title, description, image_url, target_channel_id, button_text,
          time_label, start_date, end_date, placement, display_order, is_active, is_demo,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;
      const values = [
        highlight.id,
        highlight.title,
        highlight.description,
        highlight.image_url,
        highlight.target_channel_id,
        highlight.button_text,
        highlight.time_label,
        highlight.start_date,
        highlight.end_date,
        highlight.placement,
        highlight.display_order,
        highlight.is_active,
        highlight.is_demo,
        highlight.created_at,
        highlight.updated_at
      ];
      const res = await getPostgresPool()!.query(query, values);
      return res.rows[0];
    } catch (err: any) {
      console.warn('[Featured] Failed to insert in PostgreSQL, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.featured_highlights) db.featured_highlights = [];
  db.featured_highlights.push(highlight);
  saveDatabase(db);
  return highlight;
}

export async function updateFeaturedHighlight(
  id: string,
  updates: Partial<DbFeaturedHighlight>
): Promise<DbFeaturedHighlight | null> {
  const now = new Date().toISOString();

  if (isPostgresActive()) {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, val] of Object.entries(updates)) {
        if (key === 'id' || key === 'created_at') continue;
        fields.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
      fields.push(`updated_at = $${idx}`);
      values.push(now);
      idx++;

      values.push(id);
      const query = `UPDATE featured_highlights SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
      const res = await getPostgresPool()!.query(query, values);
      if (res.rows.length > 0) return res.rows[0];
    } catch (err: any) {
      console.warn('[Featured] Failed to update PostgreSQL highlight, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.featured_highlights) db.featured_highlights = [];
  const idx = db.featured_highlights.findIndex(f => f.id === id);
  if (idx === -1) return null;

  db.featured_highlights[idx] = {
    ...db.featured_highlights[idx],
    ...updates,
    updated_at: now
  };
  saveDatabase(db);
  return db.featured_highlights[idx];
}

export async function deleteFeaturedHighlight(id: string): Promise<boolean> {
  if (isPostgresActive()) {
    try {
      await getPostgresPool()!.query('DELETE FROM featured_highlights WHERE id = $1', [id]);
      return true;
    } catch (err: any) {
      console.warn('[Featured] Failed to delete in PostgreSQL, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.featured_highlights) return false;
  const initialLen = db.featured_highlights.length;
  db.featured_highlights = db.featured_highlights.filter(f => f.id !== id);
  saveDatabase(db);
  return db.featured_highlights.length < initialLen;
}

export async function reorderFeaturedHighlights(orderedIds: string[]): Promise<boolean> {
  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      for (let i = 0; i < orderedIds.length; i++) {
        await pool.query('UPDATE featured_highlights SET display_order = $1 WHERE id = $2', [i + 1, orderedIds[i]]);
      }
      return true;
    } catch (err: any) {
      console.warn('[Featured] Failed to reorder in PostgreSQL, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.featured_highlights) return false;
  orderedIds.forEach((id, idx) => {
    const item = db.featured_highlights.find(f => f.id === id);
    if (item) {
      item.display_order = idx + 1;
    }
  });
  db.featured_highlights.sort((a, b) => a.display_order - b.display_order);
  saveDatabase(db);
  return true;
}

// ==========================================
// 19. PRE-ROLL VIDEO ADVERTISING
// ==========================================

export async function getPrerollCampaigns(onlyActive = false): Promise<DbPrerollCampaign[]> {
  if (isPostgresActive()) {
    try {
      const query = onlyActive
        ? 'SELECT * FROM preroll_campaigns WHERE is_active = true ORDER BY priority DESC, created_at DESC'
        : 'SELECT * FROM preroll_campaigns ORDER BY priority DESC, created_at DESC';
      const res = await getPostgresPool()!.query(query);
      return res.rows.map(row => ({
        ...row,
        target_channel_ids: Array.isArray(row.target_channel_ids) ? row.target_channel_ids : (typeof row.target_channel_ids === 'string' ? JSON.parse(row.target_channel_ids) : []),
        target_category_ids: Array.isArray(row.target_category_ids) ? row.target_category_ids : (typeof row.target_category_ids === 'string' ? JSON.parse(row.target_category_ids) : []),
        exempt_plan_ids: Array.isArray(row.exempt_plan_ids) ? row.exempt_plan_ids : (typeof row.exempt_plan_ids === 'string' ? JSON.parse(row.exempt_plan_ids) : [])
      }));
    } catch (err: any) {
      console.warn('[Preroll] Failed to fetch from PostgreSQL, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  const campaigns = db.preroll_campaigns || [];
  const list = onlyActive ? campaigns.filter(c => c.is_active) : campaigns;
  return [...list].sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

export async function getPrerollCampaignById(id: string): Promise<DbPrerollCampaign | null> {
  if (isPostgresActive()) {
    try {
      const res = await getPostgresPool()!.query('SELECT * FROM preroll_campaigns WHERE id = $1 LIMIT 1', [id]);
      if (res.rows[0]) {
        const row = res.rows[0];
        return {
          ...row,
          target_channel_ids: Array.isArray(row.target_channel_ids) ? row.target_channel_ids : (typeof row.target_channel_ids === 'string' ? JSON.parse(row.target_channel_ids) : []),
          target_category_ids: Array.isArray(row.target_category_ids) ? row.target_category_ids : (typeof row.target_category_ids === 'string' ? JSON.parse(row.target_category_ids) : []),
          exempt_plan_ids: Array.isArray(row.exempt_plan_ids) ? row.exempt_plan_ids : (typeof row.exempt_plan_ids === 'string' ? JSON.parse(row.exempt_plan_ids) : [])
        };
      }
      return null;
    } catch (err: any) {
      console.warn('[Preroll] Failed to fetch campaign by id from PostgreSQL:', err.message);
    }
  }

  const db = loadDatabase();
  return (db.preroll_campaigns || []).find(c => c.id === id) || null;
}

export async function createPrerollCampaign(data: Partial<DbPrerollCampaign>): Promise<DbPrerollCampaign> {
  const id = data.id || `camp_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const campaign: DbPrerollCampaign = {
    id,
    sponsor_name: data.sponsor_name?.trim() || 'Patrocinador Oficial',
    title: data.title?.trim() || 'Campanha de Vídeo Pré-roll',
    video_url: data.video_url || '',
    target_url: data.target_url?.trim() || null,
    target_type: data.target_type || 'all',
    target_channel_ids: data.target_channel_ids || [],
    target_category_ids: data.target_category_ids || [],
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    is_continuous: data.is_continuous ?? true,
    priority: data.priority ?? 5,
    frequency_cap_minutes: data.frequency_cap_minutes ?? 15,
    skip_enabled: data.skip_enabled ?? true,
    skip_offset_seconds: data.skip_offset_seconds ?? 5,
    exempt_plan_ids: data.exempt_plan_ids || [],
    is_active: data.is_active ?? true,
    is_demo: data.is_demo ?? false,
    impressions_count: 0,
    completions_count: 0,
    skips_count: 0,
    clicks_count: 0,
    created_at: now,
    updated_at: now
  };

  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const res = await pool.query(
        `INSERT INTO preroll_campaigns (
          id, sponsor_name, title, video_url, target_url, target_type,
          target_channel_ids, target_category_ids, start_date, end_date,
          is_continuous, priority, frequency_cap_minutes, skip_enabled,
          skip_offset_seconds, exempt_plan_ids, is_active, is_demo,
          impressions_count, completions_count, skips_count, clicks_count,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17, $18,
          0, 0, 0, 0,
          $19, $20
        ) RETURNING *`,
        [
          campaign.id,
          campaign.sponsor_name,
          campaign.title,
          campaign.video_url,
          campaign.target_url,
          campaign.target_type,
          JSON.stringify(campaign.target_channel_ids),
          JSON.stringify(campaign.target_category_ids),
          campaign.start_date,
          campaign.end_date,
          campaign.is_continuous,
          campaign.priority,
          campaign.frequency_cap_minutes,
          campaign.skip_enabled,
          campaign.skip_offset_seconds,
          JSON.stringify(campaign.exempt_plan_ids),
          campaign.is_active,
          campaign.is_demo,
          campaign.created_at,
          campaign.updated_at
        ]
      );
      if (res.rows[0]) return campaign;
    } catch (err: any) {
      console.warn('[Preroll] Failed to insert campaign into PostgreSQL:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.preroll_campaigns) db.preroll_campaigns = [];
  db.preroll_campaigns.unshift(campaign);
  saveDatabase(db);
  return campaign;
}

export async function updatePrerollCampaign(id: string, updates: Partial<DbPrerollCampaign>): Promise<DbPrerollCampaign | null> {
  const now = new Date().toISOString();

  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, val] of Object.entries(updates)) {
        if (key === 'id' || key === 'created_at') continue;
        if (key === 'target_channel_ids' || key === 'target_category_ids' || key === 'exempt_plan_ids') {
          fields.push(`${key} = $${idx}`);
          values.push(JSON.stringify(val));
        } else {
          fields.push(`${key} = $${idx}`);
          values.push(val);
        }
        idx++;
      }

      fields.push(`updated_at = $${idx}`);
      values.push(now);
      idx++;

      values.push(id);
      const query = `UPDATE preroll_campaigns SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
      const res = await pool.query(query, values);
      if (res.rows[0]) {
        const row = res.rows[0];
        return {
          ...row,
          target_channel_ids: Array.isArray(row.target_channel_ids) ? row.target_channel_ids : (typeof row.target_channel_ids === 'string' ? JSON.parse(row.target_channel_ids) : []),
          target_category_ids: Array.isArray(row.target_category_ids) ? row.target_category_ids : (typeof row.target_category_ids === 'string' ? JSON.parse(row.target_category_ids) : []),
          exempt_plan_ids: Array.isArray(row.exempt_plan_ids) ? row.exempt_plan_ids : (typeof row.exempt_plan_ids === 'string' ? JSON.parse(row.exempt_plan_ids) : [])
        };
      }
    } catch (err: any) {
      console.warn('[Preroll] Failed to update in PostgreSQL:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.preroll_campaigns) return null;
  const index = db.preroll_campaigns.findIndex(c => c.id === id);
  if (index === -1) return null;

  db.preroll_campaigns[index] = {
    ...db.preroll_campaigns[index],
    ...updates,
    updated_at: now
  };
  saveDatabase(db);
  return db.preroll_campaigns[index];
}

export async function deletePrerollCampaign(id: string): Promise<boolean> {
  if (isPostgresActive()) {
    try {
      await getPostgresPool()!.query('DELETE FROM preroll_campaigns WHERE id = $1', [id]);
      return true;
    } catch (err: any) {
      console.warn('[Preroll] Failed to delete campaign in PostgreSQL:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.preroll_campaigns) return false;
  const initialCount = db.preroll_campaigns.length;
  db.preroll_campaigns = db.preroll_campaigns.filter(c => c.id !== id);
  saveDatabase(db);
  return db.preroll_campaigns.length < initialCount;
}

export async function resetPrerollStats(campaignId: string): Promise<boolean> {
  if (isPostgresActive()) {
    try {
      await getPostgresPool()!.query(
        `UPDATE preroll_campaigns
         SET impressions_count = 0, completions_count = 0, skips_count = 0, clicks_count = 0, updated_at = NOW()
         WHERE id = $1`,
        [campaignId]
      );
      await getPostgresPool()!.query('DELETE FROM preroll_events WHERE campaign_id = $1', [campaignId]);
      return true;
    } catch (err: any) {
      console.warn('[Preroll] Failed to reset stats in PostgreSQL:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.preroll_campaigns) return false;
  const c = db.preroll_campaigns.find(item => item.id === campaignId);
  if (!c) return false;
  c.impressions_count = 0;
  c.completions_count = 0;
  c.skips_count = 0;
  c.clicks_count = 0;
  c.updated_at = new Date().toISOString();
  if (db.preroll_events) {
    db.preroll_events = db.preroll_events.filter(e => e.campaign_id !== campaignId);
  }
  saveDatabase(db);
  return true;
}

export async function recordPrerollEvent(event: {
  campaign_id: string;
  event_type: 'impression' | 'completion' | 'skip' | 'click';
  channel_id?: string | null;
  subscriber_id?: string | null;
  visitor_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}): Promise<void> {
  const id = `pevt_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      // 1. Insert event
      await pool.query(
        `INSERT INTO preroll_events (id, campaign_id, event_type, channel_id, subscriber_id, visitor_id, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          event.campaign_id,
          event.event_type,
          event.channel_id || null,
          event.subscriber_id || null,
          event.visitor_id || null,
          event.ip_address || null,
          event.user_agent || null,
          now
        ]
      );

      // 2. Increment corresponding counter
      let col = 'impressions_count';
      if (event.event_type === 'completion') col = 'completions_count';
      else if (event.event_type === 'skip') col = 'skips_count';
      else if (event.event_type === 'click') col = 'clicks_count';

      await pool.query(
        `UPDATE preroll_campaigns SET ${col} = ${col} + 1, updated_at = NOW() WHERE id = $1`,
        [event.campaign_id]
      );
      return;
    } catch (err: any) {
      console.warn('[Preroll] Failed to record event in PostgreSQL:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.preroll_events) db.preroll_events = [];
  db.preroll_events.push({
    id,
    campaign_id: event.campaign_id,
    event_type: event.event_type,
    channel_id: event.channel_id || null,
    subscriber_id: event.subscriber_id || null,
    visitor_id: event.visitor_id || null,
    ip_address: event.ip_address || null,
    user_agent: event.user_agent || null,
    created_at: now
  });

  if (db.preroll_campaigns) {
    const c = db.preroll_campaigns.find(item => item.id === event.campaign_id);
    if (c) {
      if (event.event_type === 'impression') c.impressions_count = (c.impressions_count || 0) + 1;
      else if (event.event_type === 'completion') c.completions_count = (c.completions_count || 0) + 1;
      else if (event.event_type === 'skip') c.skips_count = (c.skips_count || 0) + 1;
      else if (event.event_type === 'click') c.clicks_count = (c.clicks_count || 0) + 1;
      c.updated_at = now;
    }
  }
  saveDatabase(db);
}

export async function getEligiblePrerollCampaign(params: {
  channelId: string;
  userEmail?: string | null;
  visitorId?: string | null;
}): Promise<DbPrerollCampaign | null> {
  const { channelId, userEmail, visitorId } = params;

  // 1. Fetch channel info to check category targeting
  const channel = await getChannelById(channelId);
  if (!channel) return null;

  // 2. Fetch subscriber info if user logged in
  let subscriber: DbSubscriber | null = null;
  if (userEmail) {
    const subs = await getSubscribers();
    subscriber = subs.find(s => s.email.toLowerCase() === userEmail.toLowerCase().trim()) || null;
  }

  // 3. Fetch active campaigns
  const campaigns = await getPrerollCampaigns(true);
  if (campaigns.length === 0) return null;

  const nowTime = Date.now();
  const db = loadDatabase();
  const recentEvents = db.preroll_events || [];

  const eligibleList = campaigns.filter(campaign => {
    // A. Verify video URL exists
    if (!campaign.video_url || !campaign.video_url.trim()) return false;

    // B. Check date validity if not continuous
    if (!campaign.is_continuous) {
      if (campaign.start_date && new Date(campaign.start_date).getTime() > nowTime) return false;
      if (campaign.end_date && new Date(campaign.end_date).getTime() < nowTime) return false;
    }

    // C. Check plan exemption
    // If the subscriber has an active plan that is marked as exempt from ads, don't show this ad
    if (subscriber && subscriber.status === 'active' && subscriber.plan_id) {
      const exemptPlans = campaign.exempt_plan_ids || [];
      if (exemptPlans.includes(subscriber.plan_id)) {
        return false;
      }
    }

    // D. Check channel / category targeting
    if (campaign.target_type === 'channels') {
      const channelIds = campaign.target_channel_ids || [];
      if (!channelIds.includes(channelId)) return false;
    } else if (campaign.target_type === 'categories') {
      const categoryIds = campaign.target_category_ids || [];
      if (!categoryIds.includes(channel.category_id)) return false;
    }

    // E. Check frequency capping
    if (campaign.frequency_cap_minutes > 0 && (visitorId || subscriber?.id)) {
      const cutoffTime = nowTime - campaign.frequency_cap_minutes * 60 * 1000;
      const recentImpression = recentEvents.find(e =>
        e.campaign_id === campaign.id &&
        e.event_type === 'impression' &&
        ((visitorId && e.visitor_id === visitorId) || (subscriber && e.subscriber_id === subscriber.id)) &&
        new Date(e.created_at).getTime() >= cutoffTime
      );
      if (recentImpression) {
        return false;
      }
    }

    return true;
  });

  if (eligibleList.length === 0) return null;

  // 4. Return top priority campaign (if tied, randomized or first)
  eligibleList.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return eligibleList[0];
}

// ==========================================
// 20. BANNER IN-PLAY NO PLAYER DE VÍDEO
// ==========================================

export async function getInPlaySettings(): Promise<DbInPlaySettings> {
  if (isPostgresActive()) {
    try {
      const res = await getPostgresPool()!.query('SELECT * FROM inplay_settings WHERE id = $1 LIMIT 1', ['primary']);
      if (res.rows[0]) {
        const row = res.rows[0];
        return {
          id: row.id,
          is_enabled: Boolean(row.is_enabled),
          ad_format: row.ad_format || 'custom_banner',
          ad_script_code: row.ad_script_code || '',
          banner_image_url: row.banner_image_url || null,
          banner_target_url: row.banner_target_url || null,
          banner_title: row.banner_title || null,
          position: row.position || 'bottom_center',
          delay_seconds: Number(row.delay_seconds) || 10,
          interval_minutes: Number(row.interval_minutes) || 5,
          duration_seconds: Number(row.duration_seconds) || 25,
          fade_out_seconds: Number(row.fade_out_seconds) || 1.0,
          close_button_enabled: row.close_button_enabled !== false,
          target_type: row.target_type || 'all',
          target_channel_ids: Array.isArray(row.target_channel_ids) ? row.target_channel_ids : (typeof row.target_channel_ids === 'string' ? JSON.parse(row.target_channel_ids) : []),
          target_category_ids: Array.isArray(row.target_category_ids) ? row.target_category_ids : (typeof row.target_category_ids === 'string' ? JSON.parse(row.target_category_ids) : []),
          exempt_plan_ids: Array.isArray(row.exempt_plan_ids) ? row.exempt_plan_ids : (typeof row.exempt_plan_ids === 'string' ? JSON.parse(row.exempt_plan_ids) : []),
          updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
        };
      }
    } catch (err: any) {
      console.warn('[InPlay] Failed to query PostgreSQL inplay_settings, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  return db.inplay_settings || {
    id: 'primary',
    is_enabled: true,
    ad_format: 'custom_banner',
    ad_script_code: '',
    banner_image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=728&h=90&q=80',
    banner_target_url: 'https://virtarix.com.br',
    banner_title: 'VPS Virtarix Cloud — Servidores Dedicados no Brasil',
    position: 'bottom_center',
    delay_seconds: 10,
    interval_minutes: 5,
    duration_seconds: 25,
    fade_out_seconds: 1.0,
    close_button_enabled: true,
    target_type: 'all',
    target_channel_ids: [],
    target_category_ids: [],
    exempt_plan_ids: ['plan_anual', 'plan_semestral'],
    updated_at: new Date().toISOString()
  };
}

export async function updateInPlaySettings(data: Partial<DbInPlaySettings>): Promise<DbInPlaySettings> {
  const current = await getInPlaySettings();
  const now = new Date().toISOString();

  const updated: DbInPlaySettings = {
    id: 'primary',
    is_enabled: data.is_enabled !== undefined ? Boolean(data.is_enabled) : current.is_enabled,
    ad_format: data.ad_format || current.ad_format || 'custom_banner',
    ad_script_code: data.ad_script_code !== undefined ? data.ad_script_code : current.ad_script_code,
    banner_image_url: data.banner_image_url !== undefined ? data.banner_image_url : current.banner_image_url,
    banner_target_url: data.banner_target_url !== undefined ? data.banner_target_url : current.banner_target_url,
    banner_title: data.banner_title !== undefined ? data.banner_title : current.banner_title,
    position: data.position || current.position || 'bottom_center',
    delay_seconds: data.delay_seconds !== undefined ? Math.max(3, Number(data.delay_seconds)) : current.delay_seconds,
    interval_minutes: data.interval_minutes !== undefined ? Math.max(0, Number(data.interval_minutes)) : current.interval_minutes,
    duration_seconds: data.duration_seconds !== undefined ? Math.max(5, Number(data.duration_seconds)) : current.duration_seconds,
    fade_out_seconds: data.fade_out_seconds !== undefined ? Math.max(0.2, Number(data.fade_out_seconds)) : current.fade_out_seconds,
    close_button_enabled: data.close_button_enabled !== undefined ? Boolean(data.close_button_enabled) : current.close_button_enabled,
    target_type: data.target_type || current.target_type || 'all',
    target_channel_ids: Array.isArray(data.target_channel_ids) ? data.target_channel_ids : current.target_channel_ids,
    target_category_ids: Array.isArray(data.target_category_ids) ? data.target_category_ids : current.target_category_ids,
    exempt_plan_ids: Array.isArray(data.exempt_plan_ids) ? data.exempt_plan_ids : current.exempt_plan_ids,
    updated_at: now
  };

  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      await pool.query(
        `INSERT INTO inplay_settings (
          id, is_enabled, ad_format, ad_script_code, banner_image_url, banner_target_url,
          banner_title, position, delay_seconds, interval_minutes, duration_seconds,
          fade_out_seconds, close_button_enabled, target_type, target_channel_ids,
          target_category_ids, exempt_plan_ids, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) ON CONFLICT (id) DO UPDATE SET
          is_enabled = EXCLUDED.is_enabled,
          ad_format = EXCLUDED.ad_format,
          ad_script_code = EXCLUDED.ad_script_code,
          banner_image_url = EXCLUDED.banner_image_url,
          banner_target_url = EXCLUDED.banner_target_url,
          banner_title = EXCLUDED.banner_title,
          position = EXCLUDED.position,
          delay_seconds = EXCLUDED.delay_seconds,
          interval_minutes = EXCLUDED.interval_minutes,
          duration_seconds = EXCLUDED.duration_seconds,
          fade_out_seconds = EXCLUDED.fade_out_seconds,
          close_button_enabled = EXCLUDED.close_button_enabled,
          target_type = EXCLUDED.target_type,
          target_channel_ids = EXCLUDED.target_channel_ids,
          target_category_ids = EXCLUDED.target_category_ids,
          exempt_plan_ids = EXCLUDED.exempt_plan_ids,
          updated_at = NOW()`,
        [
          updated.id,
          updated.is_enabled,
          updated.ad_format,
          updated.ad_script_code,
          updated.banner_image_url,
          updated.banner_target_url,
          updated.banner_title,
          updated.position,
          updated.delay_seconds,
          updated.interval_minutes,
          updated.duration_seconds,
          updated.fade_out_seconds,
          updated.close_button_enabled,
          updated.target_type,
          JSON.stringify(updated.target_channel_ids),
          JSON.stringify(updated.target_category_ids),
          JSON.stringify(updated.exempt_plan_ids),
          now
        ]
      );
    } catch (err: any) {
      console.warn('[InPlay] Failed to update PostgreSQL inplay_settings, saving to storage:', err.message);
    }
  }

  const db = loadDatabase();
  db.inplay_settings = updated;
  saveDatabase(db);
  return updated;
}

export async function getEligibleInPlayBanner(params: {
  channelId: string;
  userEmail?: string | null;
}): Promise<{ eligible: boolean; reason?: string; config?: any }> {
  const { channelId, userEmail } = params;

  // 1. Fetch channel info
  const channel = await getChannelById(channelId);
  if (!channel) {
    return { eligible: false, reason: 'channel_not_found' };
  }

  // 2. Fetch inplay settings
  const settings = await getInPlaySettings();
  if (!settings.is_enabled) {
    return { eligible: false, reason: 'inplay_disabled' };
  }

  // 3. Check subscriber plan exemption if user logged in
  if (userEmail) {
    const subs = await getSubscribers();
    const subscriber = subs.find(s => s.email.toLowerCase() === userEmail.toLowerCase().trim());
    if (subscriber) {
      const isExpired = subscriber.expires_at ? new Date(subscriber.expires_at).getTime() < Date.now() : false;
      const isActive = subscriber.status === 'active' && !isExpired;
      if (isActive && subscriber.plan_id) {
        const exemptPlans = settings.exempt_plan_ids || [];
        if (exemptPlans.includes(subscriber.plan_id)) {
          return { eligible: false, reason: 'subscriber_plan_exempt' };
        }
      }
    }
  }

  // 4. Check channel / category segmentation
  if (settings.target_type === 'channels') {
    const channelIds = settings.target_channel_ids || [];
    if (!channelIds.includes(channelId)) {
      return { eligible: false, reason: 'channel_not_targeted' };
    }
  } else if (settings.target_type === 'categories') {
    const categoryIds = settings.target_category_ids || [];
    if (!categoryIds.includes(channel.category_id)) {
      return { eligible: false, reason: 'category_not_targeted' };
    }
  }

  // 5. Eligible! Return clean, sanitized config for the player
  return {
    eligible: true,
    config: {
      adFormat: settings.ad_format,
      adScriptCode: settings.ad_script_code,
      bannerImageUrl: settings.banner_image_url,
      bannerTargetUrl: settings.banner_target_url,
      bannerTitle: settings.banner_title,
      position: settings.position,
      delaySeconds: settings.delay_seconds,
      intervalMinutes: settings.interval_minutes,
      durationSeconds: settings.duration_seconds,
      fadeOutSeconds: settings.fade_out_seconds,
      closeButtonEnabled: settings.close_button_enabled
    }
  };
}

// ==========================================
// 22. AUTHORIZED IFRAME DOMAINS (POSTGRESQL & LOCAL STORAGE)
// ==========================================

export async function getAuthorizedIframeDomains(): Promise<DbAuthorizedIframeDomain[]> {
  if (isPostgresActive()) {
    try {
      const res = await getPostgresPool()!.query(
        'SELECT id, domain, is_active, added_by, created_at, updated_at FROM authorized_iframe_domains ORDER BY domain ASC'
      );
      return res.rows.map(row => ({
        id: row.id,
        domain: row.domain,
        is_active: Boolean(row.is_active),
        added_by: row.added_by,
        created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
      }));
    } catch (err: any) {
      console.warn('[Iframe Domains] Failed to read from PostgreSQL, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  const list = db.authorized_iframe_domains || [];
  return [...list].sort((a, b) => a.domain.localeCompare(b.domain));
}

export async function getActiveIframeDomains(): Promise<string[]> {
  if (isPostgresActive()) {
    try {
      const res = await getPostgresPool()!.query(
        'SELECT domain FROM authorized_iframe_domains WHERE is_active = true ORDER BY domain ASC'
      );
      if (res.rows.length > 0) {
        return res.rows.map(r => r.domain.toLowerCase().trim());
      }
    } catch (err: any) {
      console.warn('[Iframe Domains] Failed to get active domains from PostgreSQL, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  const list = db.authorized_iframe_domains || [];
  const active = list.filter(d => d.is_active).map(d => d.domain.toLowerCase().trim());
  return active;
}

export async function addAuthorizedIframeDomain(domain: string, addedBy?: string | null): Promise<DbAuthorizedIframeDomain> {
  const cleanDomain = domain.toLowerCase().trim();
  const id = `dom_${cleanDomain.replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const newDomain: DbAuthorizedIframeDomain = {
    id,
    domain: cleanDomain,
    is_active: true,
    added_by: addedBy || 'admin',
    created_at: now,
    updated_at: now
  };

  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      // Check if domain exists
      const existing = await pool.query('SELECT * FROM authorized_iframe_domains WHERE LOWER(domain) = $1 LIMIT 1', [cleanDomain]);
      if (existing.rows.length > 0) {
        // If inactive, re-activate it
        const row = existing.rows[0];
        if (!row.is_active) {
          const updated = await pool.query(
            'UPDATE authorized_iframe_domains SET is_active = true, updated_at = NOW() WHERE id = $1 RETURNING *',
            [row.id]
          );
          return {
            id: updated.rows[0].id,
            domain: updated.rows[0].domain,
            is_active: true,
            added_by: updated.rows[0].added_by,
            created_at: new Date(updated.rows[0].created_at).toISOString(),
            updated_at: new Date(updated.rows[0].updated_at).toISOString()
          };
        }
        return {
          id: row.id,
          domain: row.domain,
          is_active: Boolean(row.is_active),
          added_by: row.added_by,
          created_at: new Date(row.created_at).toISOString(),
          updated_at: new Date(row.updated_at).toISOString()
        };
      }

      const res = await pool.query(
        `INSERT INTO authorized_iframe_domains (id, domain, is_active, added_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [newDomain.id, newDomain.domain, newDomain.is_active, newDomain.added_by, now, now]
      );
      const row = res.rows[0];
      return {
        id: row.id,
        domain: row.domain,
        is_active: Boolean(row.is_active),
        added_by: row.added_by,
        created_at: new Date(row.created_at).toISOString(),
        updated_at: new Date(row.updated_at).toISOString()
      };
    } catch (err: any) {
      console.warn('[Iframe Domains] Failed to insert in PostgreSQL, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.authorized_iframe_domains) db.authorized_iframe_domains = [];

  const existingIdx = db.authorized_iframe_domains.findIndex(d => d.domain.toLowerCase() === cleanDomain);
  if (existingIdx >= 0) {
    db.authorized_iframe_domains[existingIdx].is_active = true;
    db.authorized_iframe_domains[existingIdx].updated_at = now;
    saveDatabase(db);
    return db.authorized_iframe_domains[existingIdx];
  }

  db.authorized_iframe_domains.push(newDomain);
  saveDatabase(db);
  return newDomain;
}

export async function toggleAuthorizedIframeDomain(id: string): Promise<DbAuthorizedIframeDomain | null> {
  const now = new Date().toISOString();

  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const res = await pool.query(
        'UPDATE authorized_iframe_domains SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          domain: row.domain,
          is_active: Boolean(row.is_active),
          added_by: row.added_by,
          created_at: new Date(row.created_at).toISOString(),
          updated_at: new Date(row.updated_at).toISOString()
        };
      }
      return null;
    } catch (err: any) {
      console.warn('[Iframe Domains] Failed to toggle in PostgreSQL, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.authorized_iframe_domains) return null;
  const item = db.authorized_iframe_domains.find(d => d.id === id);
  if (!item) return null;
  item.is_active = !item.is_active;
  item.updated_at = now;
  saveDatabase(db);
  return item;
}

export async function deleteAuthorizedIframeDomain(id: string): Promise<boolean> {
  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const res = await pool.query('DELETE FROM authorized_iframe_domains WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    } catch (err: any) {
      console.warn('[Iframe Domains] Failed to delete in PostgreSQL, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.authorized_iframe_domains) return false;
  const initialLength = db.authorized_iframe_domains.length;
  db.authorized_iframe_domains = db.authorized_iframe_domains.filter(d => d.id !== id);
  saveDatabase(db);
  return db.authorized_iframe_domains.length < initialLength;
}

// ==========================================
// 19. FOOTBALL TEAMS (AGENDA ESPORTIVA)
// ==========================================
export async function getFootballTeams(): Promise<DbFootballTeam[]> {
  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const res = await pool.query('SELECT * FROM football_teams ORDER BY name ASC');
      return res.rows.map(r => ({
        id: r.id,
        name: r.name,
        short_name: r.short_name,
        logo_url: r.logo_url,
        country: r.country,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString()
      }));
    } catch (err: any) {
      console.warn('[Football Teams] PostgreSQL read error, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  return (db.football_teams || []).slice().sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFootballTeamById(id: string): Promise<DbFootballTeam | null> {
  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const res = await pool.query('SELECT * FROM football_teams WHERE id = $1 LIMIT 1', [id]);
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          name: r.name,
          short_name: r.short_name,
          logo_url: r.logo_url,
          country: r.country,
          created_at: new Date(r.created_at).toISOString(),
          updated_at: new Date(r.updated_at).toISOString()
        };
      }
      return null;
    } catch (err: any) {
      console.warn('[Football Teams] PostgreSQL read error, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  return (db.football_teams || []).find(t => t.id === id) || null;
}

export async function createFootballTeam(team: Omit<DbFootballTeam, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<DbFootballTeam> {
  const now = new Date().toISOString();
  const id = team.id || `team_${crypto.randomUUID().slice(0, 8)}`;
  const newTeam: DbFootballTeam = {
    id,
    name: team.name.trim(),
    short_name: team.short_name?.trim() || null,
    logo_url: team.logo_url.trim(),
    country: team.country?.trim() || 'Brasil',
    created_at: now,
    updated_at: now
  };

  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const res = await pool.query(
        `INSERT INTO football_teams (id, name, short_name, logo_url, country, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [newTeam.id, newTeam.name, newTeam.short_name, newTeam.logo_url, newTeam.country, now, now]
      );
      const r = res.rows[0];
      return {
        id: r.id,
        name: r.name,
        short_name: r.short_name,
        logo_url: r.logo_url,
        country: r.country,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString()
      };
    } catch (err: any) {
      console.warn('[Football Teams] PostgreSQL insert error, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.football_teams) db.football_teams = [];
  db.football_teams.push(newTeam);
  saveDatabase(db);
  return newTeam;
}

export async function updateFootballTeam(id: string, updates: Partial<DbFootballTeam>): Promise<DbFootballTeam | null> {
  const now = new Date().toISOString();

  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, val] of Object.entries(updates)) {
        if (key === 'id' || key === 'created_at') continue;
        fields.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
      fields.push(`updated_at = $${idx}`);
      values.push(now);

      const query = `UPDATE football_teams SET ${fields.join(', ')} WHERE id = $${idx + 1} RETURNING *`;
      values.push(id);

      const res = await pool.query(query, values);
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          name: r.name,
          short_name: r.short_name,
          logo_url: r.logo_url,
          country: r.country,
          created_at: new Date(r.created_at).toISOString(),
          updated_at: new Date(r.updated_at).toISOString()
        };
      }
      return null;
    } catch (err: any) {
      console.warn('[Football Teams] PostgreSQL update error, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.football_teams) return null;
  const index = db.football_teams.findIndex(t => t.id === id);
  if (index === -1) return null;

  db.football_teams[index] = { ...db.football_teams[index], ...updates, updated_at: now };
  saveDatabase(db);
  return db.football_teams[index];
}

export async function deleteFootballTeam(id: string): Promise<boolean> {
  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const res = await pool.query('DELETE FROM football_teams WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    } catch (err: any) {
      console.warn('[Football Teams] PostgreSQL delete error, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.football_teams) return false;
  const initialLength = db.football_teams.length;
  db.football_teams = db.football_teams.filter(t => t.id !== id);
  saveDatabase(db);
  return db.football_teams.length < initialLength;
}

// ==========================================
// 20. FOOTBALL MATCHES (AGENDA ESPORTIVA)
// ==========================================
function mapMatchRow(r: any): DbFootballMatch {
  let channels = [];
  if (r.channel_ids) {
    channels = typeof r.channel_ids === 'string' ? JSON.parse(r.channel_ids) : r.channel_ids;
  } else if (r.channels) {
    channels = typeof r.channels === 'string' ? JSON.parse(r.channels) : r.channels;
  }

  return {
    id: r.id,
    competition: r.competition,
    competition_country: r.competition_country,
    round: r.round,
    home_team_id: r.home_team_id,
    home_team_name: r.home_team_name,
    home_team_logo: r.home_team_logo,
    away_team_id: r.away_team_id,
    away_team_name: r.away_team_name,
    away_team_logo: r.away_team_logo,
    match_date: typeof r.match_date === 'string' ? r.match_date.slice(0, 10) : new Date(r.match_date).toISOString().slice(0, 10),
    match_time: r.match_time,
    timezone: r.timezone || 'America/Sao_Paulo',
    description: r.description,
    channels: Array.isArray(channels) ? channels : [],
    primary_channel_id: r.primary_channel_id,
    status: r.status,
    score_home: r.score_home !== null && r.score_home !== undefined ? parseInt(r.score_home, 10) : null,
    score_away: r.score_away !== null && r.score_away !== undefined ? parseInt(r.score_away, 10) : null,
    minute: r.minute,
    is_active: Boolean(r.is_active),
    is_featured: Boolean(r.is_featured),
    display_order: parseInt(r.display_order || '1', 10),
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString()
  };
}

export async function getFootballMatches(includeInactive = false): Promise<DbFootballMatch[]> {
  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const query = includeInactive
        ? 'SELECT * FROM football_matches ORDER BY display_order ASC, match_date ASC, match_time ASC'
        : 'SELECT * FROM football_matches WHERE is_active = true ORDER BY display_order ASC, match_date ASC, match_time ASC';
      const res = await pool.query(query);
      return res.rows.map(mapMatchRow);
    } catch (err: any) {
      console.warn('[Football Matches] PostgreSQL read error, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  const list = db.football_matches || [];
  return (includeInactive ? list : list.filter(m => m.is_active))
    .slice()
    .sort((a, b) => {
      if (a.display_order !== b.display_order) return a.display_order - b.display_order;
      if (a.match_date !== b.match_date) return a.match_date.localeCompare(b.match_date);
      return a.match_time.localeCompare(b.match_time);
    });
}

export async function getFootballMatchById(id: string): Promise<DbFootballMatch | null> {
  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const res = await pool.query('SELECT * FROM football_matches WHERE id = $1 LIMIT 1', [id]);
      if (res.rows.length > 0) {
        return mapMatchRow(res.rows[0]);
      }
      return null;
    } catch (err: any) {
      console.warn('[Football Matches] PostgreSQL read error, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  return (db.football_matches || []).find(m => m.id === id) || null;
}

export async function createFootballMatch(match: Omit<DbFootballMatch, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<DbFootballMatch> {
  const now = new Date().toISOString();
  const id = match.id || `match_${crypto.randomUUID().slice(0, 10)}`;

  const newMatch: DbFootballMatch = {
    ...match,
    id,
    created_at: now,
    updated_at: now
  };

  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const res = await pool.query(
        `INSERT INTO football_matches (
           id, competition, competition_country, round,
           home_team_id, home_team_name, home_team_logo,
           away_team_id, away_team_name, away_team_logo,
           match_date, match_time, timezone, description,
           channel_ids, primary_channel_id, status,
           score_home, score_away, minute,
           is_active, is_featured, display_order, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4,
           $5, $6, $7,
           $8, $9, $10,
           $11, $12, $13, $14,
           $15, $16, $17,
           $18, $19, $20,
           $21, $22, $23, $24, $25
         ) RETURNING *`,
        [
          newMatch.id, newMatch.competition, newMatch.competition_country, newMatch.round,
          newMatch.home_team_id, newMatch.home_team_name, newMatch.home_team_logo,
          newMatch.away_team_id, newMatch.away_team_name, newMatch.away_team_logo,
          newMatch.match_date, newMatch.match_time, newMatch.timezone, newMatch.description,
          JSON.stringify(newMatch.channels), newMatch.primary_channel_id, newMatch.status,
          newMatch.score_home, newMatch.score_away, newMatch.minute,
          newMatch.is_active, newMatch.is_featured, newMatch.display_order, now, now
        ]
      );
      return mapMatchRow(res.rows[0]);
    } catch (err: any) {
      console.warn('[Football Matches] PostgreSQL insert error, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.football_matches) db.football_matches = [];
  db.football_matches.push(newMatch);
  saveDatabase(db);
  return newMatch;
}

export async function updateFootballMatch(id: string, updates: Partial<DbFootballMatch>): Promise<DbFootballMatch | null> {
  const now = new Date().toISOString();

  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, val] of Object.entries(updates)) {
        if (key === 'id' || key === 'created_at') continue;
        if (key === 'channels') {
          fields.push(`channel_ids = $${idx}`);
          values.push(JSON.stringify(val));
        } else {
          fields.push(`${key} = $${idx}`);
          values.push(val);
        }
        idx++;
      }
      fields.push(`updated_at = $${idx}`);
      values.push(now);

      const query = `UPDATE football_matches SET ${fields.join(', ')} WHERE id = $${idx + 1} RETURNING *`;
      values.push(id);

      const res = await pool.query(query, values);
      if (res.rows.length > 0) {
        return mapMatchRow(res.rows[0]);
      }
      return null;
    } catch (err: any) {
      console.warn('[Football Matches] PostgreSQL update error, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.football_matches) return null;
  const index = db.football_matches.findIndex(m => m.id === id);
  if (index === -1) return null;

  db.football_matches[index] = { ...db.football_matches[index], ...updates, updated_at: now };
  saveDatabase(db);
  return db.football_matches[index];
}

export async function deleteFootballMatch(id: string): Promise<boolean> {
  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const res = await pool.query('DELETE FROM football_matches WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    } catch (err: any) {
      console.warn('[Football Matches] PostgreSQL delete error, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  if (!db.football_matches) return false;
  const initialLength = db.football_matches.length;
  db.football_matches = db.football_matches.filter(m => m.id !== id);
  saveDatabase(db);
  return db.football_matches.length < initialLength;
}

export async function duplicateFootballMatch(id: string): Promise<DbFootballMatch | null> {
  const original = await getFootballMatchById(id);
  if (!original) return null;

  const newId = `match_${crypto.randomUUID().slice(0, 10)}`;
  const duplicated: Omit<DbFootballMatch, 'id' | 'created_at' | 'updated_at'> = {
    ...original,
    competition: `${original.competition} (Cópia)`,
    display_order: original.display_order + 1,
    is_active: false
  };

  return createFootballMatch({ ...duplicated, id: newId });
}

export async function toggleFootballMatchActive(id: string): Promise<DbFootballMatch | null> {
  const match = await getFootballMatchById(id);
  if (!match) return null;
  return updateFootballMatch(id, { is_active: !match.is_active });
}

// ==========================================
// 21. FOOTBALL AGENDA SETTINGS
// ==========================================
export async function getFootballAgendaSettings(): Promise<DbFootballAgendaSettings> {
  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const res = await pool.query('SELECT * FROM football_agenda_settings WHERE id = $1 LIMIT 1', ['primary']);
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          is_enabled: Boolean(r.is_enabled),
          days_to_display: parseInt(r.days_to_display, 10),
          hide_finished_after_hours: parseInt(r.hide_finished_after_hours, 10),
          default_view_mode: r.default_view_mode,
          updated_at: new Date(r.updated_at).toISOString()
        };
      }
    } catch (err: any) {
      console.warn('[Football Settings] PostgreSQL read error, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  return db.football_agenda_settings || {
    id: 'primary',
    is_enabled: true,
    days_to_display: 7,
    hide_finished_after_hours: 3,
    default_view_mode: 'live_first',
    updated_at: new Date().toISOString()
  };
}

export async function updateFootballAgendaSettings(updates: Partial<DbFootballAgendaSettings>): Promise<DbFootballAgendaSettings> {
  const now = new Date().toISOString();

  if (isPostgresActive()) {
    try {
      const pool = getPostgresPool()!;
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, val] of Object.entries(updates)) {
        if (key === 'id') continue;
        fields.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
      fields.push(`updated_at = $${idx}`);
      values.push(now);

      const query = `UPDATE football_agenda_settings SET ${fields.join(', ')} WHERE id = 'primary' RETURNING *`;
      const res = await pool.query(query, values);
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          is_enabled: Boolean(r.is_enabled),
          days_to_display: parseInt(r.days_to_display, 10),
          hide_finished_after_hours: parseInt(r.hide_finished_after_hours, 10),
          default_view_mode: r.default_view_mode,
          updated_at: new Date(r.updated_at).toISOString()
        };
      }
    } catch (err: any) {
      console.warn('[Football Settings] PostgreSQL update error, fallback to storage:', err.message);
    }
  }

  const db = loadDatabase();
  db.football_agenda_settings = {
    ...(db.football_agenda_settings || {
      id: 'primary',
      is_enabled: true,
      days_to_display: 7,
      hide_finished_after_hours: 3,
      default_view_mode: 'live_first'
    }),
    ...updates,
    updated_at: now
  };
  saveDatabase(db);
  return db.football_agenda_settings;
}


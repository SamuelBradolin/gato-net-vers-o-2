import { Router, Request, Response } from 'express';
import { hashPassword, verifyPassword } from '../auth/argon2.js';
import { checkLoginRateLimit, recordFailedLogin, resetLoginAttempts } from '../auth/rateLimit.js';
import {
  findAdminByEmail,
  getAdminById,
  countAdmins,
  createAdmin,
  updateAdmin,
  createAdminSession,
  deleteAdminSession,
  createAuditLog,
  createPasswordResetToken,
  findPasswordResetToken,
  markPasswordResetTokenUsed,
  updateAdminPassword
} from '../db/repository.js';
import {
  generateRawToken,
  hashToken,
  getCookieOptions,
  ADMIN_COOKIE_NAME,
  requireAdmin,
  AuthenticatedRequest
} from '../auth/middleware.js';

const router = Router();

// ==========================================
// 1. SETUP STATUS & INITIAL INSTALLATION
// ==========================================
router.get('/admin/setup/status', async (_req: Request, res: Response) => {
  try {
    const adminCount = await countAdmins();
    res.json({
      isSetupRequired: adminCount === 0,
      adminCount
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao verificar status de instalação do sistema' });
  }
});

router.post('/admin/setup', async (req: Request, res: Response) => {
  try {
    const adminCount = await countAdmins();
    if (adminCount > 0) {
      res.status(403).json({
        error: 'Instalação já concluída',
        message: 'O administrador inicial já foi criado. O processo de setup inicial está bloqueado por segurança.'
      });
      return;
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Dados incompletos', message: 'Nome, e-mail e senha são obrigatórios.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        error: 'Senha fraca',
        message: 'A senha do administrador deve possuir no mínimo 8 caracteres.'
      });
      return;
    }

    // Hash password with Argon2id
    const password_hash = await hashPassword(password);

    const admin = await createAdmin({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      role: 'superadmin',
      is_active: true,
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString()
    });

    const ip = req.ip || req.socket.remoteAddress || null;
    await createAuditLog(
      admin.id,
      admin.email,
      'INITIAL_SUPERADMIN_SETUP',
      'admins',
      admin.id,
      { message: 'Instalação segura da Gato Net concluída com sucesso via Argon2id' },
      ip
    );

    // Auto-login after setup
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    await createAdminSession(admin.id, tokenHash, ip, req.headers['user-agent'] || null);

    res.cookie(ADMIN_COOKIE_NAME, rawToken, getCookieOptions());

    res.status(201).json({
      success: true,
      message: 'Administrador inicial criado com sucesso!',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      },
      token: rawToken
    });
  } catch (err: any) {
    console.error('[Auth Route] Setup error:', err);
    res.status(500).json({ error: 'Falha ao executar instalação do administrador' });
  }
});

// ==========================================
// 2. ADMIN LOGIN
// ==========================================
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (!email || !password) {
      res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check Rate Limiting
    const rateCheck = checkLoginRateLimit(ip, cleanEmail);
    if (!rateCheck.isAllowed) {
      await createAuditLog(
        null,
        cleanEmail,
        'LOGIN_RATE_LIMIT_BLOCKED',
        'auth',
        null,
        { ip, retryAfterSeconds: rateCheck.retryAfterSeconds },
        ip
      );

      res.status(429).json({
        error: 'Muitas tentativas incorretas',
        message: `Acesso temporariamente bloqueado por segurança. Tente novamente em ${rateCheck.retryAfterSeconds} segundos.`
      });
      return;
    }

    const admin = await findAdminByEmail(cleanEmail);

    if (!admin || !admin.is_active) {
      const record = recordFailedLogin(ip, cleanEmail);
      await createAuditLog(
        null,
        cleanEmail,
        'LOGIN_FAILED_NOT_FOUND',
        'auth',
        null,
        { ip, remainingAttempts: record.remainingAttempts },
        ip
      );

      res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'E-mail ou senha incorretos.',
        remainingAttempts: record.remainingAttempts
      });
      return;
    }

    // Verify Argon2id password hash
    const isValid = await verifyPassword(password, admin.password_hash);

    if (!isValid) {
      const record = recordFailedLogin(ip, cleanEmail);
      await updateAdmin(admin.id, {
        failed_attempts: (admin.failed_attempts || 0) + 1,
        locked_until: record.isBlocked ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null
      });

      await createAuditLog(
        admin.id,
        admin.email,
        'LOGIN_FAILED_PASSWORD',
        'auth',
        admin.id,
        { ip, remainingAttempts: record.remainingAttempts },
        ip
      );

      res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'E-mail ou senha incorretos.',
        remainingAttempts: record.remainingAttempts
      });
      return;
    }

    // Successful Login: Reset attempts
    resetLoginAttempts(ip, cleanEmail);
    await updateAdmin(admin.id, {
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString()
    });

    // Create secure session
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const userAgent = req.headers['user-agent'] || null;

    await createAdminSession(admin.id, tokenHash, ip, userAgent);

    // Set HttpOnly, Secure, SameSite Cookie
    res.cookie(ADMIN_COOKIE_NAME, rawToken, getCookieOptions());

    await createAuditLog(
      admin.id,
      admin.email,
      'ADMIN_LOGIN_SUCCESS',
      'auth',
      admin.id,
      { ip, userAgent },
      ip
    );

    res.json({
      success: true,
      message: 'Autenticação realizada com sucesso',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      },
      token: rawToken
    });
  } catch (err: any) {
    console.error('[Auth Route] Login error:', err);
    res.status(500).json({ error: 'Erro interno durante autenticação' });
  }
});

// ==========================================
// 3. ADMIN LOGOUT
// ==========================================
router.post('/auth/logout', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.adminTokenHash) {
      await deleteAdminSession(req.adminTokenHash);
    }

    res.clearCookie(ADMIN_COOKIE_NAME, { path: '/' });

    if (req.admin) {
      const ip = req.ip || req.socket.remoteAddress || null;
      await createAuditLog(
        req.admin.id,
        req.admin.email,
        'ADMIN_LOGOUT',
        'auth',
        req.admin.id,
        null,
        ip
      );
    }

    res.json({ success: true, message: 'Sessão encerrada com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao processar encerramento de sessão' });
  }
});

// ==========================================
// 4. CURRENT ADMIN ME
// ==========================================
router.get('/auth/me', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (!req.admin) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }
  res.json({
    admin: {
      id: req.admin.id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      last_login_at: req.admin.last_login_at
    }
  });
});

// ==========================================
// 5. SECURE PASSWORD RECOVERY
// ==========================================
router.post('/auth/recovery/request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (!email) {
      res.status(400).json({ error: 'E-mail obrigatório para solicitação de recuperação' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const admin = await findAdminByEmail(cleanEmail);

    if (!admin || !admin.is_active) {
      // Return neutral confirmation to prevent account enumeration
      res.json({
        success: true,
        message: 'Se o e-mail informado pertencer a um administrador ativo, as instruções e o código de recuperação foram gerados.'
      });
      return;
    }

    // Generate secure 32-byte cryptographic token
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);

    await createPasswordResetToken(admin.id, tokenHash, 15);

    await createAuditLog(
      admin.id,
      admin.email,
      'PASSWORD_RECOVERY_REQUESTED',
      'admins',
      admin.id,
      { ip, expires_in_minutes: 15 },
      ip
    );

    console.log(`[Gato Net Segurança] Token de recuperação gerado para ${admin.email}: ${rawToken}`);

    res.json({
      success: true,
      message: 'Instruções e código de recuperação gerados com sucesso (válido por 15 minutos).',
      recoveryCode: rawToken
    });
  } catch (err: any) {
    console.error('[Auth Recovery Request] Error:', err);
    res.status(500).json({ error: 'Erro ao processar solicitação de recuperação' });
  }
});

router.post('/auth/recovery/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Código de recuperação é obrigatório' });
      return;
    }

    const tokenHash = hashToken(token.trim());
    const resetData = await findPasswordResetToken(tokenHash);

    if (!resetData) {
      res.status(400).json({
        error: 'Código inválido ou expirado',
        message: 'O código de recuperação informado não é válido ou já expirou (limite de 15 minutos).'
      });
      return;
    }

    res.json({
      valid: true,
      email: resetData.admin.email,
      name: resetData.admin.name
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao verificar código de recuperação' });
  }
});

router.post('/auth/recovery/reset', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Código de recuperação e nova senha são obrigatórios' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres' });
      return;
    }

    const tokenHash = hashToken(token.trim());
    const resetData = await findPasswordResetToken(tokenHash);

    if (!resetData) {
      res.status(400).json({
        error: 'Código inválido ou expirado',
        message: 'O código de recuperação é inválido ou expirou. Solicite um novo código.'
      });
      return;
    }

    // Hash new password with Argon2id
    const newHash = await hashPassword(newPassword);

    // Update password, reset locks, invalidate existing sessions
    await updateAdminPassword(resetData.admin.id, newHash);
    await markPasswordResetTokenUsed(tokenHash);

    await createAuditLog(
      resetData.admin.id,
      resetData.admin.email,
      'PASSWORD_RESET_SUCCESS',
      'admins',
      resetData.admin.id,
      { ip, method: 'Argon2id' },
      ip
    );

    res.json({
      success: true,
      message: 'Senha administrativa redefinida com sucesso com Argon2id. Todas as sessões anteriores foram invalidadas por segurança.'
    });
  } catch (err: any) {
    console.error('[Auth Recovery Reset] Error:', err);
    res.status(500).json({ error: 'Erro ao redefinir senha administrativa' });
  }
});

// ==========================================
// 6. CHANGE PASSWORD (AUTHENTICATED)
// ==========================================
router.put('/admin/change-password', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await getAdminById(req.admin!.id);

    if (!admin) {
      res.status(404).json({ error: 'Administrador não encontrado' });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres' });
      return;
    }

    const isCurrentValid = await verifyPassword(currentPassword, admin.password_hash);
    if (!isCurrentValid) {
      res.status(400).json({ error: 'Senha atual incorreta' });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await updateAdminPassword(admin.id, newHash);

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    await createAuditLog(
      admin.id,
      admin.email,
      'ADMIN_PASSWORD_CHANGED',
      'admins',
      admin.id,
      { ip },
      ip
    );

    res.json({
      success: true,
      message: 'Senha alterada com sucesso! Faça login novamente com a nova senha.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

export default router;


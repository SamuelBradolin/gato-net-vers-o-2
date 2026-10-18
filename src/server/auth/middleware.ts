import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { findAdminSession, deleteAdminSession } from '../db/repository.js';
import { AdminUser } from '../db/schema.js';

export const ADMIN_COOKIE_NAME = 'gatonet_admin_session';

export interface AuthenticatedRequest extends Request {
  admin?: AdminUser;
  adminTokenHash?: string;
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  };
}

/**
 * Middleware: Protects administrative routes.
 * Checks HttpOnly cookie or Authorization Bearer header.
 */
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let rawToken: string | undefined;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies[ADMIN_COOKIE_NAME]) {
      rawToken = req.cookies[ADMIN_COOKIE_NAME];
    }

    // 2. Fallback to Authorization Header (Bearer <token>)
    if (!rawToken && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        rawToken = parts[1];
      }
    }

    if (!rawToken) {
      res.status(401).json({
        error: 'Acesso não autorizado',
        message: 'Sessão administrativa necessária. Efetue login para continuar.'
      });
      return;
    }

    const tokenHash = hashToken(rawToken);
    const sessionData = await findAdminSession(tokenHash);

    if (!sessionData) {
      // Clear invalid cookie
      res.clearCookie(ADMIN_COOKIE_NAME, { path: '/' });
      res.status(401).json({
        error: 'Sessão expirada ou inválida',
        message: 'Sua sessão administrativa expirou. Por favor, autentique-se novamente.'
      });
      return;
    }

    // Check account lock
    if (sessionData.admin.locked_until) {
      const lockedTime = new Date(sessionData.admin.locked_until).getTime();
      if (lockedTime > Date.now()) {
        res.status(403).json({
          error: 'Conta temporariamente bloqueada',
          message: 'Conta administrativa temporariamente bloqueada por segurança.'
        });
        return;
      }
    }

    req.admin = sessionData.admin;
    req.adminTokenHash = tokenHash;
    next();
  } catch (err: any) {
    console.error('[Auth Middleware] Unexpected error:', err.message);
    res.status(500).json({ error: 'Erro interno de verificação de autenticação' });
  }
}

/**
 * Middleware: Checks for superadmin role
 */
export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.admin || req.admin.role !== 'superadmin') {
    res.status(403).json({
      error: 'Permissão insuficiente',
      message: 'Esta operação requer privilégios de Super Administrador.'
    });
    return;
  }
  next();
}

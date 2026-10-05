import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { Role } from '../src/types';

const SESSION_SECRET = process.env.SESSION_SECRET || 'sakshya_session_secret_change_in_production_32chars';
export const COOKIE_NAME = 'sakshya_session';

export interface SessionUser {
  id: string;
  name: string;
  officerId: string;
  role: Role;
  roleTitle: string;
  station: string;
  jurisdiction: string;
  avatar: string;
}

interface SessionPayload {
  user: SessionUser;
  iat: number;
  exp: number;
}

export function signSession(user: SessionUser): string {
  const payload: SessionPayload = {
    user,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

export function verifySession(token: string): SessionUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) {
      return null;
    }

    return payload.user;
  } catch {
    return null;
  }
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (token) {
    const user = verifySession(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication session required. Please sign in with an officer persona.',
    });
  }
  next();
}

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication session required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      const accessLog = {
        event: 'ACCESS_DENIED',
        timestamp: new Date().toISOString(),
        actorId: req.user.officerId,
        actorRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.originalUrl,
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
      };
      console.warn('[RBAC DENIED]', JSON.stringify(accessLog));

      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: `Role ${req.user.role} is not permitted to access this resource. Required: ${allowedRoles.join(', ')}. Denied attempt logged.`,
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
        loggedIncident: accessLog,
      });
    }

    next();
  };
}

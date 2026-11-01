import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'smart-hisab-secure-jwt-secret-key-2025';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    if (!decoded || !decoded.userId) {
      res.status(401).json({ error: 'Invalid authentication token' });
      return;
    }

    // Check if session exists in DB
    const session = db
      .prepare('SELECT id, user_id, expires_at FROM sessions WHERE id = ? AND user_id = ?')
      .get(token, decoded.userId) as { id: string; user_id: string; expires_at: number } | undefined;

    if (!session || session.expires_at < Date.now()) {
      res.status(401).json({ error: 'Session expired or invalidated' });
      return;
    }

    // Fetch user
    const user = db
      .prepare('SELECT id, name, email, phone, avatar_url FROM users WHERE id = ?')
      .get(decoded.userId) as { id: string; name: string; email: string; phone: string; avatar_url?: string } | undefined;

    if (!user) {
      res.status(401).json({ error: 'User account not found' });
      return;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatar_url,
    };

    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

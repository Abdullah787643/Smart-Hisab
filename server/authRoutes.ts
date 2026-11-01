import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db.js';
import { AuthRequest, authMiddleware, JWT_SECRET } from './middleware.js';

export const authRouter = Router();

function createSession(userId: string): string {
  const token = jwt.sign({ userId, timestamp: Date.now() }, JWT_SECRET, {
    expiresIn: '30d',
  });
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

  db.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    token,
    userId,
    Date.now(),
    expiresAt
  );

  return token;
}

// 1. Direct Account Registration (Full Name, Mobile Number, Gmail Address, Password)
authRouter.post('/register', async (req, res: Response) => {
  try {
    const { fullName, mobileNumber, email, password } = req.body;

    // Validate Full Name
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({ error: 'Please enter a valid full name (at least 2 characters).' });
      return;
    }

    // Validate Mobile Number
    const rawPhone = (mobileNumber || '').toString().trim();
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      res.status(400).json({ error: 'Please enter a valid mobile number (at least 10 digits).' });
      return;
    }

    // Validate Gmail / Email Address
    const cleanEmail = (email || '').toString().trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid Gmail / Email address.' });
      return;
    }

    // Validate Password
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const cleanPhone = rawPhone;

    // Check if email already registered
    const existingEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existingEmail) {
      res.status(400).json({ error: 'This email address is already registered. Please log in.' });
      return;
    }

    // Check if phone already registered
    const existingPhone = db.prepare('SELECT id FROM users WHERE phone = ?').get(cleanPhone);
    if (existingPhone) {
      res.status(400).json({ error: 'This mobile number is already registered. Please log in.' });
      return;
    }

    // Hash password with bcrypt
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const userId = 'usr_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    const now = Date.now();

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, fullName.trim(), cleanEmail, cleanPhone, passwordHash, now, now);

    // Create persistent session
    const token = createSession(userId);

    res.json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: userId,
        name: fullName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
      },
      token,
    });
  } catch (err: any) {
    console.error('Error in register:', err);
    res.status(500).json({ error: 'Failed to create account due to a server error.' });
  }
});

// 2. Normal Login with Mobile Number OR Gmail + Password
authRouter.post('/login', async (req, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ error: 'Please enter your mobile number or email and password.' });
      return;
    }

    const cleanIdentifier = identifier.toString().trim();
    const cleanLower = cleanIdentifier.toLowerCase();

    // Query user by email OR mobile phone
    const user = db
      .prepare(
        'SELECT id, name, email, phone, password_hash, avatar_url FROM users WHERE LOWER(email) = ? OR phone = ?'
      )
      .get(cleanLower, cleanIdentifier) as
      | { id: string; name: string; email: string; phone: string; password_hash: string; avatar_url?: string }
      | undefined;

    if (!user) {
      res.status(400).json({
        error: 'No account found with this email or mobile number. If you are new, please register first.',
      });
      return;
    }

    if (!user.password_hash) {
      res.status(400).json({
        error: 'Account password not configured. Please contact support.',
      });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(400).json({
        error: 'Incorrect password. Please try again.',
      });
      return;
    }

    const token = createSession(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatar_url,
      },
      token,
    });
  } catch (err: any) {
    console.error('Error in login:', err);
    res.status(500).json({ error: 'Login failed due to a server error.' });
  }
});

// 3. Change Password (Authenticated)
authRouter.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Both current and new passwords are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as
      | { password_hash: string }
      | undefined;

    if (!user || !user.password_hash) {
      res.status(400).json({ error: 'Unable to verify account password.' });
      return;
    }

    const match = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!match) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
      newHash,
      Date.now(),
      req.user!.id
    );

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('Error in change-password:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// 4. Get Current Authenticated Profile
authRouter.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ success: true, user: req.user });
});

// 5. Logout Current Session
authRouter.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  const token = req.headers.authorization!.split(' ')[1];
  db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
  res.json({ success: true });
});

// 6. Logout All Sessions
authRouter.post('/logout-all', authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.user!.id);
  res.json({ success: true });
});

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { runQuery, getQuery } from '../database.js';
import { requireAuth } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const BCRYPT_ROUNDS = 12;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), BCRYPT_ROUNDS);

const validateEmail = (email) => {
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  const sanitized = email.trim();
  if (!sanitized) return { valid: false, error: 'Email is required' };
  if (sanitized.length > MAX_EMAIL_LENGTH) {
    return { valid: false, error: `Email must be less than ${MAX_EMAIL_LENGTH} characters` };
  }
  if (!EMAIL_REGEX.test(sanitized)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true, value: sanitized.toLowerCase() };
};

const validatePassword = (password, { enforceMinLength = false } = {}) => {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 1) return { valid: false, error: 'Password cannot be empty' };
  if (enforceMinLength && password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be less than ${MAX_PASSWORD_LENGTH} characters` };
  }
  return { valid: true, value: password };
};

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      return res.status(400).json({ error: emailResult.error });
    }

    const passwordResult = validatePassword(password, { enforceMinLength: true });
    if (!passwordResult.valid) {
      return res.status(400).json({ error: passwordResult.error });
    }

    const existingUser = await getQuery('SELECT id FROM users WHERE email = ?', [emailResult.value]);
    if (existingUser) {
      return res.status(409).json({
        error: 'Unable to complete registration with this email. If you already have an account, please sign in.'
      });
    }

    const hashedPassword = await bcrypt.hash(passwordResult.value, BCRYPT_ROUNDS);
    const id = crypto.randomUUID();

    await runQuery('INSERT INTO users (id, email, password) VALUES (?, ?, ?)', [
      id, emailResult.value, hashedPassword
    ]);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    if (error?.code === 'SQLITE_CONSTRAINT' || error?.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        error: 'Unable to complete registration with this email. If you already have an account, please sign in.'
      });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      return res.status(400).json({ error: emailResult.error });
    }

    const passwordResult = validatePassword(password, { enforceMinLength: false });
    if (!passwordResult.valid) {
      return res.status(400).json({ error: passwordResult.error });
    }

    const user = await getQuery('SELECT * FROM users WHERE email = ?', [emailResult.value]);
    if (!user) {
      await bcrypt.compare(passwordResult.value, DUMMY_PASSWORD_HASH);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(passwordResult.value, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/session', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
});

export default router;

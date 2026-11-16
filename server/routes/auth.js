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
const GOOGLE_ONLY_PASSWORD_SENTINEL = '!google-oauth-only';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

let cachedGoogleCerts = {
  keys: new Map(),
  expiresAt: 0,
};
let inFlightCertFetch = null;

const getGoogleClientId = () => (process.env.GOOGLE_CLIENT_ID || '').trim();

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

const parseCacheMaxAgeMs = (cacheControl) => {
  if (!cacheControl) return 3600 * 1000;
  const match = /max-age=(\d+)/i.exec(cacheControl);
  if (!match) return 3600 * 1000;
  const seconds = Math.max(60, Math.min(86400, Number(match[1])));
  return seconds * 1000;
};

const fetchGoogleCerts = async (forceRefresh = false) => {
  if (!forceRefresh && cachedGoogleCerts.keys.size > 0 && Date.now() < cachedGoogleCerts.expiresAt) {
    return cachedGoogleCerts.keys;
  }

  if (inFlightCertFetch) {
    return inFlightCertFetch;
  }

  inFlightCertFetch = (async () => {
    const res = await fetch(GOOGLE_JWKS_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch Google signing keys (${res.status})`);
    }
    const body = await res.json();
    const keys = new Map();
    if (Array.isArray(body?.keys)) {
      for (const jwk of body.keys) {
        if (jwk && jwk.kty === 'RSA' && typeof jwk.kid === 'string' && jwk.kid) {
          keys.set(jwk.kid, crypto.createPublicKey({ key: jwk, format: 'jwk' }));
        }
      }
    }
    if (keys.size === 0) {
      throw new Error('No valid Google signing keys returned');
    }
    const maxAgeMs = parseCacheMaxAgeMs(res.headers.get('cache-control'));
    cachedGoogleCerts = {
      keys,
      expiresAt: Date.now() + maxAgeMs,
    };
    return keys;
  })();

  try {
    return await inFlightCertFetch;
  } finally {
    inFlightCertFetch = null;
  }
};

const verifyGoogleIdToken = async (idToken, expectedClientId) => {
  if (typeof idToken !== 'string' || !idToken || idToken.length > 8192) {
    throw new Error('Invalid Google credential');
  }

  const decoded = jwt.decode(idToken, { complete: true });
  const kid = decoded?.header?.kid;
  if (decoded?.header?.alg !== 'RS256' || typeof kid !== 'string' || !kid) {
    throw new Error('Unsupported Google credential header');
  }

  let keys = await fetchGoogleCerts(false);
  let publicKey = keys.get(kid);
  if (!publicKey) {
    keys = await fetchGoogleCerts(true);
    publicKey = keys.get(kid);
  }
  if (!publicKey) {
    throw new Error('Unknown Google signing key');
  }

  const payload = jwt.verify(idToken, publicKey, {
    algorithms: ['RS256'],
    audience: expectedClientId,
    issuer: GOOGLE_ISSUERS,
    clockTolerance: 5,
  });

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.sub !== 'string' ||
    !payload.sub ||
    payload.email_verified !== true
  ) {
    throw new Error('Google account email is not verified');
  }

  const emailResult = validateEmail(payload.email);
  if (!emailResult.valid) {
    throw new Error(emailResult.error);
  }

  return {
    sub: payload.sub,
    email: emailResult.value,
  };
};

const signAuthToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

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
    if (!user || typeof user.password !== 'string' || !user.password.startsWith('$2')) {
      await bcrypt.compare(passwordResult.value, DUMMY_PASSWORD_HASH);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(passwordResult.value, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signAuthToken(user);

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

router.get('/config', (_req, res) => {
  const googleClientId = getGoogleClientId();
  res.json({
    googleClientId: googleClientId || null,
    googleEnabled: Boolean(googleClientId),
  });
});

router.post('/google', async (req, res) => {
  try {
    const googleClientId = getGoogleClientId();
    if (!googleClientId) {
      return res.status(503).json({
        error: 'Google sign-in is not configured on this server',
      });
    }

    const { credential } = req.body ?? {};
    let verified;
    try {
      verified = await verifyGoogleIdToken(credential, googleClientId);
    } catch (verifyError) {
      console.warn('Google credential verification failed:', verifyError?.message);
      return res.status(401).json({ error: 'Invalid or expired Google credential' });
    }

    let user = await getQuery('SELECT id, email, google_sub FROM users WHERE google_sub = ?', [
      verified.sub,
    ]);

    if (!user) {
      const existingByEmail = await getQuery(
        'SELECT id, email, google_sub FROM users WHERE email = ?',
        [verified.email]
      );

      if (existingByEmail) {
        if (existingByEmail.google_sub && existingByEmail.google_sub !== verified.sub) {
          return res.status(409).json({
            error: 'This email is already linked to another Google account',
          });
        }

        if (!existingByEmail.google_sub) {
          await runQuery(
            'UPDATE users SET google_sub = ? WHERE id = ? AND google_sub IS NULL',
            [verified.sub, existingByEmail.id]
          );
        }
        user = await getQuery('SELECT id, email, google_sub FROM users WHERE id = ?', [
          existingByEmail.id,
        ]);
      } else {
        const id = crypto.randomUUID();
        try {
          await runQuery(
            'INSERT INTO users (id, email, password, google_sub, auth_provider) VALUES (?, ?, ?, ?, ?)',
            [id, verified.email, GOOGLE_ONLY_PASSWORD_SENTINEL, verified.sub, 'google']
          );
          user = { id, email: verified.email };
        } catch (insertError) {
          if (
            insertError?.code === 'SQLITE_CONSTRAINT' ||
            insertError?.message?.includes('UNIQUE constraint failed')
          ) {
            user =
              (await getQuery('SELECT id, email FROM users WHERE google_sub = ?', [verified.sub])) ||
              (await getQuery('SELECT id, email FROM users WHERE email = ?', [verified.email]));
          } else {
            throw insertError;
          }
        }
      }
    }

    if (!user) {
      return res.status(500).json({ error: 'Unable to complete Google sign-in' });
    }
    if (user.google_sub && user.google_sub !== verified.sub) {
      return res.status(409).json({
        error: 'This email is already linked to another Google account',
      });
    }

    const token = signAuthToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
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

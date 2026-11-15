import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import db, { initDb } from './database.js';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';

const app = express();
const PORT = process.env.PORT || 3002;

const parseTrustProxy = (value) => {
  if (value === undefined || value === '') return 'loopback';
  if (value === 'true') return true;
  if (value === 'false') return false;
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : value;
};

app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet({
  hidePoweredBy: true,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      fontSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:8080', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log('Rejected origin:', origin);
    const corsError = new Error('Not allowed by CORS');
    corsError.statusCode = 403;
    callback(corsError);
  },
  credentials: true,
}));

app.use(generalLimiter);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/files', fileRoutes);
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const statusCode = err.statusCode || err.status || 500;
  if (statusCode >= 500) {
    console.error(err.stack);
  }
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'Something broke!'
    : err.message || 'Internal server error';
  res.status(statusCode).json({ error: message });
});

initDb()
  .then(() => {
    console.log('Database initialized successfully');
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    const shutdown = (signal) => {
      console.log(`${signal} received, shutting down gracefully...`);
      server.close(() => {
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
            process.exit(1);
          }
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

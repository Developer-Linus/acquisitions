import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import authRoutes from '#routes/auth.routes.js';

const app = express();

// Trust proxy if behind a reverse proxy (e.g., on platforms like Render/Heroku)
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = (process.env.ALLOWED_ORIGINS || '*')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (allowed.includes('*') || !origin || allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
    skip: (req) => req.path === '/health',
  })
);

app.get('/', (req, res) => {
  logger.info('Hello from Acquisitions');
  res.status(200).send('Hello from Acquisitions');
});
// Health check
app.get('/health', (req, res) => {
  res
    .status(200)
    .json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
});

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Acquisition API is running!' });
});

app.use('/api/auth', authRoutes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

export default app;

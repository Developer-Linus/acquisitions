import logger from '#config/logger.js';

// Centralized error handler (can be imported if needed)
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
}
import aj from '#config/arcjet.js';
import { slidingWindow } from '@arcjet/node';
import logger from '#config/logger.js';

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';
    let limit;
    switch (role) {
      case 'admin':
        limit = 20;
        break;
      case 'user':
        limit = 100;
        break;
      case 'guest':
        limit = 5;
        break;
    }

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    const decision = await client.protect(req);
    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Bot request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      return res
        .status(403)
        .json({
          error: 'Forbidden',
          message: 'Automated requests are not allowed.',
        });
    }
    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield Blocked request', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });
      return res
        .status(403)
        .json({
          error: 'Forbidden',
          message: 'Requests blocked by security policy.',
        });
    }
    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate Limit exceeded.', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      return res
        .status(403)
        .json({ error: 'Forbidden', message: 'Too many requests.' });
    }
    next();
  } catch (e) {
    console.error('Arcjet middleware error: ', e);
    res
      .status(500)
      .json({
        error: 'Internal server error',
        message: 'Something went wrong with security midddleware.',
      });
  }
};

export default securityMiddleware;

import { jwttoken } from '#utils/jwt.js';
import logger from '#config/logger.js';

// Verify token and attach user to req
export const authenticateToken = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = jwttoken.verify(token);
    req.user = payload; // attach decoded { id, email, role }
    next();
  } catch (err) {
    logger.error('Token verification failed', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Require authenticated user
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    logger.error('Unauthorized access attempt: missing user on request');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Require specific roles
export const requireRole =
  (...allowedRoles) =>
    (req, res, next) => {
      if (!req.user) {
        logger.error('Unauthorized access attempt: missing user on request');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (!allowedRoles.includes(req.user.role)) {
      // Not logging here — forbidden is expected in normal flow
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    };

// Require self or allowed role(s)
export const requireSelfOrRole =
  (paramIdName = 'id', allowedRoles = ['admin']) =>
    (req, res, next) => {
      if (!req.user) {
        logger.error('Unauthorized access attempt: missing user on request');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const resourceId = req.params?.[paramIdName];
      if (!resourceId) {
        logger.error(
          `Invalid request: missing resource id param "${paramIdName}"`
        );
        return res.status(400).json({ error: 'Missing resource id' });
      }

      const isSelf = String(req.user.id) === String(resourceId);
      const isAllowedRole = allowedRoles.includes(req.user.role);

      if (!isSelf && !isAllowedRole) {
      // Not logging forbidden, as it's expected if user lacks privilege
        return res.status(403).json({ error: 'Forbidden' });
      }

      next();
    };

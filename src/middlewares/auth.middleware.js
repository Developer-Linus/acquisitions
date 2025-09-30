// Require that a user is authenticated
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
};

// Require that the user has one of the allowed roles
export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const role = req.user.role;
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
};

// Require that the user is the resource owner (paramIdName) or has one of the roles
export const requireSelfOrRole = (paramIdName = 'id', allowedRoles = ['admin']) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const rawParam = req.params?.[paramIdName];
  const paramId = Number(rawParam);
  if (!Number.isFinite(paramId)) {
    return res.status(400).json({ error: 'Invalid resource id' });
  }
  const isSelf = Number(req.user.id) === paramId;
  const isAllowedRole = allowedRoles.includes(req.user.role);
  if (!isSelf && !isAllowedRole) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
};

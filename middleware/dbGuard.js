const { isDbConnected, dbStatus } = require('../config/db');

// Guards DB-dependent routes: when MongoDB is unavailable, short-circuit with a
// clear 503 instead of letting the request hang or fail with an opaque error.
// Health checks are mounted *before* this guard, so they stay available always.
module.exports = function dbGuard(req, res, next) {
  if (isDbConnected()) return next();

  console.warn(`🚫 503 (DB ${dbStatus()}): ${req.method} ${req.originalUrl}`);
  res.set('Retry-After', '5');
  return res.status(503).json({
    success: false,
    error: 'service_unavailable',
    message: 'Database temporarily unavailable. Please retry in a few seconds.',
  });
};

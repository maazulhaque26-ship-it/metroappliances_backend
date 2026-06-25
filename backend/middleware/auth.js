const jwt  = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user)          return res.status(401).json({ success: false, message: 'User not found' });
    if (!req.user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated' });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// admin or super_admin
exports.admin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) return next();
  res.status(403).json({ success: false, message: 'Admin access required' });
};

// super_admin only
exports.superAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'super_admin') return next();
  res.status(403).json({ success: false, message: 'Super Admin access required' });
};

// moderator, admin, or super_admin
exports.moderatorOrAbove = (req, res, next) => {
  if (req.user && ['moderator', 'admin', 'super_admin'].includes(req.user.role)) return next();
  res.status(403).json({ success: false, message: 'Moderator access required' });
};

exports.optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (err) { /* ignore */ }
  }
  next();
};

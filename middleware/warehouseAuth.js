const jwt           = require('jsonwebtoken');
const WarehouseUser = require('../models/WarehouseUser');

exports.protectWarehouse = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.warehouseToken) {
    token = req.cookies.warehouseToken;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Warehouse authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'warehouse') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    const user = await WarehouseUser.findById(decoded.id);
    if (!user || user.isDeleted) {
      return res.status(401).json({ success: false, message: 'Warehouse user account not found' });
    }
    if (user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Account is not active. Contact admin.' });
    }

    req.warehouseUser = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

exports.requireWarehouseRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.warehouseUser?.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient warehouse permissions' });
  }
  next();
};

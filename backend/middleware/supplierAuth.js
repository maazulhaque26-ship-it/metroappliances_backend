const jwt          = require('jsonwebtoken');
const SupplierUser = require('../models/SupplierUser');
const { forbidden, serverError } = require('../utils/response');

async function protectSupplier(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return forbidden(res, 'Supplier authentication required');
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'supplier') {
      return forbidden(res, 'Invalid token type for supplier portal');
    }

    const supplier = await SupplierUser.findOne({ _id: decoded.id, isDeleted: false }).populate('vendor', 'companyName vendorCode status');
    if (!supplier) return forbidden(res, 'Supplier user not found');
    if (supplier.status !== 'active') return forbidden(res, 'Supplier account is not active');
    if (supplier.vendor?.status === 'blacklisted') return forbidden(res, 'Vendor account is suspended');

    req.supplierUser = supplier;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return forbidden(res, 'Invalid or expired supplier token');
    }
    return serverError(res, err);
  }
}

function requireSupplierRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.supplierUser?.role)) {
      return forbidden(res, 'Insufficient supplier portal permissions');
    }
    next();
  };
}

module.exports = { protectSupplier, requireSupplierRole };

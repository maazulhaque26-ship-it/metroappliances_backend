const jwt        = require('jsonwebtoken');
const Technician = require('../models/Technician');

exports.protectTechnician = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.technicianToken) {
    token = req.cookies.technicianToken;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Technician authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'technician') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    const technician = await Technician.findById(decoded.id);
    if (!technician || technician.isDeleted) {
      return res.status(401).json({ success: false, message: 'Technician account not found' });
    }
    if (technician.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Account is not active. Contact admin.' });
    }

    req.technician = technician;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

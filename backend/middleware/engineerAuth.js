const jwt  = require('jsonwebtoken');
const InstallationEngineer = require('../models/InstallationEngineer');

exports.protectEngineer = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.engineerToken) {
    token = req.cookies.engineerToken;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Engineer authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'engineer') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    const engineer = await InstallationEngineer.findById(decoded.id);
    if (!engineer || engineer.isDeleted) {
      return res.status(401).json({ success: false, message: 'Engineer account not found' });
    }
    if (engineer.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Account is not active. Contact admin.' });
    }

    req.engineer = engineer;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

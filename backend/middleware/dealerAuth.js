const jwt    = require('jsonwebtoken');
const Dealer = require('../models/Dealer');

// Verifies a dealer JWT. Rejects user tokens to prevent cross-auth.
exports.protectDealer = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.dealerToken) {
    token = req.cookies.dealerToken;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Dealer authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Enforce type separation — user tokens must not access dealer routes
    if (decoded.type !== 'dealer') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    const dealer = await Dealer.findById(decoded.id);
    if (!dealer || dealer.isDeleted) {
      return res.status(401).json({ success: false, message: 'Dealer account not found' });
    }
    if (!dealer.isActive) {
      return res.status(401).json({ success: false, message: 'Dealer account has been deactivated' });
    }
    if (dealer.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your dealer account is suspended. Please contact support.',
        status:  'suspended',
      });
    }

    req.dealer = dealer;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Allows only approved dealers past the gate
exports.requireApproved = (req, res, next) => {
  if (req.dealer?.status !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Your dealer account is pending admin approval.',
      status:  req.dealer?.status,
    });
  }
  next();
};

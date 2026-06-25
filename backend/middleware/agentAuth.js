const jwt        = require('jsonwebtoken');
const SalesAgent = require('../models/SalesAgent');

exports.protectAgent = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.agentToken) {
    token = req.cookies.agentToken;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Agent authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'agent') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    const agent = await SalesAgent.findById(decoded.id);
    if (!agent || agent.isDeleted) {
      return res.status(401).json({ success: false, message: 'Agent account not found' });
    }
    if (!agent.isActive || agent.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Agent account is not active' });
    }

    req.agent = agent;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

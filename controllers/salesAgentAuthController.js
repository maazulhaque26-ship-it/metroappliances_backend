const jwt        = require('jsonwebtoken');
const SalesAgent = require('../models/SalesAgent');

const signToken = (id) => jwt.sign(
  { id, type: 'agent' },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRE || '30d' }
);

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const agent = await SalesAgent.findOne({ email: email.toLowerCase(), isDeleted: false }).select('+password');
    if (!agent) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!agent.isActive || agent.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Account is not active. Contact admin.' });
    }

    const match = await agent.matchPassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(agent._id);
    const agentData = agent.toObject();
    delete agentData.password;

    res.json({ success: true, token, agent: agentData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out' });
};

exports.getMe = async (req, res) => {
  try {
    const agent = await SalesAgent.findById(req.agent._id)
      .populate('territory', 'name code')
      .populate('manager', 'name agentCode');
    res.json({ success: true, agent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const agent = await SalesAgent.findByIdAndUpdate(req.agent._id, updates, { new: true, runValidators: true });
    res.json({ success: true, agent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const agent = await SalesAgent.findById(req.agent._id).select('+password');
    const match = await agent.matchPassword(currentPassword);
    if (!match) return res.status(401).json({ success: false, message: 'Current password incorrect' });

    agent.password = newPassword;
    await agent.save();
    res.json({ success: true, message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

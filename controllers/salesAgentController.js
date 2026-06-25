const SalesAgent = require('../models/SalesAgent');

exports.getAgents = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, territory, search } = req.query;
    const filter = { isDeleted: false };
    if (status)    filter.status    = status;
    if (territory) filter.territory = territory;
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ name: re }, { email: re }, { agentCode: re }, { phone: re }];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await SalesAgent.countDocuments(filter);
    const agents = await SalesAgent.find(filter)
      .populate('territory', 'name code')
      .populate('manager', 'name agentCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      agents,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAgentById = async (req, res) => {
  try {
    const agent = await SalesAgent.findOne({ _id: req.params.id, isDeleted: false })
      .populate('territory', 'name code')
      .populate('manager', 'name agentCode');
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    res.json({ success: true, agent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAgent = async (req, res) => {
  try {
    const agent = await SalesAgent.create(req.body);
    res.status(201).json({ success: true, agent });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Email already registered' });
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAgent = async (req, res) => {
  try {
    const disallowed = ['password', 'agentCode', 'isDeleted'];
    disallowed.forEach(k => delete req.body[k]);

    const agent = await SalesAgent.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    ).populate('territory', 'name code');

    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    res.json({ success: true, agent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleAgentStatus = async (req, res) => {
  try {
    const agent = await SalesAgent.findOne({ _id: req.params.id, isDeleted: false });
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    agent.status   = agent.status === 'active' ? 'inactive' : 'active';
    agent.isActive = agent.status === 'active';
    await agent.save();
    res.json({ success: true, agent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAgent = async (req, res) => {
  try {
    const agent = await SalesAgent.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, isActive: false },
      { new: true }
    );
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    res.json({ success: true, message: 'Agent deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetAgentPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const agent = await SalesAgent.findOne({ _id: req.params.id, isDeleted: false });
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    agent.password = newPassword;
    await agent.save();
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

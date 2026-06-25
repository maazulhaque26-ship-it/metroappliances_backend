const Task = require('../models/Task');

exports.getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, agentId, dueFrom, dueTo } = req.query;
    const filter = { isDeleted: false };

    if (req.agent) filter.agent = req.agent._id;
    else if (agentId) filter.agent = agentId;

    if (status) filter.status = status;
    if (type)   filter.type   = type;
    if (dueFrom || dueTo) {
      filter.dueDate = {};
      if (dueFrom) filter.dueDate.$gte = new Date(dueFrom);
      if (dueTo)   filter.dueDate.$lte = new Date(dueTo);
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('agent',    'name agentCode')
      .populate('assignedBy', 'name agentCode')
      .populate('lead',     'businessName leadNumber')
      .populate('dealer',   'businessName dealerCode')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      tasks,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const filter = { _id: req.params.id, isDeleted: false };
    if (req.agent) filter.agent = req.agent._id;

    const task = await Task.findOne(filter)
      .populate('agent',    'name agentCode')
      .populate('lead',     'businessName leadNumber stage')
      .populate('dealer',   'businessName dealerCode');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const agentId = req.agent ? req.agent._id : req.body.agent;
    const assignedBy = req.agent ? req.agent._id : req.body.assignedBy;
    const task = await Task.create({ ...req.body, agent: agentId, assignedBy });
    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const filter = { _id: req.params.id, isDeleted: false };
    if (req.agent) filter.agent = req.agent._id;

    const disallowed = ['taskNumber', 'agent', 'assignedBy'];
    disallowed.forEach(k => delete req.body[k]);

    const task = await Task.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const filter = { _id: req.params.id, isDeleted: false };
    if (req.agent) filter.agent = req.agent._id;

    const task = await Task.findOne(filter);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.status === 'completed') return res.status(400).json({ success: false, message: 'Task already completed' });

    task.status = 'completed';
    task.completedAt = new Date();
    task.completionNote = req.body.completionNote || '';
    await task.save();
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const filter = { _id: req.params.id, isDeleted: false };
    if (req.agent) filter.agent = req.agent._id;

    const task = await Task.findOneAndUpdate(filter, { isDeleted: true }, { new: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

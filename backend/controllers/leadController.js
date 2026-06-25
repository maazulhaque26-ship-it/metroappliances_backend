const Lead = require('../models/Lead');

exports.getLeads = async (req, res) => {
  try {
    const { page = 1, limit = 20, stage, priority, agentId, search } = req.query;
    const filter = { isDeleted: false };

    // Agents can only see their own leads (unless canViewAllLeads)
    if (req.agent && !req.agent.permissions?.canViewAllLeads) {
      filter.assignedAgent = req.agent._id;
    } else if (agentId) {
      filter.assignedAgent = agentId;
    }

    if (stage)    filter.stage    = stage;
    if (priority) filter.priority = priority;
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ businessName: re }, { contactPerson: re }, { phone: re }, { leadNumber: re }];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Lead.countDocuments(filter);
    const leads = await Lead.find(filter)
      .populate('assignedAgent', 'name agentCode')
      .populate('territory', 'name')
      .populate('convertedDealer', 'businessName dealerCode')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      leads,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLeadById = async (req, res) => {
  try {
    const filter = { _id: req.params.id, isDeleted: false };
    if (req.agent && !req.agent.permissions?.canViewAllLeads) {
      filter.assignedAgent = req.agent._id;
    }

    const lead = await Lead.findOne(filter)
      .populate('assignedAgent', 'name agentCode phone')
      .populate('territory', 'name code')
      .populate('convertedDealer', 'businessName dealerCode')
      .populate('notes.addedBy', 'name agentCode')
      .populate('stageHistory.changedBy', 'name agentCode');

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createLead = async (req, res) => {
  try {
    const agentId = req.agent ? req.agent._id : req.body.assignedAgent;
    const lead = await Lead.create({ ...req.body, assignedAgent: agentId });
    res.status(201).json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const filter = { _id: req.params.id, isDeleted: false };
    if (req.agent && !req.agent.permissions?.canEditLeads) {
      return res.status(403).json({ success: false, message: 'No permission to edit leads' });
    }
    if (req.agent && !req.agent.permissions?.canViewAllLeads) {
      filter.assignedAgent = req.agent._id;
    }

    const disallowed = ['leadNumber', 'assignedAgent', 'stageHistory', 'notes'];
    disallowed.forEach(k => delete req.body[k]);

    const lead = await Lead.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changeStage = async (req, res) => {
  try {
    const { stage, note } = req.body;
    const filter = { _id: req.params.id, isDeleted: false };
    if (req.agent && !req.agent.permissions?.canViewAllLeads) {
      filter.assignedAgent = req.agent._id;
    }

    const lead = await Lead.findOne(filter);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const changedBy = req.agent?._id || null;
    lead.stageHistory.push({ stage, changedAt: new Date(), changedBy, note });
    lead.stage = stage;
    if (stage === 'won' || stage === 'lost') lead.lastContactDate = new Date();
    await lead.save();

    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Note text required' });

    const filter = { _id: req.params.id, isDeleted: false };
    if (req.agent && !req.agent.permissions?.canViewAllLeads) {
      filter.assignedAgent = req.agent._id;
    }

    const lead = await Lead.findOne(filter);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    lead.notes.push({ text, addedBy: req.agent?._id || null, addedAt: new Date() });
    lead.lastContactDate = new Date();
    await lead.save();

    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, isActive: false },
      { new: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

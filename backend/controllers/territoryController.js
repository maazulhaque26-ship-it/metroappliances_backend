const Territory  = require('../models/Territory');
const SalesAgent = require('../models/SalesAgent');
const Dealer     = require('../models/Dealer');

exports.getTerritories = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const filter = { isDeleted: false };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ name: re }, { code: re }];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Territory.countDocuments(filter);
    const territories = await Territory.find(filter)
      .populate('primaryAgent', 'name agentCode')
      .populate('assignedAgents', 'name agentCode status')
      .populate('assignedDealers', 'businessName dealerCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      territories,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTerritoryById = async (req, res) => {
  try {
    const territory = await Territory.findOne({ _id: req.params.id, isDeleted: false })
      .populate('primaryAgent', 'name agentCode phone')
      .populate('assignedAgents', 'name agentCode phone status')
      .populate('assignedDealers', 'businessName dealerCode city state');
    if (!territory) return res.status(404).json({ success: false, message: 'Territory not found' });
    res.json({ success: true, territory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTerritory = async (req, res) => {
  try {
    const territory = await Territory.create(req.body);
    res.status(201).json({ success: true, territory });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Territory code already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTerritory = async (req, res) => {
  try {
    const territory = await Territory.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    ).populate('primaryAgent', 'name agentCode');
    if (!territory) return res.status(404).json({ success: false, message: 'Territory not found' });
    res.json({ success: true, territory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTerritory = async (req, res) => {
  try {
    const territory = await Territory.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, isActive: false },
      { new: true }
    );
    if (!territory) return res.status(404).json({ success: false, message: 'Territory not found' });
    res.json({ success: true, message: 'Territory deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignAgent = async (req, res) => {
  try {
    const { agentId, isPrimary } = req.body;
    const territory = await Territory.findOne({ _id: req.params.id, isDeleted: false });
    if (!territory) return res.status(404).json({ success: false, message: 'Territory not found' });

    if (!territory.assignedAgents.includes(agentId)) {
      territory.assignedAgents.push(agentId);
    }
    if (isPrimary) territory.primaryAgent = agentId;

    await territory.save();
    await SalesAgent.findByIdAndUpdate(agentId, { territory: territory._id });
    res.json({ success: true, territory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignDealer = async (req, res) => {
  try {
    const { dealerId } = req.body;
    const territory = await Territory.findOne({ _id: req.params.id, isDeleted: false });
    if (!territory) return res.status(404).json({ success: false, message: 'Territory not found' });

    if (!territory.assignedDealers.includes(dealerId)) {
      territory.assignedDealers.push(dealerId);
    }
    await territory.save();
    res.json({ success: true, territory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

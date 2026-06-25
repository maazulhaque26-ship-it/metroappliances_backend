const VisitReport = require('../models/VisitReport');

exports.getVisitReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, agentId, dealerId, from, to } = req.query;
    const filter = { isDeleted: false };

    if (req.agent) filter.agent = req.agent._id;
    else if (agentId) filter.agent = agentId;

    if (dealerId) filter.dealer = dealerId;
    if (status)   filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await VisitReport.countDocuments(filter);
    const visits = await VisitReport.find(filter)
      .populate('agent',  'name agentCode')
      .populate('dealer', 'businessName dealerCode city')
      .populate('lead',   'businessName leadNumber stage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      visits,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getVisitById = async (req, res) => {
  try {
    const filter = { _id: req.params.id, isDeleted: false };
    if (req.agent) filter.agent = req.agent._id;

    const visit = await VisitReport.findOne(filter)
      .populate('agent',  'name agentCode phone')
      .populate('dealer', 'businessName dealerCode city state')
      .populate('lead',   'businessName leadNumber stage');

    if (!visit) return res.status(404).json({ success: false, message: 'Visit report not found' });
    res.json({ success: true, visit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createVisit = async (req, res) => {
  try {
    const agentId = req.agent ? req.agent._id : req.body.agent;
    const visit = await VisitReport.create({ ...req.body, agent: agentId });
    res.status(201).json({ success: true, visit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const visit = await VisitReport.findOne({ _id: req.params.id, agent: req.agent._id, isDeleted: false });
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    if (visit.status !== 'planned') return res.status(400).json({ success: false, message: 'Visit already checked in' });

    visit.checkInTime = new Date();
    visit.checkInLocation = req.body.location || {};
    visit.status = 'checked_in';
    await visit.save();
    res.json({ success: true, visit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const visit = await VisitReport.findOne({ _id: req.params.id, agent: req.agent._id, isDeleted: false });
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    if (visit.status !== 'checked_in') return res.status(400).json({ success: false, message: 'Not checked in' });

    visit.checkOutTime = new Date();
    visit.checkOutLocation = req.body.location || {};
    visit.outcome = req.body.outcome || 'neutral';
    visit.outcomeNotes = req.body.outcomeNotes || '';
    visit.nextVisitDate = req.body.nextVisitDate;
    visit.nextVisitPurpose = req.body.nextVisitPurpose;
    visit.visitNotes = req.body.visitNotes || visit.visitNotes;
    visit.status = 'completed';
    await visit.save();
    res.json({ success: true, visit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateVisit = async (req, res) => {
  try {
    const filter = { _id: req.params.id, isDeleted: false };
    if (req.agent) filter.agent = req.agent._id;

    const disallowed = ['visitNumber', 'agent', 'checkInTime', 'checkOutTime'];
    disallowed.forEach(k => delete req.body[k]);

    const visit = await VisitReport.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    res.json({ success: true, visit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteVisit = async (req, res) => {
  try {
    const visit = await VisitReport.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    res.json({ success: true, message: 'Visit deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

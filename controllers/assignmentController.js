const Assignment = require('../models/Assignment');
const Dealer     = require('../models/Dealer');

exports.getAssignments = async (req, res) => {
  try {
    const { page = 1, limit = 20, agentId, dealerId, status } = req.query;
    const filter = {};
    if (agentId)  filter.agent  = agentId;
    if (dealerId) filter.dealer = dealerId;
    if (status)   filter.status = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Assignment.countDocuments(filter);
    const assignments = await Assignment.find(filter)
      .populate('agent',        'name agentCode phone')
      .populate('dealer',       'businessName dealerCode city state')
      .populate('territory',    'name code')
      .populate('transferredTo','name agentCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      assignments,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const { agentId, dealerId, territoryId, notes } = req.body;
    if (!agentId || !dealerId) return res.status(400).json({ success: false, message: 'Agent and dealer required' });

    // Deactivate any existing active assignment for this dealer
    await Assignment.updateMany({ dealer: dealerId, status: 'active' }, { status: 'inactive' });

    const assignment = await Assignment.create({
      agent:     agentId,
      dealer:    dealerId,
      territory: territoryId,
      notes,
      status:    'active',
    });

    const populated = await Assignment.findById(assignment._id)
      .populate('agent',  'name agentCode')
      .populate('dealer', 'businessName dealerCode');

    res.status(201).json({ success: true, assignment: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.transferAssignment = async (req, res) => {
  try {
    const { newAgentId, transferNote } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    assignment.status        = 'transferred';
    assignment.transferredAt = new Date();
    assignment.transferredTo = newAgentId;
    assignment.transferNote  = transferNote;
    await assignment.save();

    // Create new assignment for the new agent
    const newAssignment = await Assignment.create({
      agent:     newAgentId,
      dealer:    assignment.dealer,
      territory: assignment.territory,
      status:    'active',
      notes:     `Transferred from previous agent. ${transferNote || ''}`,
    });

    res.json({ success: true, oldAssignment: assignment, newAssignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deactivateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

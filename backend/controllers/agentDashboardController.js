const SalesAgent  = require('../models/SalesAgent');
const Lead        = require('../models/Lead');
const VisitReport = require('../models/VisitReport');
const Task        = require('../models/Task');
const Assignment  = require('../models/Assignment');
const DealerOrder = require('../models/DealerOrder');

exports.getAgentDashboard = async (req, res) => {
  try {
    const agentId = req.agent._id;
    const now     = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalLeads,
      wonLeads,
      activeLeads,
      totalVisits,
      visitsThisMonth,
      activeDealers,
      pendingTasks,
      completedTasksThisMonth,
      overdueTasksCount,
      leadsThisMonth,
    ] = await Promise.all([
      Lead.countDocuments({ assignedAgent: agentId, isDeleted: false }),
      Lead.countDocuments({ assignedAgent: agentId, stage: 'won', isDeleted: false }),
      Lead.countDocuments({ assignedAgent: agentId, stage: { $nin: ['won', 'lost'] }, isDeleted: false }),
      VisitReport.countDocuments({ agent: agentId, isDeleted: false }),
      VisitReport.countDocuments({ agent: agentId, status: 'completed', createdAt: { $gte: startOfMonth, $lte: endOfMonth }, isDeleted: false }),
      Assignment.countDocuments({ agent: agentId, status: 'active' }),
      Task.countDocuments({ agent: agentId, status: 'pending', isDeleted: false }),
      Task.countDocuments({ agent: agentId, status: 'completed', completedAt: { $gte: startOfMonth, $lte: endOfMonth }, isDeleted: false }),
      Task.countDocuments({ agent: agentId, status: 'pending', dueDate: { $lt: now }, isDeleted: false }),
      Lead.countDocuments({ assignedAgent: agentId, createdAt: { $gte: startOfMonth, $lte: endOfMonth }, isDeleted: false }),
    ]);

    // Recent visits
    const recentVisits = await VisitReport.find({ agent: agentId, isDeleted: false })
      .populate('dealer', 'businessName dealerCode city')
      .sort({ createdAt: -1 })
      .limit(5);

    // Upcoming tasks
    const upcomingTasks = await Task.find({ agent: agentId, status: 'pending', isDeleted: false })
      .populate('dealer', 'businessName')
      .populate('lead', 'businessName')
      .sort({ dueDate: 1 })
      .limit(5);

    // Hot leads
    const hotLeads = await Lead.find({ assignedAgent: agentId, priority: { $in: ['high', 'urgent'] }, stage: { $nin: ['won', 'lost'] }, isDeleted: false })
      .sort({ updatedAt: -1 })
      .limit(5);

    // Lead stage distribution
    const stageDistribution = await Lead.aggregate([
      { $match: { assignedAgent: agentId, isDeleted: false } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalLeads,
        wonLeads,
        activeLeads,
        leadsThisMonth,
        totalVisits,
        visitsThisMonth,
        activeDealers,
        pendingTasks,
        completedTasksThisMonth,
        overdueTasksCount,
        conversionRate,
      },
      recentVisits,
      upcomingTasks,
      hotLeads,
      stageDistribution,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAssignedDealers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const total = await Assignment.countDocuments({ agent: req.agent._id, status: 'active' });
    const assignments = await Assignment.find({ agent: req.agent._id, status: 'active' })
      .populate('dealer', 'businessName dealerCode city state phone email status')
      .populate('territory', 'name')
      .sort({ assignedAt: -1 })
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

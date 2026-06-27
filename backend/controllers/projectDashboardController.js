'use strict';
const mongoose = require('mongoose');
const { ok, serverError } = require('../utils/response');

const Project      = () => mongoose.model('Project');
const ProjectTask  = () => mongoose.model('ProjectTask');
const Milestone    = () => mongoose.model('Milestone');
const ProjectIssue = () => mongoose.model('ProjectIssue');
const ProjectRisk  = () => mongoose.model('ProjectRisk');
const TimeEntry    = () => mongoose.model('TimeEntry');

// ── Dashboard ─────────────────────────────────────────────────────────────────

exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects,
      totalTasks,
      completedTasks,
      openIssues,
      openRisks,
      hoursResult,
      recentProjects,
      upcomingMilestones,
      statusAgg,
    ] = await Promise.all([
      Project().countDocuments({ isDeleted: false }),
      Project().countDocuments({ status: 'active', isDeleted: false }),
      Project().countDocuments({ status: 'completed', isDeleted: false }),
      Project().countDocuments({ status: 'active', endDate: { $lt: now }, isDeleted: false }),
      ProjectTask().countDocuments({ isDeleted: false }),
      ProjectTask().countDocuments({ status: 'done', isDeleted: false }),
      ProjectIssue().countDocuments({ status: { $in: ['open', 'in_progress'] }, isDeleted: false }),
      ProjectRisk().countDocuments({ status: { $in: ['identified', 'assessed'] }, isDeleted: false }),
      TimeEntry().aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$hours' } } },
      ]),
      Project().find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('projectManager', 'name email')
        .lean(),
      Milestone().find({ status: { $ne: 'achieved' }, dueDate: { $gte: now }, isDeleted: false })
        .sort({ dueDate: 1 })
        .limit(5)
        .populate('project', 'name')
        .lean(),
      Project().aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const totalHoursLogged = hoursResult.length ? hoursResult[0].total : 0;
    const statusBreakdown = statusAgg.map(s => ({ status: s._id, count: s.count }));

    return ok(res, {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects,
      totalTasks,
      completedTasks,
      openIssues,
      openRisks,
      totalHoursLogged,
      recentProjects,
      upcomingMilestones,
      statusBreakdown,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

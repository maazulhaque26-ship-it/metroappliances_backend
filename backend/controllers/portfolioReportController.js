'use strict';
const mongoose = require('mongoose');
const { ok, created, notFound, serverError } = require('../utils/response');
const { emit } = require('../utils/socket');

const Roadmap     = () => mongoose.model('PortfolioRoadmap');
const Milestone   = () => mongoose.model('PortfolioMilestone');
const StatusRep   = () => mongoose.model('PortfolioStatusReport');
const Portfolio   = () => mongoose.model('Portfolio');
const Program     = () => mongoose.model('Program');
const ProgramProj = () => mongoose.model('ProgramProject');
const Risk        = () => mongoose.model('PortfolioRisk');
const Benefit     = () => mongoose.model('PortfolioBenefit');
const Budget      = () => mongoose.model('PortfolioBudget');
const Capacity    = () => mongoose.model('ResourceCapacity');
const Demand      = () => mongoose.model('ResourceDemand');

// ── Roadmap ─────────────────────────────────────────────────────────────────
exports.listRoadmap = async (req, res) => {
  try {
    const docs = await Roadmap().find({ portfolio: req.params.id, isDeleted: false })
      .sort({ order: 1, startDate: 1 }).populate('program', 'name').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createRoadmapItem = async (req, res) => {
  try {
    const doc = await Roadmap().create({ ...req.body, portfolio: req.params.id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateRoadmapItem = async (req, res) => {
  try {
    const doc = await Roadmap().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Roadmap item');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteRoadmapItem = async (req, res) => {
  try {
    const doc = await Roadmap().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Roadmap item');
    return ok(res, { message: 'Roadmap item deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Portfolio Milestones ────────────────────────────────────────────────────
exports.listMilestones = async (req, res) => {
  try {
    const docs = await Milestone().find({ portfolio: req.params.id, isDeleted: false })
      .sort({ dueDate: 1 }).populate('owner', 'name').populate('program', 'name').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createMilestone = async (req, res) => {
  try {
    const doc = await Milestone().create({ ...req.body, portfolio: req.params.id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateMilestone = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.status === 'achieved' && !body.achievedDate) body.achievedDate = new Date();
    const doc = await Milestone().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Milestone');
    if (body.status === 'achieved') {
      emit(req.app.locals.io, 'portfolio:milestone_achieved', { milestoneId: doc._id, portfolioId: doc.portfolio });
    }
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteMilestone = async (req, res) => {
  try {
    const doc = await Milestone().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Milestone');
    return ok(res, { message: 'Milestone deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Status Reports (persisted snapshots) ────────────────────────────────────
exports.listStatusReports = async (req, res) => {
  try {
    const docs = await StatusRep().find({ portfolio: req.params.id, isDeleted: false })
      .sort({ createdAt: -1 }).populate('preparedBy', 'name').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createStatusReport = async (req, res) => {
  try {
    const doc = await StatusRep().create({ ...req.body, portfolio: req.params.id, preparedBy: req.user?._id });
    emit(req.app.locals.io, 'portfolio:status_report_created', { portfolioId: req.params.id, reportId: doc._id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteStatusReport = async (req, res) => {
  try {
    const doc = await StatusRep().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Status report');
    return ok(res, { message: 'Status report deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Report aggregations ─────────────────────────────────────────────────────

// Portfolio Status Report (live computed)
exports.getPortfolioStatusReport = async (req, res) => {
  try {
    const pid = new mongoose.Types.ObjectId(req.params.id);
    const [portfolio, programs, mappings, risks, milestones] = await Promise.all([
      Portfolio().findById(pid).lean(),
      Program().find({ portfolio: pid, isDeleted: false }).lean(),
      ProgramProj().find({ portfolio: pid, isActive: true }).populate('project', 'name status completionPercent').lean(),
      Risk().find({ portfolio: pid, isDeleted: false }).lean(),
      Milestone().find({ portfolio: pid, isDeleted: false }).lean(),
    ]);
    if (!portfolio) return notFound(res, 'Portfolio');
    const projects = mappings.map(m => m.project).filter(Boolean);
    const avgCompletion = projects.length
      ? Math.round(projects.reduce((s, p) => s + (p.completionPercent || 0), 0) / projects.length) : 0;
    return ok(res, {
      portfolio,
      programCount: programs.length,
      projectCount: projects.length,
      avgCompletion,
      openRisks: risks.filter(r => ['identified', 'assessed'].includes(r.status)).length,
      highRisks: risks.filter(r => r.riskScore >= 9).length,
      milestonesAchieved: milestones.filter(m => m.status === 'achieved').length,
      milestonesTotal: milestones.length,
      projects,
    });
  } catch (err) { return serverError(res, err); }
};

// Resource Report
exports.getResourceReport = async (req, res) => {
  try {
    const match = { isDeleted: false };
    if (req.query.portfolio) match.portfolio = new mongoose.Types.ObjectId(req.query.portfolio);
    const [capAgg, demAgg] = await Promise.all([
      Capacity().aggregate([{ $match: match }, { $group: { _id: null, totalCapacity: { $sum: '$availableHours' }, totalAllocated: { $sum: '$allocatedHours' }, count: { $sum: 1 } } }]),
      Demand().aggregate([{ $match: match }, { $group: { _id: null, totalDemand: { $sum: '$demandHours' } } }]),
    ]);
    const cap = capAgg[0] || { totalCapacity: 0, totalAllocated: 0, count: 0 };
    const dem = demAgg[0] || { totalDemand: 0 };
    return ok(res, {
      totalCapacity: cap.totalCapacity,
      totalAllocated: cap.totalAllocated,
      totalDemand: dem.totalDemand,
      resourceCount: cap.count,
      utilization: cap.totalCapacity ? Number(((dem.totalDemand / cap.totalCapacity) * 100).toFixed(1)) : 0,
      gap: cap.totalCapacity - dem.totalDemand,
    });
  } catch (err) { return serverError(res, err); }
};

// Financial Summary (portfolio-wide rollup)
exports.getFinancialReport = async (req, res) => {
  try {
    const match = req.query.portfolio ? { portfolio: new mongoose.Types.ObjectId(req.query.portfolio) } : {};
    const [budgets, benefits] = await Promise.all([
      Budget().find(match).lean(),
      Benefit().find({ ...match, isDeleted: false }).lean(),
    ]);
    const totalBudget = budgets.reduce((s, b) => s + (b.totalBudget || 0), 0);
    const actualSpend = budgets.reduce((s, b) => s + (b.actualSpend || 0), 0);
    const targetBenefit = benefits.reduce((s, b) => s + (b.targetValue || 0), 0);
    const realizedBenefit = benefits.reduce((s, b) => s + (b.realizedValue || 0), 0);
    return ok(res, {
      totalBudget, actualSpend, budgetVariance: totalBudget - actualSpend,
      targetBenefit, realizedBenefit,
      budgetUtilization: totalBudget ? Number(((actualSpend / totalBudget) * 100).toFixed(1)) : 0,
      benefitsRealization: targetBenefit ? Number(((realizedBenefit / targetBenefit) * 100).toFixed(1)) : 0,
    });
  } catch (err) { return serverError(res, err); }
};

// Benefits Report
exports.getBenefitsReport = async (req, res) => {
  try {
    const match = { isDeleted: false };
    if (req.query.portfolio) match.portfolio = new mongoose.Types.ObjectId(req.query.portfolio);
    const byStatus = await Benefit().aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 }, target: { $sum: '$targetValue' }, realized: { $sum: '$realizedValue' } } },
    ]);
    const byType = await Benefit().aggregate([
      { $match: match },
      { $group: { _id: '$type', target: { $sum: '$targetValue' }, realized: { $sum: '$realizedValue' } } },
    ]);
    return ok(res, { byStatus, byType });
  } catch (err) { return serverError(res, err); }
};

// Risk Summary
exports.getRiskSummary = async (req, res) => {
  try {
    const match = { isDeleted: false };
    if (req.query.portfolio) match.portfolio = new mongoose.Types.ObjectId(req.query.portfolio);
    const [byCategory, byStatus, open] = await Promise.all([
      Risk().aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 }, avgScore: { $avg: '$riskScore' } } }]),
      Risk().aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Risk().countDocuments({ ...match, status: { $in: ['identified', 'assessed'] } }),
    ]);
    return ok(res, { byCategory, byStatus, openRisks: open });
  } catch (err) { return serverError(res, err); }
};

// Executive Report (cross-portfolio high-level)
exports.getExecutiveReport = async (req, res) => {
  try {
    const [portfolios, programs, mappings, benefits, risks] = await Promise.all([
      Portfolio().find({ isDeleted: false }).lean(),
      Program().countDocuments({ isDeleted: false }),
      ProgramProj().countDocuments({ isActive: true }),
      Benefit().find({ isDeleted: false }).lean(),
      Risk().countDocuments({ isDeleted: false, status: { $in: ['identified', 'assessed'] } }),
    ]);
    const healthBreakdown = portfolios.reduce((acc, p) => {
      acc[p.health] = (acc[p.health] || 0) + 1; return acc;
    }, {});
    return ok(res, {
      portfolioCount: portfolios.length,
      programCount: programs,
      projectCount: mappings,
      activePortfolios: portfolios.filter(p => p.status === 'active').length,
      totalBudget: portfolios.reduce((s, p) => s + (p.totalBudget || 0), 0),
      targetBenefit: benefits.reduce((s, b) => s + (b.targetValue || 0), 0),
      realizedBenefit: benefits.reduce((s, b) => s + (b.realizedValue || 0), 0),
      openRisks: risks,
      healthBreakdown: Object.entries(healthBreakdown).map(([health, count]) => ({ health, count })),
      avgStrategicAlignment: portfolios.length
        ? Math.round(portfolios.reduce((s, p) => s + (p.strategicAlignment || 0), 0) / portfolios.length) : 0,
    });
  } catch (err) { return serverError(res, err); }
};

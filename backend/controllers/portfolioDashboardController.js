'use strict';
const mongoose = require('mongoose');
const { ok, serverError } = require('../utils/response');

const Portfolio   = () => mongoose.model('Portfolio');
const Program     = () => mongoose.model('Program');
const ProgramProj = () => mongoose.model('ProgramProject');
const Initiative  = () => mongoose.model('StrategicInitiative');
const Risk        = () => mongoose.model('PortfolioRisk');
const Benefit     = () => mongoose.model('PortfolioBenefit');
const Milestone   = () => mongoose.model('PortfolioMilestone');
const Budget      = () => mongoose.model('PortfolioBudget');
const Capacity    = () => mongoose.model('ResourceCapacity');
const Demand      = () => mongoose.model('ResourceDemand');

// ── Portfolio Dashboard ─────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const [total, active, programs, projects, initiatives, openRisks, statusAgg, recent, upcoming] = await Promise.all([
      Portfolio().countDocuments({ isDeleted: false }),
      Portfolio().countDocuments({ isDeleted: false, status: 'active' }),
      Program().countDocuments({ isDeleted: false }),
      ProgramProj().countDocuments({ isActive: true }),
      Initiative().countDocuments({ isDeleted: false }),
      Risk().countDocuments({ isDeleted: false, status: { $in: ['identified', 'assessed'] } }),
      Portfolio().aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Portfolio().find({ isDeleted: false }).sort({ createdAt: -1 }).limit(6)
        .populate('owner', 'name').lean(),
      Milestone().find({ isDeleted: false, status: { $in: ['pending', 'at_risk'] } })
        .sort({ dueDate: 1 }).limit(6).populate('portfolio', 'name').lean(),
    ]);

    return ok(res, {
      kpis: { total, active, programs, projects, initiatives, openRisks },
      statusBreakdown: statusAgg.map(s => ({ status: s._id, count: s.count })),
      recentPortfolios: recent,
      upcomingMilestones: upcoming,
    });
  } catch (err) { return serverError(res, err); }
};

// ── Executive Dashboard ─────────────────────────────────────────────────────
exports.getExecutiveDashboard = async (req, res) => {
  try {
    const [portfolios, budgets, benefits, capAgg, demAgg, healthAgg, milestones] = await Promise.all([
      Portfolio().find({ isDeleted: false }).lean(),
      Budget().find({}).lean(),
      Benefit().find({ isDeleted: false }).lean(),
      Capacity().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, cap: { $sum: '$availableHours' } } }]),
      Demand().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, dem: { $sum: '$demandHours' } } }]),
      Portfolio().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$health', count: { $sum: 1 } } }]),
      Milestone().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const totalBudget   = budgets.reduce((s, b) => s + (b.totalBudget || 0), 0);
    const actualSpend   = budgets.reduce((s, b) => s + (b.actualSpend || 0), 0);
    const targetBenefit = benefits.reduce((s, b) => s + (b.targetValue || 0), 0);
    const realizedBenefit = benefits.reduce((s, b) => s + (b.realizedValue || 0), 0);
    const cap = capAgg[0]?.cap || 0;
    const dem = demAgg[0]?.dem || 0;

    const avgAlignment = portfolios.length
      ? Math.round(portfolios.reduce((s, p) => s + (p.strategicAlignment || 0), 0) / portfolios.length) : 0;
    const avgHealthScore = portfolios.length
      ? Math.round(portfolios.reduce((s, p) => s + (p.healthScore || 0), 0) / portfolios.length) : 0;

    const milestonesAchieved = milestones.find(m => m._id === 'achieved')?.count || 0;
    const milestonesTotal = milestones.reduce((s, m) => s + m.count, 0);

    return ok(res, {
      kpiCards: {
        portfolios: portfolios.length,
        activePortfolios: portfolios.filter(p => p.status === 'active').length,
        totalBudget, actualSpend,
        targetBenefit, realizedBenefit,
        avgStrategicAlignment: avgAlignment,
        avgHealthScore,
      },
      budgetBurn: totalBudget ? Number(((actualSpend / totalBudget) * 100).toFixed(1)) : 0,
      resourceUtilization: cap ? Number(((dem / cap) * 100).toFixed(1)) : 0,
      costVariance: totalBudget - actualSpend,
      benefitsProgress: targetBenefit ? Number(((realizedBenefit / targetBenefit) * 100).toFixed(1)) : 0,
      strategicAlignment: avgAlignment,
      scheduleVariance: milestonesTotal ? Number(((milestonesAchieved / milestonesTotal) * 100).toFixed(1)) : 0,
      healthBreakdown: healthAgg.map(h => ({ health: h._id, count: h.count })),
      portfolioHealth: portfolios.map(p => ({
        _id: p._id, name: p.name, health: p.health, healthScore: p.healthScore,
        strategicAlignment: p.strategicAlignment, status: p.status,
      })),
    });
  } catch (err) { return serverError(res, err); }
};

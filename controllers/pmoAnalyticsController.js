'use strict';
const mongoose = require('mongoose');
const { ok, serverError } = require('../utils/response');

const Project   = () => mongoose.model('Project');
const Scorecard = () => mongoose.model('PMOProjectScorecard');
const Risk      = () => mongoose.model('PortfolioRisk');
const Benefit   = () => mongoose.model('PortfolioBenefit');
const Budget    = () => mongoose.model('PortfolioBudget');
const Forecast  = () => mongoose.model('PortfolioForecast');
const Capacity  = () => mongoose.model('ResourceCapacity');
const Demand    = () => mongoose.model('ResourceDemand');
const Portfolio = () => mongoose.model('Portfolio');
const Program   = () => mongoose.model('Program');
const ProgramProj = () => mongoose.model('ProgramProject');
const Lesson    = () => mongoose.model('PMOLessonsLearned');
const Compliance = () => mongoose.model('PMOComplianceItem');
const Audit     = () => mongoose.model('PMOProjectAudit');
const BusinessCase = () => mongoose.model('PMOBusinessCase');

// ── PMO Executive Dashboard ───────────────────────────────────────────────────
exports.getPMODashboard = async (req, res) => {
  try {
    const [
      totalPortfolios, activePortfolios,
      totalPrograms, totalProjects,
      openRisks, totalBenefits,
      nonCompliant, openAudits,
    ] = await Promise.all([
      Portfolio().countDocuments({ isDeleted: false }),
      Portfolio().countDocuments({ isDeleted: false, status: 'active' }),
      Program().countDocuments({ isDeleted: false }),
      Project().countDocuments({ isDeleted: false }),
      Risk().countDocuments({ isDeleted: false, status: { $in: ['identified', 'assessed', 'mitigating'] } }),
      Benefit().countDocuments({ isDeleted: false }),
      Compliance().countDocuments({ isDeleted: false, status: 'non_compliant' }),
      Audit().countDocuments({ isDeleted: false, status: { $in: ['planned', 'in_progress'] } }),
    ]);

    const [budgets, forecasts, benefits] = await Promise.all([
      Budget().find({ isDeleted: false }).lean(),
      Forecast().find({ isDeleted: false }).lean(),
      Benefit().find({ isDeleted: false }).lean(),
    ]);

    const totalBudget   = budgets.reduce((s, b) => s + (b.totalBudget || 0), 0);
    const actualSpend   = budgets.reduce((s, b) => s + (b.actualSpend || 0), 0);
    const budgetBurn    = totalBudget > 0 ? Math.round((actualSpend / totalBudget) * 100) : 0;
    const targetBenefit = benefits.reduce((s, b) => s + (b.targetValue || 0), 0);
    const realizedBen   = benefits.reduce((s, b) => s + (b.realizedValue || 0), 0);
    const benefitRealization = targetBenefit > 0 ? Math.round((realizedBen / targetBenefit) * 100) : 0;

    const [portfolioHealthBreakdown, projectStatusBreakdown] = await Promise.all([
      Portfolio().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$health', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Project().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);

    const capacities = await Capacity().find({ isDeleted: false }).lean();
    const demands    = await Demand().find({ isDeleted: false, status: 'allocated' }).lean();
    const totalCap   = capacities.reduce((s, c) => s + (c.availableHours || 0), 0);
    const totalDem   = demands.reduce((s, d) => s + (d.demandHours || 0), 0);
    const resourceUtilization = totalCap > 0 ? Math.round((totalDem / totalCap) * 100) : 0;

    const latestScorecards = await Scorecard().aggregate([
      { $match: { isDeleted: false } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$project', spi: { $first: '$spi' }, cpi: { $first: '$cpi' } } },
    ]);
    const avgSPI = latestScorecards.length ? latestScorecards.reduce((s, sc) => s + (sc.spi || 1), 0) / latestScorecards.length : 1;
    const avgCPI = latestScorecards.length ? latestScorecards.reduce((s, sc) => s + (sc.cpi || 1), 0) / latestScorecards.length : 1;

    return ok(res, {
      kpis: {
        totalPortfolios, activePortfolios,
        totalPrograms, totalProjects,
        openRisks, nonCompliant, openAudits,
        totalBudget, actualSpend, budgetBurn,
        targetBenefit, realizedBenefit: realizedBen, benefitRealization,
        resourceUtilization,
        avgSPI: Number(avgSPI.toFixed(2)),
        avgCPI: Number(avgCPI.toFixed(2)),
      },
      portfolioHealthBreakdown,
      projectStatusBreakdown,
    });
  } catch (err) { return serverError(res, err); }
};

// ── EV / SPI / CPI Analytics ─────────────────────────────────────────────────
exports.getEVMAnalytics = async (req, res) => {
  try {
    const { portfolio, program } = req.query;
    const filter = { isDeleted: false };
    if (portfolio) filter.portfolio = portfolio;
    if (program)   filter.program   = program;

    const scorecards = await Scorecard().find(filter)
      .populate('project', 'name projectCode').sort({ period: 1 }).lean();

    const byProject = {};
    for (const sc of scorecards) {
      const key = sc.project?._id?.toString() || sc.project?.toString();
      if (!byProject[key]) {
        byProject[key] = { project: sc.project?.name || key, projectCode: sc.project?.projectCode || '', history: [] };
      }
      byProject[key].history.push({
        period: sc.period,
        spi: sc.spi, cpi: sc.cpi,
        ev: sc.ev, pv: sc.pv, ac: sc.ac,
        bac: sc.bac, eac: sc.eac, etc: sc.etc,
        scheduleVariance: sc.scheduleVariance,
        costVariance: sc.costVariance,
        overallHealth: sc.overallHealth,
      });
    }

    const summary = Object.values(byProject).map(p => {
      const latest = p.history[p.history.length - 1] || {};
      return {
        project: p.project, projectCode: p.projectCode,
        spi: latest.spi || 1, cpi: latest.cpi || 1,
        ev: latest.ev || 0, pv: latest.pv || 0, ac: latest.ac || 0,
        bac: latest.bac || 0, eac: latest.eac || 0, etc: latest.etc || 0,
        scheduleVariance: latest.scheduleVariance || 0,
        costVariance: latest.costVariance || 0,
        health: latest.overallHealth || 'not_assessed',
      };
    });

    const avgSPI = summary.length ? summary.reduce((s, p) => s + p.spi, 0) / summary.length : 1;
    const avgCPI = summary.length ? summary.reduce((s, p) => s + p.cpi, 0) / summary.length : 1;

    return ok(res, {
      summary,
      byProject: Object.values(byProject),
      aggregates: {
        avgSPI: Number(avgSPI.toFixed(2)),
        avgCPI: Number(avgCPI.toFixed(2)),
        totalEV: summary.reduce((s, p) => s + p.ev, 0),
        totalPV: summary.reduce((s, p) => s + p.pv, 0),
        totalAC: summary.reduce((s, p) => s + p.ac, 0),
      },
    });
  } catch (err) { return serverError(res, err); }
};

// ── Risk Exposure Heatmap ─────────────────────────────────────────────────────
exports.getRiskHeatmap = async (req, res) => {
  try {
    const { portfolio } = req.query;
    const filter = { isDeleted: false, status: { $ne: 'closed' } };
    if (portfolio) filter.portfolio = portfolio;

    const risks = await Risk().find(filter).populate('portfolio', 'name').lean();

    const probabilities = ['very_low', 'low', 'medium', 'high', 'very_high'];
    const impacts       = ['very_low', 'low', 'medium', 'high', 'very_high'];

    const matrix = {};
    for (const p of probabilities) {
      matrix[p] = {};
      for (const i of impacts) matrix[p][i] = { count: 0, risks: [] };
    }

    for (const risk of risks) {
      const p = risk.probability;
      const i = risk.impact;
      if (matrix[p] && matrix[p][i]) {
        matrix[p][i].count++;
        matrix[p][i].risks.push({ _id: risk._id, title: risk.title, riskScore: risk.riskScore });
      }
    }

    const byCategory = await Risk().aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 }, avgScore: { $avg: '$riskScore' } } },
      { $sort: { avgScore: -1 } },
    ]);

    const byStatus = await Risk().aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return ok(res, {
      total: risks.length,
      matrix,
      probabilities,
      impacts,
      byCategory,
      byStatus,
      topRisks: risks.sort((a, b) => b.riskScore - a.riskScore).slice(0, 10).map(r => ({
        _id: r._id, title: r.title, riskScore: r.riskScore,
        probability: r.probability, impact: r.impact, status: r.status,
        portfolio: r.portfolio?.name,
      })),
    });
  } catch (err) { return serverError(res, err); }
};

// ── Budget Consumption & Cost Variance ─────────────────────────────────────────
exports.getBudgetAnalytics = async (req, res) => {
  try {
    const budgets   = await Budget().find({ isDeleted: false }).populate('portfolio', 'name health').lean();
    const forecasts = await Forecast().find({ isDeleted: false }).sort({ period: 1 }).lean();

    const portfolioFinance = budgets.map(b => {
      const pForecasts = forecasts.filter(f => f.portfolio?.toString() === b.portfolio?._id?.toString());
      const forecastCost = pForecasts.reduce((s, f) => s + (f.forecastCost || 0), 0);
      const costVariance  = (b.totalBudget || 0) - (b.actualSpend || 0);
      const budgetBurn    = b.totalBudget > 0 ? Math.round((b.actualSpend / b.totalBudget) * 100) : 0;
      return {
        portfolio: b.portfolio?.name || b.portfolio,
        health: b.portfolio?.health,
        totalBudget: b.totalBudget,
        actualSpend: b.actualSpend,
        costVariance,
        budgetBurn,
        forecastCost,
        forecastVariance: (b.totalBudget || 0) - forecastCost,
      };
    });

    const forecastTrend = [];
    const periodMap = {};
    for (const f of forecasts) {
      if (!periodMap[f.period]) periodMap[f.period] = { period: f.period, plannedCost: 0, forecastCost: 0, forecastBenefit: 0 };
      periodMap[f.period].plannedCost    += f.plannedCost    || 0;
      periodMap[f.period].forecastCost   += f.forecastCost   || 0;
      periodMap[f.period].forecastBenefit+= f.forecastBenefit|| 0;
    }
    forecastTrend.push(...Object.values(periodMap).sort((a, b) => a.period.localeCompare(b.period)));

    const totalBudget  = budgets.reduce((s, b) => s + (b.totalBudget || 0), 0);
    const actualSpend  = budgets.reduce((s, b) => s + (b.actualSpend || 0), 0);
    const capexBudget  = budgets.reduce((s, b) => s + (b.capexBudget || 0), 0);
    const opexBudget   = budgets.reduce((s, b) => s + (b.opexBudget || 0), 0);

    return ok(res, {
      summary: {
        totalBudget, actualSpend, capexBudget, opexBudget,
        budgetBurn: totalBudget > 0 ? Math.round((actualSpend / totalBudget) * 100) : 0,
        costVariance: totalBudget - actualSpend,
      },
      portfolioFinance,
      forecastTrend,
    });
  } catch (err) { return serverError(res, err); }
};

// ── Resource Forecast ─────────────────────────────────────────────────────────
exports.getResourceForecast = async (req, res) => {
  try {
    const capacities = await Capacity().find({ isDeleted: false }).sort({ period: 1 }).lean();
    const demands    = await Demand().find({ isDeleted: false }).sort({ period: 1 }).lean();

    const periodMap = {};
    for (const c of capacities) {
      if (!periodMap[c.period]) periodMap[c.period] = { period: c.period, availableHours: 0, allocatedHours: 0, demandHours: 0 };
      periodMap[c.period].availableHours += c.availableHours || 0;
      periodMap[c.period].allocatedHours += c.allocatedHours || 0;
    }
    for (const d of demands) {
      const p = d.period || 'unknown';
      if (!periodMap[p]) periodMap[p] = { period: p, availableHours: 0, allocatedHours: 0, demandHours: 0 };
      periodMap[p].demandHours += d.demandHours || 0;
    }

    const trend = Object.values(periodMap)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(p => ({
        ...p,
        gap: p.availableHours - p.demandHours,
        utilization: p.availableHours > 0 ? Math.round((p.demandHours / p.availableHours) * 100) : 0,
      }));

    const totalAvailable = capacities.reduce((s, c) => s + (c.availableHours || 0), 0);
    const totalDemand    = demands.reduce((s, d) => s + (d.demandHours || 0), 0);

    return ok(res, {
      summary: {
        totalAvailable, totalDemand,
        utilization: totalAvailable > 0 ? Math.round((totalDemand / totalAvailable) * 100) : 0,
        gap: totalAvailable - totalDemand,
        periods: trend.length,
      },
      trend,
    });
  } catch (err) { return serverError(res, err); }
};

// ── Benefits Realization ──────────────────────────────────────────────────────
exports.getBenefitRealization = async (req, res) => {
  try {
    const benefits = await Benefit().find({ isDeleted: false }).populate('portfolio', 'name').lean();

    const byType = await Benefit().aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$benefitType', target: { $sum: '$targetValue' }, realized: { $sum: '$realizedValue' }, count: { $sum: 1 } } },
    ]);

    const byStatus = await Benefit().aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', target: { $sum: '$targetValue' }, realized: { $sum: '$realizedValue' }, count: { $sum: 1 } } },
    ]);

    const targetTotal   = benefits.reduce((s, b) => s + (b.targetValue || 0), 0);
    const realizedTotal = benefits.reduce((s, b) => s + (b.realizedValue || 0), 0);
    const realization   = targetTotal > 0 ? Math.round((realizedTotal / targetTotal) * 100) : 0;

    const portfolioMap = {};
    for (const b of benefits) {
      const key = b.portfolio?._id?.toString() || 'unassigned';
      if (!portfolioMap[key]) {
        portfolioMap[key] = { portfolio: b.portfolio?.name || 'Unassigned', target: 0, realized: 0, count: 0 };
      }
      portfolioMap[key].target   += b.targetValue   || 0;
      portfolioMap[key].realized += b.realizedValue || 0;
      portfolioMap[key].count++;
    }
    const byPortfolio = Object.values(portfolioMap).map(p => ({
      ...p, realization: p.target > 0 ? Math.round((p.realized / p.target) * 100) : 0,
    }));

    return ok(res, {
      summary: { total: benefits.length, targetTotal, realizedTotal, realization },
      byType, byStatus, byPortfolio,
    });
  } catch (err) { return serverError(res, err); }
};

// ── Strategic Alignment Matrix ────────────────────────────────────────────────
exports.getStrategicAlignment = async (req, res) => {
  try {
    const portfolios = await Portfolio().find({ isDeleted: false })
      .select('name status health strategicAlignment category').lean();

    const programs = await Program().find({ isDeleted: false })
      .populate('portfolio', 'name').select('name status completionPercent portfolio').lean();

    const avgAlignment = portfolios.length
      ? Math.round(portfolios.reduce((s, p) => s + (p.strategicAlignment || 0), 0) / portfolios.length)
      : 0;

    const byCategory = await Portfolio().aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$category', avgAlignment: { $avg: '$strategicAlignment' }, count: { $sum: 1 } } },
    ]);

    return ok(res, {
      portfolios: portfolios.map(p => ({
        name: p.name, status: p.status, health: p.health,
        alignment: p.strategicAlignment || 0, category: p.category,
      })),
      programs: programs.map(p => ({
        name: p.name, status: p.status, completion: p.completionPercent,
        portfolio: p.portfolio?.name,
      })),
      summary: {
        avgAlignment,
        totalPortfolios: portfolios.length,
        highAlignment: portfolios.filter(p => (p.strategicAlignment || 0) >= 75).length,
        lowAlignment:  portfolios.filter(p => (p.strategicAlignment || 0) < 50).length,
      },
      byCategory,
    });
  } catch (err) { return serverError(res, err); }
};

// ── PMO Governance Report ────────────────────────────────────────────────────
exports.getGovernanceReport = async (req, res) => {
  try {
    const PMOBoard    = () => mongoose.model('PMOGovernanceBoard');
    const PMODecision = () => mongoose.model('PMODecisionLog');
    const PMOCompliance = () => mongoose.model('PMOComplianceItem');
    const PMOAudit    = () => mongoose.model('PMOProjectAudit');

    const [
      totalBoards, activeBoards,
      totalDecisions, recentDecisions,
      complianceSummary, auditSummary,
    ] = await Promise.all([
      PMOBoard().countDocuments({ isDeleted: false }),
      PMOBoard().countDocuments({ isDeleted: false, status: 'active' }),
      PMODecision().countDocuments({ isDeleted: false }),
      PMODecision().find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5)
        .populate('decisionMaker', 'name').lean(),
      PMOCompliance().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      PMOAudit().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$overallRating', count: { $sum: 1 } } }]),
    ]);

    const decisionsByStatus = await PMODecision().aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return ok(res, {
      governance: { totalBoards, activeBoards, totalDecisions, decisionsByStatus, recentDecisions },
      compliance: { summary: complianceSummary },
      audit: { summary: auditSummary },
    });
  } catch (err) { return serverError(res, err); }
};

// ── Issue Trend (using ProjectRisk as proxy) ──────────────────────────────────
exports.getIssueTrend = async (req, res) => {
  try {
    const ProjectIssue = () => mongoose.model('ProjectIssue');
    const issues = await ProjectIssue().aggregate([
      { $match: { isDeleted: false } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        open: { $sum: { $cond: [{ $in: ['$status', ['open', 'in_progress']] }, 1, 0] } },
      }},
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);
    return ok(res, { trend: issues });
  } catch (err) { return serverError(res, err); }
};

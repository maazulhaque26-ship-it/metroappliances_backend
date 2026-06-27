'use strict';
const mongoose = require('mongoose');
const { ok, created, notFound, serverError } = require('../utils/response');
const { emit } = require('../utils/socket');

const Budget    = () => mongoose.model('PortfolioBudget');
const Forecast  = () => mongoose.model('PortfolioForecast');
const Benefit   = () => mongoose.model('PortfolioBenefit');
const ProgramProj = () => mongoose.model('ProgramProject');
const ProjectCost = () => mongoose.model('ProjectCost');

// ── Budget (one per portfolio, upsert) ──────────────────────────────────────
exports.getBudget = async (req, res) => {
  try {
    const doc = await Budget().findOne({ portfolio: req.params.id }).lean();
    return ok(res, doc || null);
  } catch (err) { return serverError(res, err); }
};

exports.upsertBudget = async (req, res) => {
  try {
    const doc = await Budget().findOneAndUpdate(
      { portfolio: req.params.id },
      { ...req.body, portfolio: req.params.id },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    emit(req.app.locals.io, 'portfolio:budget_updated', { portfolioId: req.params.id });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

// ── Forecast ────────────────────────────────────────────────────────────────
exports.listForecasts = async (req, res) => {
  try {
    const docs = await Forecast().find({ portfolio: req.params.id, isDeleted: false })
      .sort({ period: 1 }).lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createForecast = async (req, res) => {
  try {
    const doc = await Forecast().create({ ...req.body, portfolio: req.params.id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateForecast = async (req, res) => {
  try {
    const doc = await Forecast().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Forecast');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteForecast = async (req, res) => {
  try {
    const doc = await Forecast().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Forecast');
    return ok(res, { message: 'Forecast deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Benefits ────────────────────────────────────────────────────────────────
exports.listBenefits = async (req, res) => {
  try {
    const docs = await Benefit().find({ portfolio: req.params.id, isDeleted: false })
      .sort({ createdAt: -1 }).populate('owner', 'name').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createBenefit = async (req, res) => {
  try {
    const doc = await Benefit().create({ ...req.body, portfolio: req.params.id });
    emit(req.app.locals.io, 'portfolio:benefit_created', { portfolioId: req.params.id, benefitId: doc._id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateBenefit = async (req, res) => {
  try {
    const doc = await Benefit().findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Benefit');
    Object.assign(doc, req.body);
    await doc.save();   // triggers progress recompute
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteBenefit = async (req, res) => {
  try {
    const doc = await Benefit().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Benefit');
    return ok(res, { message: 'Benefit deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Cost rollup from Sprint 15A ProjectCost across the portfolio's projects ──
async function rollupActualCost(portfolioId) {
  const mappings = await ProgramProj().find({ portfolio: portfolioId, isActive: true }).select('project').lean();
  const projectIds = mappings.map(m => m.project).filter(Boolean);
  if (!projectIds.length) return 0;
  const agg = await ProjectCost().aggregate([
    { $match: { project: { $in: projectIds }, isDeleted: { $ne: true } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return agg.length ? agg[0].total : 0;
}

// ── Financial summary: ROI, NPV, planned vs actual, health ──────────────────
exports.getFinancialSummary = async (req, res) => {
  try {
    const portfolioId = new mongoose.Types.ObjectId(req.params.id);
    const [budget, forecasts, benefits, actualCost] = await Promise.all([
      Budget().findOne({ portfolio: portfolioId }).lean(),
      Forecast().find({ portfolio: portfolioId, isDeleted: false }).lean(),
      Benefit().find({ portfolio: portfolioId, isDeleted: false }).lean(),
      rollupActualCost(portfolioId),
    ]);

    const totalBudget   = budget ? budget.totalBudget : 0;
    const plannedCost   = forecasts.reduce((s, f) => s + (f.plannedCost || 0), 0);
    const forecastCost  = forecasts.reduce((s, f) => s + (f.forecastCost || 0), 0);
    const realizedBenefit = benefits.reduce((s, b) => s + (b.realizedValue || 0), 0);
    const targetBenefit   = benefits.reduce((s, b) => s + (b.targetValue || 0), 0);

    // ROI = (benefit - cost) / cost
    const costBasis = actualCost || forecastCost || plannedCost || totalBudget;
    const roi = costBasis ? Number((((realizedBenefit - costBasis) / costBasis) * 100).toFixed(2)) : 0;

    // NPV across forecast periods using a fixed discount rate (10% annual / period order).
    const discountRate = 0.10;
    const sortedFc = [...forecasts].sort((a, b) => String(a.period).localeCompare(String(b.period)));
    const npv = Number(sortedFc.reduce((acc, f, idx) => {
      const net = (f.forecastBenefit || 0) - (f.forecastCost || 0);
      return acc + net / Math.pow(1 + discountRate, idx + 1);
    }, 0).toFixed(2));

    // Budget burn / variance
    const budgetBurn = totalBudget ? Number(((actualCost / totalBudget) * 100).toFixed(1)) : 0;
    const costVariance = plannedCost - actualCost;
    const benefitVariance = realizedBenefit - targetBenefit;

    let health = 'on_track';
    if (budgetBurn > 100 || roi < 0) health = 'off_track';
    else if (budgetBurn > 85) health = 'at_risk';

    return ok(res, {
      totalBudget, plannedCost, forecastCost, actualCost,
      targetBenefit, realizedBenefit,
      roi, npv, budgetBurn, costVariance, benefitVariance, health,
      benefitsRealizationPercent: targetBenefit ? Number(((realizedBenefit / targetBenefit) * 100).toFixed(1)) : 0,
    });
  } catch (err) { return serverError(res, err); }
};

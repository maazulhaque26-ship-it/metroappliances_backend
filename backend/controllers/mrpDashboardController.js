'use strict';
const MRPRun              = require('../models/MRPRun');
const MaterialRequirement = require('../models/MaterialRequirement');
const MaterialShortage    = require('../models/MaterialShortage');
const MRPReservation      = require('../models/MRPReservation');
const PurchaseSuggestion  = require('../models/PurchaseSuggestion');
const ProductionRequirement = require('../models/ProductionRequirement');
const DemandForecast      = require('../models/DemandForecast');
const InventoryProjection = require('../models/InventoryProjection');
const { ok, serverError }  = require('../utils/response');

exports.getDashboard = async (req, res) => {
  try {
    const now  = new Date();
    const d30  = new Date(now); d30.setDate(d30.getDate() - 30);

    const [
      totalRuns, activeShortages, criticalShortages, pendingPurchase,
      pendingProd, totalReservations, recentRuns, shortagesByMaterial,
      forecastAccuracy,
    ] = await Promise.all([
      MRPRun.countDocuments({ isDeleted: false }),
      MaterialShortage.countDocuments({ status: 'open', isDeleted: false }),
      MaterialShortage.countDocuments({ status: 'open', severity: 'critical', isDeleted: false }),
      PurchaseSuggestion.countDocuments({ status: 'pending', isDeleted: false }),
      ProductionRequirement.countDocuments({ status: 'pending', isDeleted: false }),
      MRPReservation.countDocuments({ status: 'active', isDeleted: false }),
      MRPRun.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5).select('runNumber status runType createdAt totalShortages totalRequirements durationMs'),
      MaterialShortage.aggregate([
        { $match: { status: 'open', isDeleted: false } },
        { $group: { _id: '$severity', count: { $sum: 1 }, totalQty: { $sum: '$shortageQty' } } },
        { $sort: { _id: 1 } },
      ]),
      DemandForecast.aggregate([
        { $match: { isDeleted: false, isApproved: true, actualQty: { $gt: 0 } } },
        { $group: { _id: null, avgAccuracy: { $avg: '$accuracy' } } },
      ]),
    ]);

    const kpis = {
      totalRuns,
      activeShortages,
      criticalShortages,
      pendingPurchaseSuggestions: pendingPurchase,
      pendingProductionReqs: pendingProd,
      totalReservations,
      avgForecastAccuracy: forecastAccuracy[0]?.avgAccuracy ? Math.round(forecastAccuracy[0].avgAccuracy * 10) / 10 : 0,
    };

    const shortageMap = {};
    for (const s of shortagesByMaterial) shortageMap[s._id] = { count: s.count, totalQty: s.totalQty };

    return ok(res, { kpis, recentRuns, shortagesBySeverity: shortageMap });
  } catch (err) { return serverError(res, err); }
};

exports.getShortageReport = async (req, res) => {
  try {
    const { mrpRun } = req.query;
    const filter = { status: 'open', isDeleted: false };
    if (mrpRun) filter.mrpRun = mrpRun;
    const [bySeverity, byMaterial, total] = await Promise.all([
      MaterialShortage.aggregate([
        { $match: filter },
        { $group: { _id: '$severity', count: { $sum: 1 }, totalShortageQty: { $sum: '$shortageQty' } } },
        { $sort: { _id: 1 } },
      ]),
      MaterialShortage.find(filter).sort({ severity: -1, shortageQty: -1 }).limit(20).populate('material', 'name sku'),
      MaterialShortage.countDocuments(filter),
    ]);
    return ok(res, { total, bySeverity, topShortages: byMaterial });
  } catch (err) { return serverError(res, err); }
};

exports.getInventoryRiskReport = async (req, res) => {
  try {
    const { mrpRun } = req.query;
    const filter = { isDeleted: false };
    if (mrpRun) filter.mrpRun = mrpRun;
    else {
      const latest = await MRPRun.findOne({ status: 'completed', isDeleted: false }).sort({ createdAt: -1 });
      if (latest) filter.mrpRun = latest._id;
    }
    const [belowSafety, belowReorder, all] = await Promise.all([
      InventoryProjection.find({ ...filter, isBelowSafety: true }).sort({ projectedQty: 1 }).limit(20).populate('material', 'name sku'),
      InventoryProjection.find({ ...filter, isBelowReorder: true }).sort({ projectedQty: 1 }).limit(20).populate('material', 'name sku'),
      InventoryProjection.countDocuments(filter),
    ]);
    return ok(res, { total: all, belowSafetyCount: belowSafety.length, belowReorderCount: belowReorder.length, belowSafety, belowReorder });
  } catch (err) { return serverError(res, err); }
};

exports.getForecastAccuracyReport = async (req, res) => {
  try {
    const { factory, forecastPeriod } = req.query;
    const match = { isDeleted: false, isApproved: true, actualQty: { $gt: 0 } };
    if (factory)        match.factory        = factory;
    if (forecastPeriod) match.forecastPeriod = forecastPeriod;
    const data = await DemandForecast.aggregate([
      { $match: match },
      { $group: {
        _id: { period: '$forecastPeriod', method: '$method' },
        avgAccuracy:  { $avg: '$accuracy' },
        totalForecasts: { $sum: 1 },
        avgForecastQty: { $avg: '$forecastQty' },
        avgActualQty:   { $avg: '$actualQty' },
      }},
      { $sort: { '_id.period': 1 } },
    ]);
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

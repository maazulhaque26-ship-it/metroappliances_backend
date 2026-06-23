'use strict';
const Asset                = require('../models/Asset');
const MaintenanceWorkOrder = require('../models/MaintenanceWorkOrder');
const MaintenanceSchedule  = require('../models/MaintenanceSchedule');
const BreakdownRecord      = require('../models/BreakdownRecord');
const ConditionMonitoring  = require('../models/ConditionMonitoring');
const PredictiveMaintenance = require('../models/PredictiveMaintenance');
const PreventiveMaintenance = require('../models/PreventiveMaintenance');
const AssetMeter           = require('../models/AssetMeter');
const MaintenanceLog       = require('../models/MaintenanceLog');
const MaintenanceHistory   = require('../models/MaintenanceHistory');
const VendorMaintenance    = require('../models/VendorMaintenance');
const AssetRiskAssessment  = require('../models/AssetRiskAssessment');
const { success, serverError } = require('../utils/response');

exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalAssets,
      activeAssets,
      assetsInBreakdown,
      assetsByStatus,
      openWorkOrders,
      overdueSchedules,
      upcomingSchedules,
      recentBreakdowns,
      criticalAlerts,
      workOrdersByStatus,
      pmCompliance,
      highRiskAssets,
      recentWorkOrders,
      mttrData,
      costData,
    ] = await Promise.all([
      Asset.countDocuments({ isDeleted: false }),
      Asset.countDocuments({ isDeleted: false, status: 'operational' }),
      Asset.countDocuments({ isDeleted: false, status: 'breakdown' }),
      Asset.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      MaintenanceWorkOrder.countDocuments({ isDeleted: false, status: { $in: ['draft','planned','approved','assigned','in_progress','paused'] } }),
      MaintenanceSchedule.countDocuments({ isDeleted: false, status: 'overdue' }),
      MaintenanceSchedule.countDocuments({ isDeleted: false, status: 'scheduled', scheduledDate: { $lte: sevenDaysAhead, $gte: now } }),
      BreakdownRecord.countDocuments({ isDeleted: false, breakdownDate: { $gte: thirtyDaysAgo } }),
      ConditionMonitoring.countDocuments({ isDeleted: false, currentState: { $in: ['warning','critical'] } }),
      MaintenanceWorkOrder.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      PreventiveMaintenance.aggregate([
        { $match: { isDeleted: false, scheduledDate: { $lte: now } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      AssetRiskAssessment.countDocuments({ isDeleted: false, overallRisk: { $in: ['high','critical'] }, status: 'active' }),
      MaintenanceWorkOrder.find({ isDeleted: false })
        .populate('asset', 'name assetNumber')
        .sort({ createdAt: -1 }).limit(5),
      BreakdownRecord.aggregate([
        { $match: { isDeleted: false, status: 'resolved', breakdownDate: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, avgMttr: { $avg: '$mttrHours' }, totalDowntime: { $sum: '$downtimeHours' } } },
      ]),
      MaintenanceHistory.aggregate([
        { $match: { isDeleted: false, performedDate: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, totalCost: { $sum: '$totalCost' } } },
      ]),
    ]);

    // PM compliance rate
    const pmTotal = pmCompliance.reduce((a, b) => a + b.count, 0);
    const pmCompleted = (pmCompliance.find(p => p._id === 'completed') || { count: 0 }).count;
    const pmComplianceRate = pmTotal > 0 ? Math.round((pmCompleted / pmTotal) * 100) : 0;

    const mttr = mttrData[0] || { avgMttr: 0, totalDowntime: 0 };

    return success(res, {
      summary: {
        totalAssets, activeAssets, assetsInBreakdown,
        openWorkOrders, overdueSchedules, upcomingSchedules,
        recentBreakdowns, criticalAlerts, highRiskAssets,
      },
      assetsByStatus,
      workOrdersByStatus,
      pmComplianceRate,
      mttr: { avgMttrHours: Math.round((mttr.avgMttr || 0) * 10) / 10, totalDowntimeHours: Math.round(mttr.totalDowntime || 0) },
      maintenanceCost30d: (costData[0] || { totalCost: 0 }).totalCost,
      recentWorkOrders,
    });
  } catch (e) { return serverError(res, e.message); }
};

exports.getAssetReliability = async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const data = await BreakdownRecord.aggregate([
      { $match: { isDeleted: false, breakdownDate: { $gte: since } } },
      { $group: {
        _id: '$asset',
        breakdownCount: { $sum: 1 },
        totalDowntime: { $sum: '$downtimeHours' },
        avgMttr: { $avg: '$mttrHours' },
        totalRepairCost: { $sum: '$repairCost' },
      }},
      { $sort: { breakdownCount: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'assets', localField: '_id', foreignField: '_id', as: 'asset' } },
      { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },
      { $project: {
        assetName: '$asset.name', assetNumber: '$asset.assetNumber',
        breakdownCount: 1, totalDowntime: 1, avgMttr: 1, totalRepairCost: 1,
      }},
    ]);
    return success(res, data);
  } catch (e) { return serverError(res, e.message); }
};

exports.getMaintenanceTrend = async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const data = await MaintenanceWorkOrder.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: since } } },
      { $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          maintenanceType: '$maintenanceType',
        },
        count: { $sum: 1 },
        totalCost: { $sum: '$totalCost' },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    return success(res, data);
  } catch (e) { return serverError(res, e.message); }
};

exports.getBreakdownAnalysis = async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const [byMode, bySeverity, trend] = await Promise.all([
      BreakdownRecord.aggregate([
        { $match: { isDeleted: false, breakdownDate: { $gte: since } } },
        { $group: { _id: '$failureMode', count: { $sum: 1 }, totalDowntime: { $sum: '$downtimeHours' } } },
        { $sort: { count: -1 } },
      ]),
      BreakdownRecord.aggregate([
        { $match: { isDeleted: false, breakdownDate: { $gte: since } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      BreakdownRecord.aggregate([
        { $match: { isDeleted: false, breakdownDate: { $gte: since } } },
        { $group: {
          _id: { year: { $year: '$breakdownDate' }, month: { $month: '$breakdownDate' } },
          count: { $sum: 1 },
          totalDowntime: { $sum: '$downtimeHours' },
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);
    return success(res, { byMode, bySeverity, trend });
  } catch (e) { return serverError(res, e.message); }
};

exports.getCostAnalysis = async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const [byType, topAssets, trend] = await Promise.all([
      MaintenanceWorkOrder.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: since }, totalCost: { $gt: 0 } } },
        { $group: { _id: '$maintenanceType', totalCost: { $sum: '$totalCost' }, count: { $sum: 1 } } },
        { $sort: { totalCost: -1 } },
      ]),
      MaintenanceWorkOrder.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: since }, totalCost: { $gt: 0 } } },
        { $group: { _id: '$asset', totalCost: { $sum: '$totalCost' }, count: { $sum: 1 } } },
        { $sort: { totalCost: -1 } }, { $limit: 10 },
        { $lookup: { from: 'assets', localField: '_id', foreignField: '_id', as: 'asset' } },
        { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },
        { $project: { assetName: '$asset.name', assetNumber: '$asset.assetNumber', totalCost: 1, count: 1 } },
      ]),
      MaintenanceWorkOrder.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: since } } },
        { $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          laborCost: { $sum: '$laborCost' },
          materialCost: { $sum: '$materialCost' },
          totalCost: { $sum: '$totalCost' },
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);
    return success(res, { byType, topAssets, trend });
  } catch (e) { return serverError(res, e.message); }
};

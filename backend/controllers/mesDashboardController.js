'use strict';
const WorkOrder           = require('../models/WorkOrder');
const ProductionExecution = require('../models/ProductionExecution');
const QualityInspection   = require('../models/QualityInspection');
const QualityDefect       = require('../models/QualityDefect');
const MachineDowntime     = require('../models/MachineDowntime');
const OEERecord           = require('../models/OEERecord');
const LaborTracking       = require('../models/LaborTracking');
const ProductionScrap     = require('../models/ProductionScrap');
const ProductionRework    = require('../models/ProductionRework');
const ProductionEvent     = require('../models/ProductionEvent');
const ToolManagement      = require('../models/ToolManagement');
const MaintenanceTrigger  = require('../models/MaintenanceTrigger');
const mongoose            = require('mongoose');
const { ok, serverError }  = require('../utils/response');

exports.getDashboard = async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const weekStart  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalWorkOrders, activeWorkOrders, completedToday, overdueWorkOrders,
      openDowntimes, avgOEEResult, pendingInspections, criticalDefects,
      pendingMaintenance, availableTools, openShortages,
    ] = await Promise.all([
      WorkOrder.countDocuments({ isDeleted: false }),
      WorkOrder.countDocuments({ isDeleted: false, status: { $in: ['released','started','paused'] } }),
      WorkOrder.countDocuments({ isDeleted: false, status: 'completed', updatedAt: { $gte: todayStart, $lte: todayEnd } }),
      WorkOrder.countDocuments({ isDeleted: false, status: { $in: ['released','started'] }, plannedEndDate: { $lt: new Date() } }),
      MachineDowntime.countDocuments({ isDeleted: false, status: { $in: ['open','in_progress'] } }),
      OEERecord.aggregate([{ $match: { isDeleted: false, date: { $gte: weekStart } } }, { $group: { _id: null, avgOEE: { $avg: '$oee' }, avgAvailability: { $avg: '$availability' }, avgPerformance: { $avg: '$performance' }, avgQuality: { $avg: '$quality' } } }]),
      QualityInspection.countDocuments({ isDeleted: false, result: 'pending' }),
      QualityDefect.countDocuments({ isDeleted: false, severity: 'critical', disposition: 'pending' }),
      MaintenanceTrigger.countDocuments({ isDeleted: false, status: { $in: ['triggered','overdue'] } }),
      ToolManagement.countDocuments({ isDeleted: false, status: 'available' }),
      MachineDowntime.countDocuments({ isDeleted: false, status: 'open' }),
    ]);

    const oeeStats = avgOEEResult[0] || { avgOEE: 0, avgAvailability: 0, avgPerformance: 0, avgQuality: 0 };

    const recentEvents = await ProductionEvent.find({ isDeleted: false, createdAt: { $gte: todayStart } })
      .sort({ createdAt: -1 }).limit(10).populate('workOrder', 'orderNumber').populate('machine', 'name');

    return ok(res, {
      workOrders: { total: totalWorkOrders, active: activeWorkOrders, completedToday, overdue: overdueWorkOrders },
      oee: { avgOEE: Math.round((oeeStats.avgOEE || 0) * 10) / 10, avgAvailability: Math.round((oeeStats.avgAvailability || 0) * 10) / 10, avgPerformance: Math.round((oeeStats.avgPerformance || 0) * 10) / 10, avgQuality: Math.round((oeeStats.avgQuality || 0) * 10) / 10 },
      quality: { pendingInspections, criticalDefects },
      downtime: { openDowntimes, openShortages },
      maintenance: { pendingMaintenance },
      tools: { available: availableTools },
      recentEvents,
    });
  } catch (err) { return serverError(res, err); }
};

exports.getProductionTrend = async (req, res) => {
  try {
    const { days = 30, factory } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const match = { isDeleted: false, createdAt: { $gte: since } };
    if (factory) match.factory = mongoose.Types.ObjectId(factory);
    const trend = await WorkOrder.aggregate([
      { $match: { ...match } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, created: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status','completed'] }, 1, 0] } }, totalPlanned: { $sum: '$plannedQty' }, totalCompleted: { $sum: '$completedQty' } } },
      { $sort: { _id: 1 } },
    ]);
    return ok(res, trend);
  } catch (err) { return serverError(res, err); }
};

exports.getOEETrend = async (req, res) => {
  try {
    const { days = 30, machine, factory } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const match = { isDeleted: false, date: { $gte: since } };
    if (machine) match.machine = mongoose.Types.ObjectId(machine);
    if (factory) match.factory = mongoose.Types.ObjectId(factory);
    const trend = await OEERecord.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, avgOEE: { $avg: '$oee' }, avgAvailability: { $avg: '$availability' }, avgPerformance: { $avg: '$performance' }, avgQuality: { $avg: '$quality' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return ok(res, trend);
  } catch (err) { return serverError(res, err); }
};

exports.getDowntimeAnalysis = async (req, res) => {
  try {
    const { days = 30, factory } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const match = { isDeleted: false, startTime: { $gte: since } };
    if (factory) match.factory = mongoose.Types.ObjectId(factory);
    const [byReason, byCategory, timeline] = await Promise.all([
      MachineDowntime.aggregate([{ $match: match }, { $group: { _id: '$reason', count: { $sum: 1 }, totalMins: { $sum: '$durationMins' } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      MachineDowntime.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 }, totalMins: { $sum: '$durationMins' } } }]),
      MachineDowntime.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } }, count: { $sum: 1 }, totalMins: { $sum: '$durationMins' } } }, { $sort: { _id: 1 } }]),
    ]);
    return ok(res, { byReason, byCategory, timeline });
  } catch (err) { return serverError(res, err); }
};

exports.getQualityTrend = async (req, res) => {
  try {
    const { days = 30, factory } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const match = { isDeleted: false, createdAt: { $gte: since } };
    if (factory) match.factory = mongoose.Types.ObjectId(factory);
    const [inspectionTrend, defectsByCategory, scrapTrend] = await Promise.all([
      QualityInspection.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, pass: { $sum: { $cond: [{ $eq: ['$result','pass'] }, 1, 0] } }, fail: { $sum: { $cond: [{ $eq: ['$result','fail'] }, 1, 0] } }, total: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      QualityDefect.aggregate([{ $match: match }, { $group: { _id: '$defectCategory', count: { $sum: 1 }, critical: { $sum: { $cond: [{ $eq: ['$severity','critical'] }, 1, 0] } } } }, { $sort: { count: -1 } }]),
      ProductionScrap.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, qty: { $sum: '$qty' }, value: { $sum: '$scrapValue' } } }, { $sort: { _id: 1 } }]),
    ]);
    return ok(res, { inspectionTrend, defectsByCategory, scrapTrend });
  } catch (err) { return serverError(res, err); }
};

exports.getLaborReport = async (req, res) => {
  try {
    const { days = 30, factory } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const match = { isDeleted: false, date: { $gte: since } };
    if (factory) match.factory = mongoose.Types.ObjectId(factory);
    const [summary, trend] = await Promise.all([
      LaborTracking.aggregate([{ $match: match }, { $group: { _id: null, totalHours: { $sum: '$hoursWorked' }, totalOT: { $sum: '$overtimeHours' }, avgEfficiency: { $avg: '$efficiencyPct' }, totalCost: { $sum: '$totalLaborCost' }, totalUnits: { $sum: '$unitsProduced' } } }]),
      LaborTracking.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, totalHours: { $sum: '$hoursWorked' }, avgEfficiency: { $avg: '$efficiencyPct' }, totalUnits: { $sum: '$unitsProduced' } } }, { $sort: { _id: 1 } }]),
    ]);
    return ok(res, { summary: summary[0] || {}, trend });
  } catch (err) { return serverError(res, err); }
};

exports.getProductionEvents = async (req, res) => {
  try {
    const { page = 1, limit = 50, factory, severity, eventType, workOrder, machine, dateFrom, dateTo } = req.query;
    const filter = { isDeleted: false };
    if (factory)   filter.factory   = factory;
    if (severity)  filter.severity  = severity;
    if (eventType) filter.eventType = eventType;
    if (workOrder) filter.workOrder = workOrder;
    if (machine)   filter.machine   = machine;
    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) filter.timestamp.$gte = new Date(dateFrom);
      if (dateTo)   filter.timestamp.$lte = new Date(dateTo);
    }
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await ProductionEvent.countDocuments(filter);
    const data  = await ProductionEvent.find(filter).sort({ timestamp: -1 }).skip(skip).limit(Number(limit))
      .populate('workOrder', 'orderNumber').populate('machine', 'name').populate('factory', 'name');
    const { paginated } = require('../utils/response');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

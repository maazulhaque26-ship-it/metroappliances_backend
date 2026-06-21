const ServiceRequest = require('../models/ServiceRequest');
const WarrantyCard   = require('../models/WarrantyCard');
const AMCContract    = require('../models/AMCContract');
const Technician     = require('../models/Technician');
const SparePart      = require('../models/SparePart');
const { ok, serverError } = require('../utils/response');

const dateRange = (from, to) => ({
  $gte: new Date(from || Date.now() - 30 * 86400000),
  $lte: new Date(to   || Date.now()),
});

// ── Service Request Summary ───────────────────────────────────────────────────
exports.getServiceSummaryReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to);

    const [total, completed, escalated, cancelled, open] = await Promise.all([
      ServiceRequest.countDocuments({ isDeleted: false, createdAt: range }),
      ServiceRequest.countDocuments({ isDeleted: false, createdAt: range, status: { $in: ['completed','closed'] } }),
      ServiceRequest.countDocuments({ isDeleted: false, createdAt: range, 'escalation.isEscalated': true }),
      ServiceRequest.countDocuments({ isDeleted: false, createdAt: range, status: 'cancelled' }),
      ServiceRequest.countDocuments({ isDeleted: false, createdAt: range, status: 'open' }),
    ]);

    const resolutionData = await ServiceRequest.aggregate([
      { $match: { isDeleted: false, createdAt: range, status: { $in: ['completed','closed'] }, closedAt: { $exists: true } } },
      { $project: { resolutionHours: { $divide: [{ $subtract: ['$closedAt', '$createdAt'] }, 3600000] } } },
      { $group: { _id: null, avg: { $avg: '$resolutionHours' }, min: { $min: '$resolutionHours' }, max: { $max: '$resolutionHours' } } },
    ]);

    const byPriority = await ServiceRequest.aggregate([
      { $match: { isDeleted: false, createdAt: range } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const byCategory = await ServiceRequest.aggregate([
      { $match: { isDeleted: false, createdAt: range } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const avgResolution = resolutionData[0] || { avg: 0, min: 0, max: 0 };

    return ok(res, {
      total, completed, open, escalated, cancelled,
      resolutionRate: total ? +((completed / total) * 100).toFixed(1) : 0,
      avgResolutionHours: +avgResolution.avg.toFixed(1),
      minResolutionHours: +avgResolution.min.toFixed(1),
      maxResolutionHours: +avgResolution.max.toFixed(1),
      byPriority,
      byCategory,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Technician Performance ────────────────────────────────────────────────────
exports.getTechnicianPerformanceReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to);

    const data = await ServiceRequest.aggregate([
      { $match: { isDeleted: false, createdAt: range, assignedTechnician: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTechnician',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $in: ['$status', ['completed','closed']] }, 1, 0] } },
          escalated: { $sum: { $cond: ['$escalation.isEscalated', 1, 0] } },
          avgRating: { $avg: '$customerRating' },
          avgResHours: {
            $avg: {
              $cond: [
                { $and: ['$closedAt', { $in: ['$status', ['completed','closed']] }] },
                { $divide: [{ $subtract: ['$closedAt', '$createdAt'] }, 3600000] },
                null,
              ],
            },
          },
        },
      },
      {
        $lookup: { from: 'technicians', localField: '_id', foreignField: '_id', as: 'tech' },
      },
      { $unwind: '$tech' },
      {
        $project: {
          name: '$tech.name', employeeId: '$tech.employeeId',
          total: 1, completed: 1, escalated: 1,
          completionRate: { $multiply: [{ $divide: ['$completed', { $max: ['$total', 1] }] }, 100] },
          avgRating: { $round: ['$avgRating', 2] },
          avgResHours: { $round: ['$avgResHours', 1] },
        },
      },
      { $sort: { completed: -1 } },
    ]);

    return ok(res, { technicians: data });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── FTFR (First Time Fix Rate) ────────────────────────────────────────────────
exports.getFTFRReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to);

    const completed = await ServiceRequest.countDocuments({
      isDeleted: false, createdAt: range, status: { $in: ['completed','closed'] },
    });
    // FTFR = completed without reopened or escalated
    const ftfr = await ServiceRequest.countDocuments({
      isDeleted: false, createdAt: range,
      status: { $in: ['completed','closed'] },
      'escalation.isEscalated': false,
    });
    const rate = completed ? +((ftfr / completed) * 100).toFixed(1) : 0;

    return ok(res, { totalCompleted: completed, firstTimeFix: ftfr, ftfrRate: rate });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Warranty Claims ───────────────────────────────────────────────────────────
exports.getWarrantyClaimsReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to);

    const warrantyJobs = await ServiceRequest.countDocuments({
      isDeleted: false, createdAt: range, isUnderWarranty: true,
    });
    const amcJobs = await ServiceRequest.countDocuments({
      isDeleted: false, createdAt: range, isUnderAMC: true,
    });
    const paidJobs = await ServiceRequest.countDocuments({
      isDeleted: false, createdAt: range,
      isUnderWarranty: false, isUnderAMC: false,
    });

    const byType = await WarrantyCard.aggregate([
      { $match: { isDeleted: false, createdAt: range } },
      { $group: { _id: '$warrantyType', count: { $sum: 1 } } },
    ]);

    return ok(res, { warrantyJobs, amcJobs, paidJobs, byType });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── CSAT / Customer Satisfaction ─────────────────────────────────────────────
exports.getCSATReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to);

    const rated = await ServiceRequest.find({
      isDeleted: false, createdAt: range, customerRating: { $exists: true, $ne: null },
    }).select('customerRating');

    const total = rated.length;
    const avg = total ? +(rated.reduce((s, r) => s + r.customerRating, 0) / total).toFixed(2) : 0;
    const dist = [1,2,3,4,5].map(n => ({
      rating: n,
      count: rated.filter(r => r.customerRating === n).length,
    }));
    const promoters = rated.filter(r => r.customerRating >= 4).length;
    const csat = total ? +((promoters / total) * 100).toFixed(1) : 0;

    return ok(res, { total, avgRating: avg, csat, distribution: dist });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Spare Parts Consumption ───────────────────────────────────────────────────
exports.getPartsConsumptionReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to);

    const data = await SparePart.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: { path: '$consumptionLogs', preserveNullAndEmptyArrays: false } },
      { $match: { 'consumptionLogs.usedAt': range } },
      {
        $group: {
          _id: '$_id',
          partNumber: { $first: '$partNumber' },
          name: { $first: '$name' },
          category: { $first: '$category' },
          totalUsed: { $sum: '$consumptionLogs.quantity' },
          totalValue: { $sum: { $multiply: ['$consumptionLogs.quantity', '$unitPrice'] } },
        },
      },
      { $sort: { totalUsed: -1 } },
      { $limit: 20 },
    ]);

    const lowStock = await SparePart.countDocuments({
      isDeleted: false, isActive: true,
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
    });

    return ok(res, { topParts: data, lowStockCount: lowStock });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── SLA Compliance ────────────────────────────────────────────────────────────
exports.getSLAReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to);

    const total = await ServiceRequest.countDocuments({ isDeleted: false, createdAt: range });
    const breached = await ServiceRequest.countDocuments({
      isDeleted: false, createdAt: range, 'sla.isBreached': true,
    });
    const complianceRate = total ? +(((total - breached) / total) * 100).toFixed(1) : 100;

    return ok(res, { total, breached, compliant: total - breached, complianceRate });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── AMC Revenue ───────────────────────────────────────────────────────────────
exports.getAMCRevenueReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to);

    const amcs = await AMCContract.find({ isDeleted: false, createdAt: range });
    const totalRevenue = amcs.reduce((s, a) => s + (a.paidAmount || 0), 0);
    const pendingRevenue = amcs.reduce((s, a) => s + (a.amount - (a.paidAmount || 0)), 0);

    const byStatus = await AMCContract.aggregate([
      { $match: { isDeleted: false, createdAt: range } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$paidAmount' } } },
    ]);

    return ok(res, { totalContracts: amcs.length, totalRevenue, pendingRevenue, byStatus });
  } catch (err) {
    return serverError(res, err);
  }
};

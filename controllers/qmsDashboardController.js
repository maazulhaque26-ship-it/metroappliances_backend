'use strict';
const InspectionPlan = require('../models/InspectionPlan');
const InspectionLot = require('../models/InspectionLot');
const CAPA = require('../models/CAPA');
const NCReport = require('../models/NCReport');
const CorrectiveAction = require('../models/CorrectiveAction');
const QualityAudit = require('../models/QualityAudit');
const AuditFinding = require('../models/AuditFinding');
const Gauge = require('../models/Gauge');
const CalibrationRecord = require('../models/CalibrationRecord');
const SupplierQualityRecord = require('../models/SupplierQualityRecord');
const QualityCertificate = require('../models/QualityCertificate');
const QualityAlert = require('../models/QualityAlert');
const DocumentControl = require('../models/DocumentControl');
const { success, error } = require('../utils/response');

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalLots, passedLots, failedLots, inProgressLots,
      openCAPAs, overdueCAPAs,
      openNCRs, criticalNCRs,
      scheduledAudits, openAudits,
      calibratedGauges, overdueGauges,
      openAlerts, criticalAlerts,
      activeDocs,
    ] = await Promise.all([
      InspectionLot.countDocuments({ isDeleted: false }),
      InspectionLot.countDocuments({ isDeleted: false, status: 'passed' }),
      InspectionLot.countDocuments({ isDeleted: false, status: 'failed' }),
      InspectionLot.countDocuments({ isDeleted: false, status: 'in_progress' }),
      CAPA.countDocuments({ isDeleted: false, status: { $in: ['open','in_progress'] } }),
      CAPA.countDocuments({ isDeleted: false, status: 'open', targetCloseDate: { $lt: new Date() } }),
      NCReport.countDocuments({ isDeleted: false, status: { $nin: ['closed','cancelled'] } }),
      NCReport.countDocuments({ isDeleted: false, ncType: 'critical', status: { $nin: ['closed','cancelled'] } }),
      QualityAudit.countDocuments({ isDeleted: false, status: 'planned' }),
      QualityAudit.countDocuments({ isDeleted: false, status: 'in_progress' }),
      Gauge.countDocuments({ isDeleted: false, calibrationStatus: 'calibrated' }),
      Gauge.countDocuments({ isDeleted: false, calibrationStatus: 'overdue' }),
      QualityAlert.countDocuments({ isDeleted: false, status: { $in: ['open','acknowledged'] } }),
      QualityAlert.countDocuments({ isDeleted: false, status: 'open', severity: 'critical' }),
      DocumentControl.countDocuments({ isDeleted: false, status: 'active' }),
    ]);

    const passRate = totalLots > 0 ? Math.round((passedLots / totalLots) * 100) : 0;

    return success(res, {
      inspection: { totalLots, passedLots, failedLots, inProgressLots, passRate },
      capa: { openCAPAs, overdueCAPAs },
      nonConformance: { openNCRs, criticalNCRs },
      audits: { scheduledAudits, openAudits },
      calibration: { calibratedGauges, overdueGauges },
      alerts: { openAlerts, criticalAlerts },
      documents: { activeDocs },
    });
  } catch (err) { return error(res, err.message); }
};

exports.getInspectionTrend = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));
    const trend = await InspectionLot.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: 1 }, passed: { $sum: { $cond: [{ $eq: ['$status', 'passed'] }, 1, 0] } }, failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]);
    return success(res, trend);
  } catch (err) { return error(res, err.message); }
};

exports.getCAPATrend = async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));
    const [openTrend, byType, bySeverity] = await Promise.all([
      CAPA.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      CAPA.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$capaType', count: { $sum: 1 } } },
      ]),
      CAPA.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
    ]);
    return success(res, { openTrend, byType, bySeverity });
  } catch (err) { return error(res, err.message); }
};

exports.getNCRAnalysis = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));
    const [byType, byCategory, bySource, trend] = await Promise.all([
      NCReport.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$ncType', count: { $sum: 1 }, totalQty: { $sum: '$quantity' } } }]),
      NCReport.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$defectCategory', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      NCReport.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$source', count: { $sum: 1 } } }]),
      NCReport.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, totalQty: { $sum: '$quantity' } } },
        { $sort: { _id: 1 } },
      ]),
    ]);
    return success(res, { byType, byCategory, bySource, trend });
  } catch (err) { return error(res, err.message); }
};

exports.getAuditSummary = async (req, res) => {
  try {
    const [byType, byResult, findingsByType, recentAudits] = await Promise.all([
      QualityAudit.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$auditType', count: { $sum: 1 } } }]),
      QualityAudit.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$overallResult', count: { $sum: 1 } } }]),
      AuditFinding.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$findingType', count: { $sum: 1 } } }]),
      QualityAudit.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5).select('auditNumber title auditType status plannedDate overallResult'),
    ]);
    return success(res, { byType, byResult, findingsByType, recentAudits });
  } catch (err) { return error(res, err.message); }
};

exports.getCalibrationSummary = async (req, res) => {
  try {
    const [byStatus, byType, dueThisMonth, recentCalibrations] = await Promise.all([
      Gauge.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$calibrationStatus', count: { $sum: 1 } } }]),
      Gauge.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$gaugeType', count: { $sum: 1 } } }]),
      Gauge.countDocuments({ isDeleted: false, nextCalibrationDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, calibrationStatus: { $ne: 'calibrated' } }),
      CalibrationRecord.find({ isDeleted: false }).sort({ calibrationDate: -1 }).limit(10).populate('gauge', 'gaugeNumber name'),
    ]);
    return success(res, { byStatus, byType, dueThisMonth, recentCalibrations });
  } catch (err) { return error(res, err.message); }
};

exports.getSupplierQualitySummary = async (req, res) => {
  try {
    const [byStatus, avgScores, recentRecords] = await Promise.all([
      SupplierQualityRecord.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$supplierStatus', count: { $sum: 1 } } }]),
      SupplierQualityRecord.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, avgQuality: { $avg: '$qualityScore' }, avgDelivery: { $avg: '$deliveryScore' }, avgOverall: { $avg: '$overallScore' } } },
      ]),
      SupplierQualityRecord.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(10).populate('vendor', 'name vendorCode'),
    ]);
    return success(res, { byStatus, avgScores: avgScores[0] || {}, recentRecords });
  } catch (err) { return error(res, err.message); }
};

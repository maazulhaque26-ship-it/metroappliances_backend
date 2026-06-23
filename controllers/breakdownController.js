'use strict';
const BreakdownRecord       = require('../models/BreakdownRecord');
const AssetFailureAnalysis  = require('../models/AssetFailureAnalysis');
const MaintenanceWorkOrder  = require('../models/MaintenanceWorkOrder');
const Asset                 = require('../models/Asset');
const AuditLog              = require('../models/AuditLog');
const { success, error, paginated, notFound, serverError } = require('../utils/response');

// ── Breakdown Records ─────────────────────────────────────────────────────────

exports.getBreakdowns = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, severity, status, assetId, failureMode } = req.query;
    const filter = { isDeleted: false };
    if (search) filter.$or = [
      { breakdownNumber: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (assetId) filter.asset = assetId;
    if (failureMode) filter.failureMode = failureMode;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      BreakdownRecord.find(filter)
        .populate('asset', 'name assetNumber assetType location')
        .populate('maintenanceWorkOrder', 'workOrderNumber status')
        .sort({ breakdownDate: -1 }).skip(skip).limit(Number(limit)),
      BreakdownRecord.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.getBreakdown = async (req, res) => {
  try {
    const breakdown = await BreakdownRecord.findOne({ _id: req.params.id, isDeleted: false })
      .populate('asset', 'name assetNumber assetType')
      .populate('maintenanceWorkOrder', 'workOrderNumber status')
      .populate('reportedBy', 'name email')
      .populate('resolvedBy', 'name');
    if (!breakdown) return notFound(res, 'Breakdown record not found');
    const analysis = await AssetFailureAnalysis.find({ breakdownRecord: breakdown._id, isDeleted: false });
    return success(res, { breakdown, analysis });
  } catch (e) { return serverError(res, e.message); }
};

exports.createBreakdown = async (req, res) => {
  try {
    const breakdown = await BreakdownRecord.create(req.body);

    // Update asset status to 'breakdown'
    await Asset.findByIdAndUpdate(breakdown.asset, { status: 'breakdown' });

    const io = req.app.locals.io;
    if (io) {
      io.emit('eam:breakdown', {
        breakdownId: breakdown._id,
        breakdownNumber: breakdown.breakdownNumber,
        assetId: breakdown.asset,
        severity: breakdown.severity,
        failureMode: breakdown.failureMode,
      });
    }
    await AuditLog.create({
      admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email,
      adminRole: req.user.role, action: 'CREATE', entity: 'BreakdownRecord',
      entityId: breakdown._id, entityLabel: breakdown.breakdownNumber,
      changes: { after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return success(res, breakdown, 'Breakdown recorded', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateBreakdown = async (req, res) => {
  try {
    const before = await BreakdownRecord.findOne({ _id: req.params.id, isDeleted: false });
    if (!before) return notFound(res, 'Breakdown not found');
    const breakdown = await BreakdownRecord.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await AuditLog.create({
      admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email,
      adminRole: req.user.role, action: 'UPDATE', entity: 'BreakdownRecord',
      entityId: breakdown._id, entityLabel: breakdown.breakdownNumber,
      changes: { before, after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return success(res, breakdown, 'Breakdown updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.resolveBreakdown = async (req, res) => {
  try {
    const breakdown = await BreakdownRecord.findOne({ _id: req.params.id, isDeleted: false });
    if (!breakdown) return notFound(res, 'Breakdown not found');
    if (breakdown.status === 'resolved') return error(res, 'Already resolved', 400);

    const restoredDate = req.body.restoredDate || new Date();
    const downtimeHours = (restoredDate - breakdown.breakdownDate) / (1000 * 60 * 60);

    const updated = await BreakdownRecord.findByIdAndUpdate(req.params.id, {
      status: 'resolved',
      restoredDate,
      downtimeHours: req.body.downtimeHours || downtimeHours,
      mttrHours: req.body.mttrHours || downtimeHours,
      resolvedBy: req.user._id,
      rootCause: req.body.rootCause,
      repairCost: req.body.repairCost,
      ...req.body,
    }, { new: true });

    // Restore asset status
    await Asset.findByIdAndUpdate(breakdown.asset, { status: 'operational' });

    return success(res, updated, 'Breakdown resolved');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteBreakdown = async (req, res) => {
  try {
    const breakdown = await BreakdownRecord.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!breakdown) return notFound(res, 'Breakdown not found');
    return success(res, null, 'Breakdown deleted');
  } catch (e) { return serverError(res, e.message); }
};

// ── Failure Analysis ──────────────────────────────────────────────────────────

exports.getFailureAnalyses = async (req, res) => {
  try {
    const { page = 1, limit = 20, assetId, status, analysisMethod } = req.query;
    const filter = { isDeleted: false };
    if (assetId) filter.asset = assetId;
    if (status) filter.status = status;
    if (analysisMethod) filter.analysisMethod = analysisMethod;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      AssetFailureAnalysis.find(filter)
        .populate('asset', 'name assetNumber')
        .populate('breakdownRecord', 'breakdownNumber severity')
        .sort({ analysisDate: -1 }).skip(skip).limit(Number(limit)),
      AssetFailureAnalysis.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.createFailureAnalysis = async (req, res) => {
  try {
    const { severity = 1, occurrence = 1, detection = 1 } = req.body;
    const rpn = severity * occurrence * detection;
    const analysis = await AssetFailureAnalysis.create({ ...req.body, rpn });
    return success(res, analysis, 'Failure analysis created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateFailureAnalysis = async (req, res) => {
  try {
    if (req.body.severity && req.body.occurrence && req.body.detection) {
      req.body.rpn = req.body.severity * req.body.occurrence * req.body.detection;
    }
    const analysis = await AssetFailureAnalysis.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!analysis) return notFound(res, 'Analysis not found');
    return success(res, analysis, 'Analysis updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteFailureAnalysis = async (req, res) => {
  try {
    const analysis = await AssetFailureAnalysis.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!analysis) return notFound(res, 'Analysis not found');
    return success(res, null, 'Analysis deleted');
  } catch (e) { return serverError(res, e.message); }
};

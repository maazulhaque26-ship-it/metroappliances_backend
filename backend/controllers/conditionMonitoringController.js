'use strict';
const ConditionMonitoring = require('../models/ConditionMonitoring');
const AssetRiskAssessment = require('../models/AssetRiskAssessment');
const AssetCalibration    = require('../models/AssetCalibration');
const AuditLog            = require('../models/AuditLog');
const { success, error, paginated, notFound, serverError } = require('../utils/response');

// ── Condition Monitoring ──────────────────────────────────────────────────────

exports.getMonitors = async (req, res) => {
  try {
    const { page = 1, limit = 20, assetId, currentState, parameterType } = req.query;
    const filter = { isDeleted: false };
    if (assetId) filter.asset = assetId;
    if (currentState) filter.currentState = currentState;
    if (parameterType) filter.parameterType = parameterType;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      ConditionMonitoring.find(filter)
        .populate('asset', 'name assetNumber')
        .sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)),
      ConditionMonitoring.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.getMonitor = async (req, res) => {
  try {
    const monitor = await ConditionMonitoring.findOne({ _id: req.params.id, isDeleted: false })
      .populate('asset', 'name assetNumber assetType');
    if (!monitor) return notFound(res, 'Monitor not found');
    return success(res, monitor);
  } catch (e) { return serverError(res, e.message); }
};

exports.createMonitor = async (req, res) => {
  try {
    const monitor = await ConditionMonitoring.create(req.body);
    await AuditLog.create({
      admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email,
      adminRole: req.user.role, action: 'CREATE', entity: 'ConditionMonitoring',
      entityId: monitor._id, entityLabel: monitor.monitorNumber,
      changes: { after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return success(res, monitor, 'Monitor created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateMonitor = async (req, res) => {
  try {
    const monitor = await ConditionMonitoring.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!monitor) return notFound(res, 'Monitor not found');
    return success(res, monitor, 'Monitor updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteMonitor = async (req, res) => {
  try {
    const monitor = await ConditionMonitoring.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!monitor) return notFound(res, 'Monitor not found');
    return success(res, null, 'Monitor deleted');
  } catch (e) { return serverError(res, e.message); }
};

exports.addReading = async (req, res) => {
  try {
    const monitor = await ConditionMonitoring.findOne({ _id: req.params.id, isDeleted: false });
    if (!monitor) return notFound(res, 'Monitor not found');
    const { value, timestamp } = req.body;

    // Determine state based on thresholds
    let state = 'normal';
    if (monitor.thresholds) {
      const { normal, warning, critical } = monitor.thresholds;
      if (critical && (value < critical.min || value > critical.max)) state = 'critical';
      else if (warning && (value < warning.min || value > warning.max)) state = 'warning';
      else if (normal && (value < normal.min || value > normal.max)) state = 'warning';
    }

    monitor.readings.push({ value, timestamp: timestamp || new Date(), state });
    monitor.currentValue = value;
    monitor.currentState = state;
    monitor.lastReadingAt = timestamp || new Date();
    await monitor.save();

    const io = req.app.locals.io;
    if (io && (state === 'warning' || state === 'critical')) {
      io.emit('eam:condition_alert', {
        monitorId: monitor._id, monitorNumber: monitor.monitorNumber,
        assetId: monitor.asset, parameter: monitor.parameter, value, state,
      });
    }
    return success(res, monitor, 'Reading recorded');
  } catch (e) { return serverError(res, e.message); }
};

// ── Asset Risk Assessment ─────────────────────────────────────────────────────

exports.getRiskAssessments = async (req, res) => {
  try {
    const { page = 1, limit = 20, assetId, overallRisk, status } = req.query;
    const filter = { isDeleted: false };
    if (assetId) filter.asset = assetId;
    if (overallRisk) filter.overallRisk = overallRisk;
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      AssetRiskAssessment.find(filter)
        .populate('asset', 'name assetNumber')
        .sort({ assessmentDate: -1 }).skip(skip).limit(Number(limit)),
      AssetRiskAssessment.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.createRiskAssessment = async (req, res) => {
  try {
    const { failureLikelihood = 1, failureConsequence = 1 } = req.body;
    const riskScore = failureLikelihood * failureConsequence;
    let overallRisk = 'low';
    if (riskScore >= 20) overallRisk = 'critical';
    else if (riskScore >= 12) overallRisk = 'high';
    else if (riskScore >= 6) overallRisk = 'medium';

    const assessment = await AssetRiskAssessment.create({ ...req.body, riskScore, overallRisk });
    return success(res, assessment, 'Risk assessment created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateRiskAssessment = async (req, res) => {
  try {
    if (req.body.failureLikelihood && req.body.failureConsequence) {
      req.body.riskScore = req.body.failureLikelihood * req.body.failureConsequence;
      if (req.body.riskScore >= 20) req.body.overallRisk = 'critical';
      else if (req.body.riskScore >= 12) req.body.overallRisk = 'high';
      else if (req.body.riskScore >= 6) req.body.overallRisk = 'medium';
      else req.body.overallRisk = 'low';
    }
    const assessment = await AssetRiskAssessment.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!assessment) return notFound(res, 'Assessment not found');
    return success(res, assessment, 'Assessment updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteRiskAssessment = async (req, res) => {
  try {
    const assessment = await AssetRiskAssessment.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!assessment) return notFound(res, 'Assessment not found');
    return success(res, null, 'Assessment deleted');
  } catch (e) { return serverError(res, e.message); }
};

// ── Asset Calibration ─────────────────────────────────────────────────────────

exports.getAssetCalibrations = async (req, res) => {
  try {
    const { page = 1, limit = 20, assetId, overallResult } = req.query;
    const filter = { isDeleted: false };
    if (assetId) filter.asset = assetId;
    if (overallResult) filter.overallResult = overallResult;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      AssetCalibration.find(filter)
        .populate('asset', 'name assetNumber')
        .sort({ calibrationDate: -1 }).skip(skip).limit(Number(limit)),
      AssetCalibration.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.createAssetCalibration = async (req, res) => {
  try {
    const calibration = await AssetCalibration.create(req.body);
    return success(res, calibration, 'Calibration record created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateAssetCalibration = async (req, res) => {
  try {
    const calibration = await AssetCalibration.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!calibration) return notFound(res, 'Calibration not found');
    return success(res, calibration, 'Calibration updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteAssetCalibration = async (req, res) => {
  try {
    const calibration = await AssetCalibration.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!calibration) return notFound(res, 'Calibration not found');
    return success(res, null, 'Calibration deleted');
  } catch (e) { return serverError(res, e.message); }
};

'use strict';
const AuditProgram = require('../models/AuditProgram');
const QualityAudit = require('../models/QualityAudit');
const AuditFinding = require('../models/AuditFinding');
const AuditLog = require('../models/AuditLog');
const { success, error, paginated } = require('../utils/response');

// ── Audit Programs ────────────────────────────────────────────────────────────
exports.getAuditPrograms = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, year, programType } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (year) filter.year = Number(year);
    if (programType) filter.programType = programType;
    const total = await AuditProgram.countDocuments(filter);
    const data = await AuditProgram.find(filter)
      .sort({ year: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'Audit programs retrieved');
  } catch (err) { return error(res, err.message); }
};

exports.createAuditProgram = async (req, res) => {
  try {
    const program = await AuditProgram.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'create', entity: 'AuditProgram', entityId: program._id, entityLabel: program.programNumber, changes: { before: null, after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return success(res, program, 'Audit program created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.getAuditProgram = async (req, res) => {
  try {
    const program = await AuditProgram.findOne({ _id: req.params.id, isDeleted: false });
    if (!program) return error(res, 'Audit program not found', 404);
    const audits = await QualityAudit.find({ auditProgram: program._id, isDeleted: false }).sort({ plannedDate: 1 });
    return success(res, { program, audits });
  } catch (err) { return error(res, err.message); }
};

exports.updateAuditProgram = async (req, res) => {
  try {
    const before = await AuditProgram.findOne({ _id: req.params.id, isDeleted: false });
    if (!before) return error(res, 'Audit program not found', 404);
    const program = await AuditProgram.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'update', entity: 'AuditProgram', entityId: program._id, entityLabel: program.programNumber, changes: { before: before.toObject(), after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return success(res, program, 'Audit program updated');
  } catch (err) { return error(res, err.message); }
};

exports.deleteAuditProgram = async (req, res) => {
  try {
    const program = await AuditProgram.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!program) return error(res, 'Audit program not found', 404);
    return success(res, null, 'Audit program deleted');
  } catch (err) { return error(res, err.message); }
};

// ── Quality Audits ────────────────────────────────────────────────────────────
exports.getQualityAudits = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, auditType, programId, search } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (auditType) filter.auditType = auditType;
    if (programId) filter.auditProgram = programId;
    if (search) filter.$or = [
      { auditNumber: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
    const total = await QualityAudit.countDocuments(filter);
    const data = await QualityAudit.find(filter)
      .populate('auditProgram', 'programNumber name')
      .sort({ plannedDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'Quality audits retrieved');
  } catch (err) { return error(res, err.message); }
};

exports.createQualityAudit = async (req, res) => {
  try {
    const audit = await QualityAudit.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'create', entity: 'QualityAudit', entityId: audit._id, entityLabel: audit.auditNumber, changes: { before: null, after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    const io = req.app.locals.io;
    if (io) io.emit('qms:audit_created', { id: audit._id, auditNumber: audit.auditNumber });
    return success(res, audit, 'Quality audit created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.getQualityAudit = async (req, res) => {
  try {
    const audit = await QualityAudit.findOne({ _id: req.params.id, isDeleted: false })
      .populate('auditProgram', 'programNumber name')
      .populate('factory', 'name code');
    if (!audit) return error(res, 'Quality audit not found', 404);
    const findings = await AuditFinding.find({ qualityAudit: audit._id, isDeleted: false }).sort({ findingType: 1 });
    return success(res, { audit, findings });
  } catch (err) { return error(res, err.message); }
};

exports.updateQualityAudit = async (req, res) => {
  try {
    const before = await QualityAudit.findOne({ _id: req.params.id, isDeleted: false });
    if (!before) return error(res, 'Quality audit not found', 404);
    const audit = await QualityAudit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (req.body.status === 'closed') {
      const io = req.app.locals.io;
      if (io) io.emit('qms:audit_closed', { id: audit._id, auditNumber: audit.auditNumber, overallResult: audit.overallResult });
    }
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'update', entity: 'QualityAudit', entityId: audit._id, entityLabel: audit.auditNumber, changes: { before: before.toObject(), after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return success(res, audit, 'Quality audit updated');
  } catch (err) { return error(res, err.message); }
};

exports.deleteQualityAudit = async (req, res) => {
  try {
    const audit = await QualityAudit.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!audit) return error(res, 'Quality audit not found', 404);
    return success(res, null, 'Quality audit deleted');
  } catch (err) { return error(res, err.message); }
};

// ── Audit Findings ────────────────────────────────────────────────────────────
exports.getAuditFindings = async (req, res) => {
  try {
    const { page = 1, limit = 20, auditId, findingType, status } = req.query;
    const filter = { isDeleted: false };
    if (auditId) filter.qualityAudit = auditId;
    if (findingType) filter.findingType = findingType;
    if (status) filter.status = status;
    const total = await AuditFinding.countDocuments(filter);
    const data = await AuditFinding.find(filter)
      .populate('qualityAudit', 'auditNumber title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'Audit findings retrieved');
  } catch (err) { return error(res, err.message); }
};

exports.createAuditFinding = async (req, res) => {
  try {
    const finding = await AuditFinding.create(req.body);
    // Update audit finding counts
    const counts = { totalFindings: 0, majorNCs: 0, minorNCs: 0, observations: 0, opportunities: 0 };
    const allFindings = await AuditFinding.find({ qualityAudit: finding.qualityAudit, isDeleted: false });
    allFindings.forEach(f => {
      counts.totalFindings++;
      if (f.findingType === 'major_nc') counts.majorNCs++;
      else if (f.findingType === 'minor_nc') counts.minorNCs++;
      else if (f.findingType === 'observation') counts.observations++;
      else if (f.findingType === 'opportunity') counts.opportunities++;
    });
    await QualityAudit.findByIdAndUpdate(finding.qualityAudit, counts);
    return success(res, finding, 'Audit finding created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.updateAuditFinding = async (req, res) => {
  try {
    const finding = await AuditFinding.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!finding) return error(res, 'Audit finding not found', 404);
    return success(res, finding, 'Audit finding updated');
  } catch (err) { return error(res, err.message); }
};

exports.deleteAuditFinding = async (req, res) => {
  try {
    const finding = await AuditFinding.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!finding) return error(res, 'Audit finding not found', 404);
    return success(res, null, 'Audit finding deleted');
  } catch (err) { return error(res, err.message); }
};

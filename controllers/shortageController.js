'use strict';
const MaterialShortage = require('../models/MaterialShortage');
const AuditLog         = require('../models/AuditLog');
const { ok, paginated, notFound, fail, serverError } = require('../utils/response');

exports.getShortages = async (req, res) => {
  try {
    const { page = 1, limit = 20, mrpRun, material, severity, status } = req.query;
    const filter = { isDeleted: false };
    if (mrpRun)   filter.mrpRun   = mrpRun;
    if (material) filter.material = material;
    if (severity) filter.severity = severity;
    if (status)   filter.status   = status;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await MaterialShortage.countDocuments(filter);
    const data  = await MaterialShortage.find(filter)
      .sort({ severity: -1, shortageQty: -1 })
      .skip(skip).limit(Number(limit))
      .populate('material',     'name sku')
      .populate('mrpRun',       'runNumber')
      .populate('recommendation', 'recommendationNumber type');
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.getShortage = async (req, res) => {
  try {
    const doc = await MaterialShortage.findOne({ _id: req.params.id, isDeleted: false })
      .populate('material',            'name sku')
      .populate('mrpRun',              'runNumber status')
      .populate('materialRequirement', 'requirementNumber grossRequirement netRequirement')
      .populate('recommendation',      'recommendationNumber type status')
      .populate('resolvedBy',          'name');
    if (!doc) return notFound(res, 'Material shortage not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.resolveShortage = async (req, res) => {
  try {
    const doc = await MaterialShortage.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Material shortage not found');
    if (doc.status === 'resolved') return fail(res, 'Shortage is already resolved');
    const before = doc.toObject();
    doc.status       = 'resolved';
    doc.resolvedAt   = new Date();
    doc.resolvedBy   = req.user?._id;
    doc.resolvedByName = req.user?.name || '';
    if (req.body.notes) doc.notes = req.body.notes;
    await doc.save();
    await AuditLog.create({
      admin: req.user?._id, adminName: req.user?.name || '', adminEmail: req.user?.email || '',
      adminRole: req.user?.role || 'admin', action: 'update', entity: 'MaterialShortage',
      entityId: doc._id, entityLabel: doc.materialName,
      changes: { before, after: { status: 'resolved' } },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    const io = req.app.locals.io;
    if (io) io.emit('mrp:shortage_resolved', { shortageId: doc._id, materialName: doc.materialName });
    return ok(res, doc, 'Shortage marked as resolved');
  } catch (err) { return serverError(res, err); }
};

exports.ignoreShortage = async (req, res) => {
  try {
    const doc = await MaterialShortage.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Material shortage not found');
    if (['resolved','ignored'].includes(doc.status)) return fail(res, `Shortage is already ${doc.status}`);
    doc.status = 'ignored';
    if (req.body.notes) doc.notes = req.body.notes;
    await doc.save();
    return ok(res, doc, 'Shortage ignored');
  } catch (err) { return serverError(res, err); }
};

'use strict';
const WorkCenter = require('../models/WorkCenter');
const Machine    = require('../models/Machine');
const AuditLog   = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError, noContent } = require('../utils/response');

function audit(req, action, wc, before = null) {
  try {
    AuditLog.create({
      admin: req.user._id, adminName: req.user.name || '', adminEmail: req.user.email || '',
      adminRole: req.user.role || 'admin', action, entity: 'WorkCenter',
      entityId: wc._id, entityLabel: wc.name,
      changes: { before, after: wc.toObject ? wc.toObject() : wc },
      ip: req.ip, userAgent: req.get('user-agent') || '',
    });
  } catch (_) {}
}

exports.createWorkCenter = async (req, res) => {
  try {
    const wc = await WorkCenter.create(req.body);
    audit(req, 'WORK_CENTER_CREATED', wc);
    return created(res, wc, 'Work center created');
  } catch (err) {
    if (err.code === 11000) return fail(res, 'Work center code already exists');
    return serverError(res, err);
  }
};

exports.getWorkCenters = async (req, res) => {
  try {
    const { page = 1, limit = 20, factory, status, search } = req.query;
    const filter = { isDeleted: false };
    if (factory) filter.factory = factory;
    if (status)  filter.status  = status;
    if (search)  filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
    const total = await WorkCenter.countDocuments(filter);
    const data  = await WorkCenter.find(filter)
      .populate('factory', 'name code')
      .sort({ code: 1 })
      .skip((page - 1) * Number(limit)).limit(Number(limit));
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getWorkCenter = async (req, res) => {
  try {
    const wc = await WorkCenter.findOne({ _id: req.params.id, isDeleted: false })
      .populate('factory', 'name code status');
    if (!wc) return notFound(res, 'Work center');
    const machines = await Machine.find({ workCenter: wc._id, isDeleted: false }).sort({ code: 1 });
    return ok(res, { ...wc.toObject(), machines });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateWorkCenter = async (req, res) => {
  try {
    const wc = await WorkCenter.findOne({ _id: req.params.id, isDeleted: false });
    if (!wc) return notFound(res, 'Work center');
    const before = wc.toObject();
    Object.assign(wc, req.body);
    await wc.save();
    audit(req, 'WORK_CENTER_UPDATED', wc, before);
    return ok(res, wc, 'Work center updated');
  } catch (err) {
    if (err.code === 11000) return fail(res, 'Work center code already exists');
    return serverError(res, err);
  }
};

exports.deleteWorkCenter = async (req, res) => {
  try {
    const wc = await WorkCenter.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!wc) return notFound(res, 'Work center');
    audit(req, 'WORK_CENTER_DELETED', wc);
    return noContent(res, 'Work center deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

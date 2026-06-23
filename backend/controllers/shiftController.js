'use strict';
const Shift    = require('../models/Shift');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError, noContent } = require('../utils/response');

function audit(req, action, shift, before = null) {
  try {
    AuditLog.create({
      admin: req.user._id, adminName: req.user.name || '', adminEmail: req.user.email || '',
      adminRole: req.user.role || 'admin', action, entity: 'Shift',
      entityId: shift._id, entityLabel: shift.name,
      changes: { before, after: shift.toObject ? shift.toObject() : shift },
      ip: req.ip, userAgent: req.get('user-agent') || '',
    });
  } catch (_) {}
}

exports.createShift = async (req, res) => {
  try {
    const shift = await Shift.create(req.body);
    audit(req, 'SHIFT_CREATED', shift);
    return created(res, shift, 'Shift created');
  } catch (err) {
    if (err.code === 11000) return fail(res, 'Shift code already exists');
    return serverError(res, err);
  }
};

exports.getShifts = async (req, res) => {
  try {
    const { page = 1, limit = 20, factory, isActive } = req.query;
    const filter = { isDeleted: false };
    if (factory)  filter.factory  = factory;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const total = await Shift.countDocuments(filter);
    const data  = await Shift.find(filter)
      .populate('factory', 'name code')
      .sort({ name: 1 })
      .skip((page - 1) * Number(limit)).limit(Number(limit));
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ _id: req.params.id, isDeleted: false })
      .populate('factory', 'name code');
    if (!shift) return notFound(res, 'Shift');
    return ok(res, shift);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ _id: req.params.id, isDeleted: false });
    if (!shift) return notFound(res, 'Shift');
    const before = shift.toObject();
    Object.assign(shift, req.body);
    await shift.save();
    audit(req, 'SHIFT_UPDATED', shift, before);
    return ok(res, shift, 'Shift updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!shift) return notFound(res, 'Shift');
    audit(req, 'SHIFT_DELETED', shift);
    return noContent(res, 'Shift deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

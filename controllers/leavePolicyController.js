'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const LeaveType   = () => mongoose.model('LeaveType');
const LeavePolicy = () => mongoose.model('LeavePolicy');
const Holiday     = () => mongoose.model('Holiday');

async function _audit(req, action, entity, id, label, before, after) {
  setImmediate(async () => {
    try {
      await AuditLog.create({
        admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role,
        action, entity, entityId: id, entityLabel: String(label).slice(0, 200),
        changes: { before, after },
        ip: (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim(),
        userAgent: (req.get('User-Agent') || '').slice(0, 300),
      });
    } catch (_) {}
  });
}

// ── Leave Types ───────────────────────────────────────────────────────────────

exports.getLeaveTypes = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = { isDeleted: false };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const data = await LeaveType().find(filter).sort({ name: 1 }).lean();
    return ok(res, data);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getLeaveType = async (req, res) => {
  try {
    const lt = await LeaveType().findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!lt) return notFound(res, 'LeaveType');
    return ok(res, lt);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createLeaveType = async (req, res) => {
  try {
    const lt = await LeaveType().create(req.body);
    _audit(req, 'LEAVE_TYPE_CREATED', 'LeaveType', lt._id, lt.name, null, lt.toObject());
    return created(res, lt, 'Leave type created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateLeaveType = async (req, res) => {
  try {
    const lt = await LeaveType().findOne({ _id: req.params.id, isDeleted: false });
    if (!lt) return notFound(res, 'LeaveType');
    const before = lt.toObject();
    Object.assign(lt, req.body);
    await lt.save();
    _audit(req, 'LEAVE_TYPE_UPDATED', 'LeaveType', lt._id, lt.name, before, lt.toObject());
    return ok(res, lt, 'Leave type updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteLeaveType = async (req, res) => {
  try {
    const lt = await LeaveType().findOne({ _id: req.params.id, isDeleted: false });
    if (!lt) return notFound(res, 'LeaveType');
    lt.isDeleted = true;
    await lt.save();
    _audit(req, 'LEAVE_TYPE_DELETED', 'LeaveType', lt._id, lt.name, lt.toObject(), null);
    return ok(res, null, 'Leave type deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Leave Policies ────────────────────────────────────────────────────────────

exports.getLeavePolicies = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      LeavePolicy().find(filter)
        .populate('allocations.leaveType', 'name code color')
        .sort({ isDefault: -1, createdAt: -1 })
        .skip(skip).limit(Number(limit)).lean(),
      LeavePolicy().countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getLeavePolicy = async (req, res) => {
  try {
    const policy = await LeavePolicy().findOne({ _id: req.params.id, isDeleted: false })
      .populate('allocations.leaveType', 'name code color isPaid')
      .lean();
    if (!policy) return notFound(res, 'LeavePolicy');
    return ok(res, policy);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createLeavePolicy = async (req, res) => {
  try {
    if (req.body.isDefault) {
      await LeavePolicy().updateMany({ isDefault: true }, { isDefault: false });
    }
    const policy = await LeavePolicy().create(req.body);
    _audit(req, 'LEAVE_POLICY_CREATED', 'LeavePolicy', policy._id, policy.name, null, policy.toObject());
    return created(res, policy, 'Leave policy created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateLeavePolicy = async (req, res) => {
  try {
    const policy = await LeavePolicy().findOne({ _id: req.params.id, isDeleted: false });
    if (!policy) return notFound(res, 'LeavePolicy');
    const before = policy.toObject();
    if (req.body.isDefault) {
      await LeavePolicy().updateMany({ isDefault: true, _id: { $ne: policy._id } }, { isDefault: false });
    }
    Object.assign(policy, req.body);
    await policy.save();
    _audit(req, 'LEAVE_POLICY_UPDATED', 'LeavePolicy', policy._id, policy.name, before, policy.toObject());
    return ok(res, policy, 'Leave policy updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteLeavePolicy = async (req, res) => {
  try {
    const policy = await LeavePolicy().findOne({ _id: req.params.id, isDeleted: false });
    if (!policy) return notFound(res, 'LeavePolicy');
    if (policy.isDefault) return fail(res, 'Cannot delete the default leave policy');
    policy.isDeleted = true;
    await policy.save();
    _audit(req, 'LEAVE_POLICY_DELETED', 'LeavePolicy', policy._id, policy.name, policy.toObject(), null);
    return ok(res, null, 'Leave policy deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Holidays ──────────────────────────────────────────────────────────────────

exports.getHolidays = async (req, res) => {
  try {
    const { year, holidayType, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (year)        filter.year = Number(year);
    if (holidayType) filter.holidayType = holidayType;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Holiday().find(filter).sort({ date: 1 }).skip(skip).limit(Number(limit)).lean(),
      Holiday().countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getHoliday = async (req, res) => {
  try {
    const holiday = await Holiday().findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!holiday) return notFound(res, 'Holiday');
    return ok(res, holiday);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createHoliday = async (req, res) => {
  try {
    const holiday = await Holiday().create(req.body);
    _audit(req, 'HOLIDAY_CREATED', 'Holiday', holiday._id, holiday.name, null, holiday.toObject());
    return created(res, holiday, 'Holiday created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateHoliday = async (req, res) => {
  try {
    const holiday = await Holiday().findOne({ _id: req.params.id, isDeleted: false });
    if (!holiday) return notFound(res, 'Holiday');
    const before = holiday.toObject();
    Object.assign(holiday, req.body);
    await holiday.save();
    _audit(req, 'HOLIDAY_UPDATED', 'Holiday', holiday._id, holiday.name, before, holiday.toObject());
    return ok(res, holiday, 'Holiday updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday().findOne({ _id: req.params.id, isDeleted: false });
    if (!holiday) return notFound(res, 'Holiday');
    holiday.isDeleted = true;
    await holiday.save();
    _audit(req, 'HOLIDAY_DELETED', 'Holiday', holiday._id, holiday.name, holiday.toObject(), null);
    return ok(res, null, 'Holiday deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

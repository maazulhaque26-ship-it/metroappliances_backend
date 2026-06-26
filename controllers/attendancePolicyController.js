'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const AttendancePolicy     = () => mongoose.model('AttendancePolicy');
const AttendanceDevice     = () => mongoose.model('AttendanceDevice');
const AttendanceAdjustment = () => mongoose.model('AttendanceAdjustment');
const AttendanceApproval   = () => mongoose.model('AttendanceApproval');

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

// ── Attendance Policies ───────────────────────────────────────────────────────

exports.getPolicies = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AttendancePolicy().find(filter).sort({ isDefault: -1, createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      AttendancePolicy().countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getPolicy = async (req, res) => {
  try {
    const policy = await AttendancePolicy().findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!policy) return notFound(res, 'AttendancePolicy');
    return ok(res, policy);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createPolicy = async (req, res) => {
  try {
    if (req.body.isDefault) {
      await AttendancePolicy().updateMany({ isDefault: true }, { isDefault: false });
    }
    const policy = await AttendancePolicy().create(req.body);
    _audit(req, 'ATTENDANCE_POLICY_CREATED', 'AttendancePolicy', policy._id, policy.name, null, policy.toObject());
    return created(res, policy, 'Policy created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const policy = await AttendancePolicy().findOne({ _id: req.params.id, isDeleted: false });
    if (!policy) return notFound(res, 'AttendancePolicy');
    const before = policy.toObject();
    if (req.body.isDefault) {
      await AttendancePolicy().updateMany({ isDefault: true, _id: { $ne: policy._id } }, { isDefault: false });
    }
    Object.assign(policy, req.body);
    await policy.save();
    _audit(req, 'ATTENDANCE_POLICY_UPDATED', 'AttendancePolicy', policy._id, policy.name, before, policy.toObject());
    return ok(res, policy, 'Policy updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deletePolicy = async (req, res) => {
  try {
    const policy = await AttendancePolicy().findOne({ _id: req.params.id, isDeleted: false });
    if (!policy) return notFound(res, 'AttendancePolicy');
    if (policy.isDefault) return fail(res, 'Cannot delete the default attendance policy');
    policy.isDeleted = true;
    await policy.save();
    _audit(req, 'ATTENDANCE_POLICY_DELETED', 'AttendancePolicy', policy._id, policy.name, policy.toObject(), null);
    return ok(res, null, 'Policy deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Attendance Devices ────────────────────────────────────────────────────────

exports.getDevices = async (req, res) => {
  try {
    const { isActive, deviceType, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (deviceType) filter.deviceType = deviceType;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AttendanceDevice().find(filter).populate('location', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      AttendanceDevice().countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getDevice = async (req, res) => {
  try {
    const device = await AttendanceDevice().findOne({ _id: req.params.id, isDeleted: false }).populate('location', 'name').lean();
    if (!device) return notFound(res, 'AttendanceDevice');
    return ok(res, device);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createDevice = async (req, res) => {
  try {
    const device = await AttendanceDevice().create(req.body);
    _audit(req, 'ATTENDANCE_DEVICE_CREATED', 'AttendanceDevice', device._id, device.name, null, device.toObject());
    return created(res, device, 'Device registered');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const device = await AttendanceDevice().findOne({ _id: req.params.id, isDeleted: false });
    if (!device) return notFound(res, 'AttendanceDevice');
    const before = device.toObject();
    Object.assign(device, req.body);
    await device.save();
    _audit(req, 'ATTENDANCE_DEVICE_UPDATED', 'AttendanceDevice', device._id, device.name, before, device.toObject());
    return ok(res, device, 'Device updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const device = await AttendanceDevice().findOne({ _id: req.params.id, isDeleted: false });
    if (!device) return notFound(res, 'AttendanceDevice');
    device.isDeleted = true;
    await device.save();
    _audit(req, 'ATTENDANCE_DEVICE_DELETED', 'AttendanceDevice', device._id, device.name, device.toObject(), null);
    return ok(res, null, 'Device deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Attendance Adjustments ────────────────────────────────────────────────────

exports.getAdjustments = async (req, res) => {
  try {
    const { status, employee, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (status)   filter.status = status;
    if (employee) filter.employee = employee;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AttendanceAdjustment().find(filter)
        .populate('employee', 'employeeCode displayName')
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)).lean(),
      AttendanceAdjustment().countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createAdjustment = async (req, res) => {
  try {
    const adj = await AttendanceAdjustment().create({ ...req.body, requestedBy: req.user._id });
    _audit(req, 'ATTENDANCE_ADJUSTMENT_CREATED', 'AttendanceAdjustment', adj._id, adj.adjustmentNumber, null, adj.toObject());
    return created(res, adj, 'Adjustment request created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.approveAdjustment = async (req, res) => {
  try {
    const adj = await AttendanceAdjustment().findOne({ _id: req.params.id, isDeleted: false });
    if (!adj) return notFound(res, 'AttendanceAdjustment');
    if (adj.status !== 'pending') return fail(res, 'Only pending adjustments can be approved');
    const before = adj.toObject();

    adj.status     = 'approved';
    adj.approvedBy = req.user._id;
    adj.approvedAt = new Date();
    await adj.save();

    await AttendanceApproval().create({
      adjustment: adj._id, employee: adj.employee,
      approver: req.user._id, action: 'approved', comments: req.body.comments,
    });

    // Apply the adjustment to the Attendance record
    const Attendance = mongoose.model('Attendance');
    const att = await Attendance.findById(adj.attendance);
    if (att) {
      if (adj.adjustmentType === 'punch_in')        att.punchIn  = new Date(adj.requestedValue);
      if (adj.adjustmentType === 'punch_out')       att.punchOut = new Date(adj.requestedValue);
      if (adj.adjustmentType === 'status_change')   att.status   = adj.requestedValue;
      if (adj.adjustmentType === 'hours_correction') att.totalHours = Number(adj.requestedValue);
      if (att.punchIn && att.punchOut) {
        att.totalHours = Math.max(0, (att.punchOut - att.punchIn) / 3_600_000);
      }
      await att.save();
    }

    const io = req.app.locals.io;
    if (io) io.emit('hr:attendance_adjusted', { adjustmentId: adj._id, employee: adj.employee });

    _audit(req, 'ATTENDANCE_ADJUSTMENT_APPROVED', 'AttendanceAdjustment', adj._id, adj.adjustmentNumber, before, adj.toObject());
    return ok(res, adj, 'Adjustment approved');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.rejectAdjustment = async (req, res) => {
  try {
    const adj = await AttendanceAdjustment().findOne({ _id: req.params.id, isDeleted: false });
    if (!adj) return notFound(res, 'AttendanceAdjustment');
    if (adj.status !== 'pending') return fail(res, 'Only pending adjustments can be rejected');
    const before = adj.toObject();

    adj.status          = 'rejected';
    adj.approvedBy      = req.user._id;
    adj.approvedAt      = new Date();
    adj.rejectionReason = req.body.reason || '';
    await adj.save();

    await AttendanceApproval().create({
      adjustment: adj._id, employee: adj.employee,
      approver: req.user._id, action: 'rejected', comments: req.body.reason,
    });

    _audit(req, 'ATTENDANCE_ADJUSTMENT_REJECTED', 'AttendanceAdjustment', adj._id, adj.adjustmentNumber, before, adj.toObject());
    return ok(res, adj, 'Adjustment rejected');
  } catch (err) {
    return serverError(res, err);
  }
};

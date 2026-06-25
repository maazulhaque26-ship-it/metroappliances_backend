'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const LeaveRequest    = () => mongoose.model('LeaveRequest');
const LeaveApproval   = () => mongoose.model('LeaveApproval');
const LeaveBalance    = () => mongoose.model('LeaveBalance');
const LeaveAccrual    = () => mongoose.model('LeaveAccrual');
const LeaveEncashment = () => mongoose.model('LeaveEncashment');
const LeaveType       = () => mongoose.model('LeaveType');

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

// ── Leave Requests ────────────────────────────────────────────────────────────

exports.getLeaveRequests = async (req, res) => {
  try {
    const { status, employee, leaveType, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (status)    filter.status = status;
    if (employee)  filter.employee = employee;
    if (leaveType) filter.leaveType = leaveType;
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate)   filter.startDate.$lte = new Date(endDate);
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      LeaveRequest().find(filter)
        .populate('employee', 'employeeCode displayName department')
        .populate('leaveType', 'name code color isPaid')
        .populate('approvedBy', 'name email')
        .sort({ appliedOn: -1 })
        .skip(skip).limit(Number(limit)).lean(),
      LeaveRequest().countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getLeaveRequest = async (req, res) => {
  try {
    const req_ = await LeaveRequest().findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'employeeCode displayName')
      .populate('leaveType', 'name code color isPaid requireDocuments')
      .lean();
    if (!req_) return notFound(res, 'LeaveRequest');
    const approvals = await LeaveApproval().find({ leaveRequest: req_._id })
      .populate('approver', 'name email').sort({ actionAt: 1 }).lean();
    return ok(res, { ...req_, approvals });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createLeaveRequest = async (req, res) => {
  try {
    const { employee, leaveType, startDate, endDate, totalDays, isHalfDay, halfDaySession, reason, documentUrl } = req.body;
    if (!employee || !leaveType || !startDate || !endDate || !totalDays || !reason) {
      return fail(res, 'employee, leaveType, startDate, endDate, totalDays, reason are required');
    }

    const year = new Date(startDate).getFullYear();
    const balance = await LeaveBalance().findOne({ employee, leaveType, year });
    const available = balance ? Math.max(0, balance.closingBalance - (balance.pending || 0)) : 0;
    if (balance && available < totalDays) {
      return fail(res, `Insufficient leave balance. Available: ${available}, Requested: ${totalDays}`);
    }

    const lr = await LeaveRequest().create({ employee, leaveType, startDate, endDate, totalDays, isHalfDay, halfDaySession, reason, documentUrl });

    if (balance) {
      balance.pending = (balance.pending || 0) + totalDays;
      await balance.save();
    }

    const io = req.app.locals.io;
    if (io) io.emit('hr:leave_requested', { requestNumber: lr.requestNumber, employee });

    _audit(req, 'LEAVE_REQUEST_CREATED', 'LeaveRequest', lr._id, lr.requestNumber, null, lr.toObject());
    return created(res, lr, 'Leave request submitted');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateLeaveRequest = async (req, res) => {
  try {
    const lr = await LeaveRequest().findOne({ _id: req.params.id, isDeleted: false });
    if (!lr) return notFound(res, 'LeaveRequest');
    if (!['draft', 'pending'].includes(lr.status)) return fail(res, 'Only draft or pending requests can be modified');
    const before = lr.toObject();
    Object.assign(lr, req.body);
    await lr.save();
    _audit(req, 'LEAVE_REQUEST_UPDATED', 'LeaveRequest', lr._id, lr.requestNumber, before, lr.toObject());
    return ok(res, lr, 'Leave request updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.approveLeaveRequest = async (req, res) => {
  try {
    const lr = await LeaveRequest().findOne({ _id: req.params.id, isDeleted: false });
    if (!lr) return notFound(res, 'LeaveRequest');
    if (lr.status !== 'pending') return fail(res, 'Only pending requests can be approved');
    const before = lr.toObject();

    lr.status     = 'approved';
    lr.approvedBy = req.user._id;
    lr.approvedAt = new Date();
    await lr.save();

    await LeaveApproval().create({ leaveRequest: lr._id, employee: lr.employee, approver: req.user._id, action: 'approved', comments: req.body.comments });

    // Deduct from balance
    const year = new Date(lr.startDate).getFullYear();
    const balance = await LeaveBalance().findOne({ employee: lr.employee, leaveType: lr.leaveType, year });
    if (balance) {
      balance.taken   = (balance.taken   || 0) + lr.totalDays;
      balance.pending = Math.max(0, (balance.pending || 0) - lr.totalDays);
      balance.closingBalance = Math.max(0, (balance.openingBalance + balance.accrued) - balance.taken - balance.encashed);
      await balance.save();
    }

    const io = req.app.locals.io;
    if (io) io.emit('hr:leave_approved', { requestNumber: lr.requestNumber, employee: lr.employee });

    _audit(req, 'LEAVE_APPROVED', 'LeaveRequest', lr._id, lr.requestNumber, before, lr.toObject());
    return ok(res, lr, 'Leave request approved');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.rejectLeaveRequest = async (req, res) => {
  try {
    const lr = await LeaveRequest().findOne({ _id: req.params.id, isDeleted: false });
    if (!lr) return notFound(res, 'LeaveRequest');
    if (lr.status !== 'pending') return fail(res, 'Only pending requests can be rejected');
    const before = lr.toObject();

    lr.status          = 'rejected';
    lr.approvedBy      = req.user._id;
    lr.approvedAt      = new Date();
    lr.rejectionReason = req.body.reason || '';
    await lr.save();

    await LeaveApproval().create({ leaveRequest: lr._id, employee: lr.employee, approver: req.user._id, action: 'rejected', comments: req.body.reason });

    // Release pending balance
    const year = new Date(lr.startDate).getFullYear();
    const balance = await LeaveBalance().findOne({ employee: lr.employee, leaveType: lr.leaveType, year });
    if (balance) {
      balance.pending = Math.max(0, (balance.pending || 0) - lr.totalDays);
      await balance.save();
    }

    const io = req.app.locals.io;
    if (io) io.emit('hr:leave_rejected', { requestNumber: lr.requestNumber, employee: lr.employee });

    _audit(req, 'LEAVE_REJECTED', 'LeaveRequest', lr._id, lr.requestNumber, before, lr.toObject());
    return ok(res, lr, 'Leave request rejected');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.cancelLeaveRequest = async (req, res) => {
  try {
    const lr = await LeaveRequest().findOne({ _id: req.params.id, isDeleted: false });
    if (!lr) return notFound(res, 'LeaveRequest');
    if (!['pending', 'approved'].includes(lr.status)) return fail(res, 'Only pending or approved requests can be cancelled');
    const before = lr.toObject();

    lr.status       = 'cancelled';
    lr.cancelledOn  = new Date();
    lr.cancelReason = req.body.reason || '';
    await lr.save();

    // Restore balance if was approved
    if (before.status === 'approved') {
      const year = new Date(lr.startDate).getFullYear();
      const balance = await LeaveBalance().findOne({ employee: lr.employee, leaveType: lr.leaveType, year });
      if (balance) {
        balance.taken = Math.max(0, (balance.taken || 0) - lr.totalDays);
        balance.closingBalance = Math.max(0, (balance.openingBalance + balance.accrued) - balance.taken - balance.encashed);
        await balance.save();
      }
    }

    _audit(req, 'LEAVE_CANCELLED', 'LeaveRequest', lr._id, lr.requestNumber, before, lr.toObject());
    return ok(res, lr, 'Leave request cancelled');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteLeaveRequest = async (req, res) => {
  try {
    const lr = await LeaveRequest().findOne({ _id: req.params.id, isDeleted: false });
    if (!lr) return notFound(res, 'LeaveRequest');
    if (!['draft', 'rejected', 'cancelled'].includes(lr.status)) return fail(res, 'Only draft, rejected, or cancelled requests can be deleted');
    lr.isDeleted = true;
    await lr.save();
    _audit(req, 'LEAVE_REQUEST_DELETED', 'LeaveRequest', lr._id, lr.requestNumber, lr.toObject(), null);
    return ok(res, null, 'Leave request deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Leave Balances ────────────────────────────────────────────────────────────

exports.getLeaveBalances = async (req, res) => {
  try {
    const { employee, year, leaveType, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (employee)  filter.employee  = employee;
    if (year)      filter.year      = Number(year);
    if (leaveType) filter.leaveType = leaveType;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      LeaveBalance().find(filter)
        .populate('employee', 'employeeCode displayName')
        .populate('leaveType', 'name code color isPaid')
        .sort({ year: -1 })
        .skip(skip).limit(Number(limit)).lean(),
      LeaveBalance().countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.upsertLeaveBalance = async (req, res) => {
  try {
    const { employee, leaveType, year, openingBalance, accrued } = req.body;
    if (!employee || !leaveType || !year) return fail(res, 'employee, leaveType, year required');
    const balance = await LeaveBalance().findOneAndUpdate(
      { employee, leaveType, year: Number(year) },
      { $set: { openingBalance: openingBalance || 0, accrued: accrued || 0, lastUpdated: new Date() } },
      { upsert: true, new: true }
    );
    balance.closingBalance = Math.max(0, (balance.openingBalance + balance.accrued) - (balance.taken || 0) - (balance.encashed || 0));
    await balance.save();
    _audit(req, 'LEAVE_BALANCE_UPSERTED', 'LeaveBalance', balance._id, `${employee}/${year}`, null, balance.toObject());
    return ok(res, balance, 'Leave balance updated');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Leave Accruals ────────────────────────────────────────────────────────────

exports.getLeaveAccruals = async (req, res) => {
  try {
    const { employee, year, month, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (employee) filter.employee = employee;
    if (year)     filter.year  = Number(year);
    if (month)    filter.month = Number(month);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      LeaveAccrual().find(filter).populate('employee', 'employeeCode displayName').populate('leaveType', 'name code').sort({ year: -1, month: -1 }).skip(skip).limit(Number(limit)).lean(),
      LeaveAccrual().countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createLeaveAccrual = async (req, res) => {
  try {
    const accrual = await LeaveAccrual().create({ ...req.body, processedBy: req.user._id });
    // Update balance
    const { employee, leaveType, year, days } = accrual;
    const balance = await LeaveBalance().findOneAndUpdate(
      { employee, leaveType, year },
      { $inc: { accrued: days } },
      { upsert: true, new: true }
    );
    balance.closingBalance = Math.max(0, (balance.openingBalance + balance.accrued) - (balance.taken || 0) - (balance.encashed || 0));
    await balance.save();
    _audit(req, 'LEAVE_ACCRUAL_CREATED', 'LeaveAccrual', accrual._id, `${employee}/${year}/${month}`, null, accrual.toObject());
    return created(res, accrual, 'Accrual created');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Leave Encashments ─────────────────────────────────────────────────────────

exports.getEncashments = async (req, res) => {
  try {
    const { status, employee, year, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (status)   filter.status = status;
    if (employee) filter.employee = employee;
    if (year)     filter.year = Number(year);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      LeaveEncashment().find(filter)
        .populate('employee', 'employeeCode displayName')
        .populate('leaveType', 'name code')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      LeaveEncashment().countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createEncashment = async (req, res) => {
  try {
    const enc = await LeaveEncashment().create({ ...req.body, requestedBy: req.user._id });
    _audit(req, 'LEAVE_ENCASHMENT_CREATED', 'LeaveEncashment', enc._id, enc.encashmentNumber, null, enc.toObject());
    return created(res, enc, 'Encashment request created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.approveEncashment = async (req, res) => {
  try {
    const enc = await LeaveEncashment().findOne({ _id: req.params.id, isDeleted: false });
    if (!enc) return notFound(res, 'LeaveEncashment');
    if (enc.status !== 'pending') return fail(res, 'Only pending encashments can be approved');
    const before = enc.toObject();

    enc.status      = 'approved';
    enc.approvedBy  = req.user._id;
    enc.approvedAt  = new Date();
    enc.approvedDays = req.body.approvedDays || enc.requestedDays;
    enc.totalAmount  = enc.approvedDays * (enc.perDayAmount || 0);
    await enc.save();

    // Deduct from balance
    const balance = await LeaveBalance().findOne({ employee: enc.employee, leaveType: enc.leaveType, year: enc.year });
    if (balance) {
      balance.encashed = (balance.encashed || 0) + enc.approvedDays;
      balance.closingBalance = Math.max(0, (balance.openingBalance + balance.accrued) - balance.taken - balance.encashed);
      await balance.save();
    }

    _audit(req, 'LEAVE_ENCASHMENT_APPROVED', 'LeaveEncashment', enc._id, enc.encashmentNumber, before, enc.toObject());
    return ok(res, enc, 'Encashment approved');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.rejectEncashment = async (req, res) => {
  try {
    const enc = await LeaveEncashment().findOne({ _id: req.params.id, isDeleted: false });
    if (!enc) return notFound(res, 'LeaveEncashment');
    if (enc.status !== 'pending') return fail(res, 'Only pending encashments can be rejected');
    const before = enc.toObject();
    enc.status          = 'rejected';
    enc.rejectionReason = req.body.reason || '';
    await enc.save();
    _audit(req, 'LEAVE_ENCASHMENT_REJECTED', 'LeaveEncashment', enc._id, enc.encashmentNumber, before, enc.toObject());
    return ok(res, enc, 'Encashment rejected');
  } catch (err) {
    return serverError(res, err);
  }
};

'use strict';
const mongoose   = require('mongoose');
const AuditLog   = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const Attendance    = () => mongoose.model('Attendance');
const EmployeePunch = () => mongoose.model('EmployeePunch');
const AttendanceSummary = () => mongoose.model('AttendanceSummary');
const AttendanceException = () => mongoose.model('AttendanceException');
const Holiday       = () => mongoose.model('Holiday');
const Employee      = () => mongoose.model('Employee');

// ── Helpers ──────────────────────────────────────────────────────────────────

function startOfDay(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function endOfDay(d) {
  const dt = new Date(d);
  dt.setHours(23, 59, 59, 999);
  return dt;
}

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

// ── Dashboard KPIs ────────────────────────────────────────────────────────────

exports.getDashboard = async (req, res) => {
  try {
    const today = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [
      present, absent, onLeave, late, pendingAdjustments, upcomingHolidays, totalEmployees,
    ] = await Promise.all([
      Attendance().countDocuments({ date: { $gte: today, $lte: todayEnd }, status: 'present', isDeleted: false }),
      Attendance().countDocuments({ date: { $gte: today, $lte: todayEnd }, status: 'absent', isDeleted: false }),
      Attendance().countDocuments({ date: { $gte: today, $lte: todayEnd }, status: 'on_leave', isDeleted: false }),
      Attendance().countDocuments({ date: { $gte: today, $lte: todayEnd }, isLate: true, isDeleted: false }),
      mongoose.model('AttendanceAdjustment').countDocuments({ status: 'pending', isDeleted: false }),
      Holiday().countDocuments({ date: { $gte: today }, isDeleted: false }).limit(5),
      Employee().countDocuments({ status: 'active', isDeleted: false }),
    ]);

    const holidays = await Holiday()
      .find({ date: { $gte: today }, isDeleted: false })
      .sort({ date: 1 })
      .limit(5)
      .lean();

    return ok(res, {
      kpis: { present, absent, onLeave, lateArrivals: late, pendingApprovals: pendingAdjustments, totalEmployees },
      upcomingHolidays: holidays,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Attendance Records ────────────────────────────────────────────────────────

exports.getAttendances = async (req, res) => {
  try {
    const { page = 1, limit = 20, employee, status, startDate, endDate, department } = req.query;
    const skip = (page - 1) * limit;
    const filter = { isDeleted: false };

    if (employee) filter.employee = employee;
    if (status)   filter.status = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = endOfDay(new Date(endDate));
    }

    if (department) {
      const emps = await Employee().find({ department, isDeleted: false }).distinct('_id');
      filter.employee = { $in: emps };
    }

    const [data, total] = await Promise.all([
      Attendance().find(filter)
        .populate('employee', 'employeeCode displayName department')
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Attendance().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const record = await Attendance().findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'employeeCode displayName')
      .populate('policy', 'name')
      .lean();
    if (!record) return notFound(res, 'Attendance');
    return ok(res, record);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createAttendance = async (req, res) => {
  try {
    const { employee, date, status, punchIn, punchOut, remarks } = req.body;
    if (!employee || !date) return fail(res, 'employee and date are required');

    const dayStart = startOfDay(new Date(date));
    const dayEnd   = endOfDay(new Date(date));
    const existing = await Attendance().findOne({ employee, date: { $gte: dayStart, $lte: dayEnd }, isDeleted: false });
    if (existing) return fail(res, 'Attendance record already exists for this employee on this date');

    const pi = punchIn  ? new Date(punchIn)  : null;
    const po = punchOut ? new Date(punchOut) : null;
    let totalHours = 0;
    if (pi && po) totalHours = Math.max(0, (po - pi) / 3_600_000);

    const record = await Attendance().create({
      employee, date: dayStart, status: status || 'present',
      punchIn: pi, punchOut: po, totalHours, source: 'manual', remarks,
    });

    const io = req.app.locals.io;
    if (io) io.emit('hr:attendance_marked', { employee, date: dayStart, status: record.status });

    _audit(req, 'ATTENDANCE_CREATED', 'Attendance', record._id, record.attendanceNumber, null, record.toObject());
    return created(res, record, 'Attendance created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const record = await Attendance().findOne({ _id: req.params.id, isDeleted: false });
    if (!record) return notFound(res, 'Attendance');
    const before = record.toObject();

    const { status, punchIn, punchOut, remarks, isLate, lateByMinutes, overtimeHours } = req.body;
    if (status)        record.status = status;
    if (punchIn)       record.punchIn  = new Date(punchIn);
    if (punchOut)      record.punchOut = new Date(punchOut);
    if (remarks !== undefined) record.remarks = remarks;
    if (isLate !== undefined)  record.isLate = isLate;
    if (lateByMinutes !== undefined) record.lateByMinutes = lateByMinutes;
    if (overtimeHours !== undefined) record.overtimeHours = overtimeHours;

    if (record.punchIn && record.punchOut) {
      record.totalHours = Math.max(0, (record.punchOut - record.punchIn) / 3_600_000);
    }

    await record.save();
    _audit(req, 'ATTENDANCE_UPDATED', 'Attendance', record._id, record.attendanceNumber, before, record.toObject());
    return ok(res, record, 'Attendance updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance().findOne({ _id: req.params.id, isDeleted: false });
    if (!record) return notFound(res, 'Attendance');
    record.isDeleted = true;
    await record.save();
    _audit(req, 'ATTENDANCE_DELETED', 'Attendance', record._id, record.attendanceNumber, record.toObject(), null);
    return ok(res, null, 'Attendance deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Employee Punch ────────────────────────────────────────────────────────────

exports.recordPunch = async (req, res) => {
  try {
    const { employee, punchType, deviceId, latitude, longitude, isManual, manualReason } = req.body;
    if (!employee || !punchType) return fail(res, 'employee and punchType are required');

    const punchTime = new Date();
    const punch = await EmployeePunch().create({
      employee, punchTime, punchType,
      device: deviceId || null,
      latitude, longitude,
      isManual: !!isManual,
      manualReason,
      recordedBy: req.user._id,
    });

    // Upsert today's attendance record
    const todayStart = startOfDay(punchTime);
    let att = await Attendance().findOne({ employee, date: todayStart, isDeleted: false });
    if (!att) {
      att = await Attendance().create({ employee, date: todayStart, status: 'present', source: 'device' });
    }

    if (punchType === 'in' && !att.punchIn) {
      att.punchIn = punchTime;
      att.status  = 'present';
    } else if (punchType === 'out') {
      att.punchOut = punchTime;
      if (att.punchIn) att.totalHours = Math.max(0, (att.punchOut - att.punchIn) / 3_600_000);
    }
    await att.save();

    const io = req.app.locals.io;
    if (io) io.emit('hr:attendance_marked', { employee, punchType, punchTime });

    _audit(req, 'PUNCH_RECORDED', 'EmployeePunch', punch._id, `${punchType} — ${employee}`, null, punch.toObject());
    return created(res, punch, 'Punch recorded');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getPunches = async (req, res) => {
  try {
    const { employee, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (employee) filter.employee = employee;
    if (startDate || endDate) {
      filter.punchTime = {};
      if (startDate) filter.punchTime.$gte = new Date(startDate);
      if (endDate)   filter.punchTime.$lte = endOfDay(new Date(endDate));
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      EmployeePunch().find(filter).populate('employee', 'employeeCode displayName').sort({ punchTime: -1 }).skip(skip).limit(Number(limit)).lean(),
      EmployeePunch().countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Attendance Summary ────────────────────────────────────────────────────────

exports.getSummaries = async (req, res) => {
  try {
    const { employee, year, month, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (employee) filter.employee = employee;
    if (year)     filter.year  = Number(year);
    if (month)    filter.month = Number(month);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AttendanceSummary().find(filter).populate('employee', 'employeeCode displayName').sort({ year: -1, month: -1 }).skip(skip).limit(Number(limit)).lean(),
      AttendanceSummary().countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.computeSummary = async (req, res) => {
  try {
    const { employeeId, year, month } = req.body;
    if (!employeeId || !year || !month) return fail(res, 'employeeId, year, month required');

    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0, 23, 59, 59, 999);

    const records = await Attendance().find({ employee: employeeId, date: { $gte: startDate, $lte: endDate }, isDeleted: false }).lean();

    const summary = {
      employee: employeeId, year: Number(year), month: Number(month),
      presentDays: 0, absentDays: 0, halfDays: 0, lateDays: 0,
      earlyLeavingDays: 0, leaveDays: 0, holidayDays: 0, weeklyOffDays: 0,
      totalHours: 0, overtimeHours: 0, workingDays: 0,
    };

    for (const r of records) {
      summary.totalHours    += r.totalHours || 0;
      summary.overtimeHours += r.overtimeHours || 0;
      if (r.isLate)         summary.lateDays++;
      if (r.isEarlyLeaving) summary.earlyLeavingDays++;
      switch (r.status) {
        case 'present':    summary.presentDays++;  summary.workingDays++; break;
        case 'absent':     summary.absentDays++;   summary.workingDays++; break;
        case 'half_day':   summary.halfDays++;      summary.workingDays++; break;
        case 'on_leave':   summary.leaveDays++;    break;
        case 'holiday':    summary.holidayDays++;  break;
        case 'weekly_off': summary.weeklyOffDays++;break;
        default: break;
      }
    }

    summary.attendancePercent = summary.workingDays
      ? Math.round((summary.presentDays / summary.workingDays) * 100)
      : 0;

    const result = await AttendanceSummary().findOneAndUpdate(
      { employee: employeeId, year: Number(year), month: Number(month) },
      { ...summary, lastComputedAt: new Date() },
      { upsert: true, new: true }
    );

    return ok(res, result, 'Summary computed');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Attendance Exceptions ─────────────────────────────────────────────────────

exports.getExceptions = async (req, res) => {
  try {
    const { isResolved, exceptionType, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (isResolved !== undefined) filter.isResolved = isResolved === 'true';
    if (exceptionType) filter.exceptionType = exceptionType;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AttendanceException().find(filter).populate('employee', 'employeeCode displayName').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      AttendanceException().countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.resolveException = async (req, res) => {
  try {
    const exc = await AttendanceException().findById(req.params.id);
    if (!exc) return notFound(res, 'AttendanceException');
    exc.isResolved = true;
    exc.resolvedBy = req.user._id;
    exc.resolvedAt = new Date();
    exc.resolution = req.body.resolution || '';
    await exc.save();
    _audit(req, 'EXCEPTION_RESOLVED', 'AttendanceException', exc._id, exc.exceptionType, null, exc.toObject());
    return ok(res, exc, 'Exception resolved');
  } catch (err) {
    return serverError(res, err);
  }
};

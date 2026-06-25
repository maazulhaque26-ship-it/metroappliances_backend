'use strict';
const mongoose = require('mongoose');
const { ok, fail, serverError } = require('../utils/response');

const Attendance      = () => mongoose.model('Attendance');
const LeaveBalance    = () => mongoose.model('LeaveBalance');
const LeaveRequest    = () => mongoose.model('LeaveRequest');
const AttendanceSummary = () => mongoose.model('AttendanceSummary');
const Employee        = () => mongoose.model('Employee');

function startOfDay(d) { const dt = new Date(d); dt.setHours(0,0,0,0); return dt; }
function endOfDay(d)   { const dt = new Date(d); dt.setHours(23,59,59,999); return dt; }

// ── Daily Attendance Report ───────────────────────────────────────────────────

exports.getDailyAttendance = async (req, res) => {
  try {
    const { date, department } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = startOfDay(targetDate);
    const dayEnd   = endOfDay(targetDate);

    const filter = { date: { $gte: dayStart, $lte: dayEnd }, isDeleted: false };
    if (department) {
      const emps = await Employee().find({ department, isDeleted: false }).distinct('_id');
      filter.employee = { $in: emps };
    }

    const records = await Attendance().find(filter)
      .populate('employee', 'employeeCode displayName department designation')
      .sort({ 'employee.displayName': 1 })
      .lean();

    const summary = { present: 0, absent: 0, late: 0, onLeave: 0, halfDay: 0, holiday: 0, weeklyOff: 0 };
    for (const r of records) {
      if (r.status === 'present')    summary.present++;
      else if (r.status === 'absent') summary.absent++;
      else if (r.status === 'on_leave') summary.onLeave++;
      else if (r.status === 'half_day') summary.halfDay++;
      else if (r.status === 'holiday')  summary.holiday++;
      else if (r.status === 'weekly_off') summary.weeklyOff++;
      if (r.isLate) summary.late++;
    }

    return ok(res, { date: dayStart, summary, records });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Monthly Attendance Report ─────────────────────────────────────────────────

exports.getMonthlyAttendance = async (req, res) => {
  try {
    const { year, month, department } = req.query;
    if (!year || !month) return fail(res, 'year and month are required');

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate   = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

    const summaryFilter = { year: Number(year), month: Number(month) };
    if (department) {
      const emps = await Employee().find({ department, isDeleted: false }).distinct('_id');
      summaryFilter.employee = { $in: emps };
    }

    const summaries = await AttendanceSummary().find(summaryFilter)
      .populate('employee', 'employeeCode displayName department designation')
      .sort({ attendancePercent: -1 })
      .lean();

    const totals = summaries.reduce((acc, s) => ({
      presentDays:  acc.presentDays  + s.presentDays,
      absentDays:   acc.absentDays   + s.absentDays,
      lateDays:     acc.lateDays     + s.lateDays,
      leaveDays:    acc.leaveDays    + s.leaveDays,
      totalHours:   acc.totalHours   + s.totalHours,
      overtimeHours:acc.overtimeHours+ s.overtimeHours,
    }), { presentDays: 0, absentDays: 0, lateDays: 0, leaveDays: 0, totalHours: 0, overtimeHours: 0 });

    return ok(res, { year: Number(year), month: Number(month), startDate, endDate, totals, summaries });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Late Arrivals Report ──────────────────────────────────────────────────────

exports.getLateReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    if (!startDate || !endDate) return fail(res, 'startDate and endDate are required');

    const filter = {
      isLate: true,
      date: { $gte: new Date(startDate), $lte: endOfDay(new Date(endDate)) },
      isDeleted: false,
    };

    if (department) {
      const emps = await Employee().find({ department, isDeleted: false }).distinct('_id');
      filter.employee = { $in: emps };
    }

    const records = await Attendance().find(filter)
      .populate('employee', 'employeeCode displayName department designation')
      .sort({ date: -1, lateByMinutes: -1 })
      .lean();

    return ok(res, { count: records.length, records });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Absentee Report ───────────────────────────────────────────────────────────

exports.getAbsenteeReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    if (!startDate || !endDate) return fail(res, 'startDate and endDate are required');

    const filter = {
      status: 'absent',
      date: { $gte: new Date(startDate), $lte: endOfDay(new Date(endDate)) },
      isDeleted: false,
    };

    if (department) {
      const emps = await Employee().find({ department, isDeleted: false }).distinct('_id');
      filter.employee = { $in: emps };
    }

    const records = await Attendance().find(filter)
      .populate('employee', 'employeeCode displayName department designation phone mobile')
      .sort({ date: -1 })
      .lean();

    return ok(res, { count: records.length, records });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Leave Utilization Report ──────────────────────────────────────────────────

exports.getLeaveUtilizationReport = async (req, res) => {
  try {
    const { year, department } = req.query;
    const targetYear = Number(year) || new Date().getFullYear();

    const matchStage = { status: 'approved', isDeleted: false, startDate: { $gte: new Date(targetYear, 0, 1), $lte: new Date(targetYear, 11, 31, 23, 59, 59) } };

    const pipeline = [
      { $match: matchStage },
      { $group: { _id: '$leaveType', totalRequests: { $sum: 1 }, totalDays: { $sum: '$totalDays' } } },
      { $lookup: { from: 'leavetypes', localField: '_id', foreignField: '_id', as: 'lt' } },
      { $unwind: '$lt' },
      { $project: { leaveTypeName: '$lt.name', leaveTypeCode: '$lt.code', color: '$lt.color', totalRequests: 1, totalDays: 1 } },
      { $sort: { totalDays: -1 } },
    ];

    const data = await LeaveRequest().aggregate(pipeline);
    return ok(res, { year: targetYear, data });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Leave Balance Report ──────────────────────────────────────────────────────

exports.getLeaveBalanceReport = async (req, res) => {
  try {
    const { year, department, leaveType } = req.query;
    const targetYear = Number(year) || new Date().getFullYear();

    const filter = { year: targetYear };
    if (leaveType) filter.leaveType = leaveType;

    if (department) {
      const emps = await Employee().find({ department, isDeleted: false }).distinct('_id');
      filter.employee = { $in: emps };
    }

    const balances = await LeaveBalance().find(filter)
      .populate('employee', 'employeeCode displayName department designation')
      .populate('leaveType', 'name code color isPaid')
      .sort({ closingBalance: -1 })
      .lean();

    return ok(res, { year: targetYear, count: balances.length, balances });
  } catch (err) {
    return serverError(res, err);
  }
};

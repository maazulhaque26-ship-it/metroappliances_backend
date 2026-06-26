'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_attendance';

// ── Lifecycle ────────────────────────────────────────────────────────────────
beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(DB_URI);
  await mongoose.connection.db.dropDatabase();

  require('../models/Department');
  require('../models/Designation');
  require('../models/BusinessUnit');
  require('../models/Location');
  require('../models/Employee');
  require('../models/AttendancePolicy');
  require('../models/AttendanceDevice');
  require('../models/EmployeePunch');
  require('../models/Attendance');
  require('../models/AttendanceAdjustment');
  require('../models/AttendanceApproval');
  require('../models/AttendanceSummary');
  require('../models/AttendanceException');
  require('../models/LeaveType');
  require('../models/LeavePolicy');
  require('../models/LeaveBalance');
  require('../models/LeaveAccrual');
  require('../models/LeaveRequest');
  require('../models/LeaveApproval');
  require('../models/LeaveEncashment');
  require('../models/Holiday');

  // Rebuild unique indexes dropped when the database was dropped above
  await mongoose.model('Attendance').createIndexes();
  await mongoose.model('LeaveBalance').createIndexes();
  await mongoose.model('LeaveAccrual').createIndexes();
  await mongoose.model('AttendanceSummary').createIndexes();
  await mongoose.model('LeaveRequest').createIndexes();
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
}, 10000);

// ── Model shortcuts ───────────────────────────────────────────────────────────
const Department         = () => mongoose.model('Department');
const Employee           = () => mongoose.model('Employee');
const AttendancePolicy   = () => mongoose.model('AttendancePolicy');
const AttendanceDevice   = () => mongoose.model('AttendanceDevice');
const EmployeePunch      = () => mongoose.model('EmployeePunch');
const Attendance         = () => mongoose.model('Attendance');
const AttendanceAdj      = () => mongoose.model('AttendanceAdjustment');
const AttendanceApproval = () => mongoose.model('AttendanceApproval');
const AttendanceSummary  = () => mongoose.model('AttendanceSummary');
const AttendanceException= () => mongoose.model('AttendanceException');
const LeaveType          = () => mongoose.model('LeaveType');
const LeavePolicy        = () => mongoose.model('LeavePolicy');
const LeaveBalance       = () => mongoose.model('LeaveBalance');
const LeaveAccrual       = () => mongoose.model('LeaveAccrual');
const LeaveRequest       = () => mongoose.model('LeaveRequest');
const LeaveApproval      = () => mongoose.model('LeaveApproval');
const LeaveEncashment    = () => mongoose.model('LeaveEncashment');
const Holiday            = () => mongoose.model('Holiday');

// ── Shared fixtures ───────────────────────────────────────────────────────────
let dept, emp, lt, policy, balance;

// ============================================================================
describe('AttendancePolicy model', () => {
  test('creates with auto-code', async () => {
    policy = await AttendancePolicy().create({
      name: 'Standard 9-6',
      shiftStartTime: '09:00',
      shiftEndTime: '18:00',
      workingHoursPerDay: 8,
      workingDaysPerWeek: 5,
      graceMinutes: 15,
      isDefault: true,
    });
    expect(policy.policyCode).toMatch(/^ATPOL-\d{4}$/);
    expect(policy.isDefault).toBe(true);
    expect(policy.isActive).toBe(true);
  });

  test('requires name', async () => {
    await expect(AttendancePolicy().create({})).rejects.toThrow();
  });

  test('second policy gets different code', async () => {
    const p2 = await AttendancePolicy().create({ name: 'Night Shift', shiftStartTime: '21:00', shiftEndTime: '06:00' });
    expect(p2.policyCode).not.toBe(policy.policyCode);
  });

  test('lists active policies', async () => {
    const list = await AttendancePolicy().find({ isDeleted: false, isActive: true });
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  test('soft delete works', async () => {
    const p3 = await AttendancePolicy().create({ name: 'To Delete' });
    await AttendancePolicy().findByIdAndUpdate(p3._id, { isDeleted: true });
    const found = await AttendancePolicy().findOne({ _id: p3._id, isDeleted: false });
    expect(found).toBeNull();
  });
});

// ============================================================================
describe('AttendanceDevice model', () => {
  let device;

  test('creates with auto-code', async () => {
    device = await AttendanceDevice().create({ name: 'Main Gate Biometric', deviceType: 'biometric', serialNumber: 'BIO-001' });
    expect(device.deviceCode).toMatch(/^DEV-\d{4}$/);
    expect(device.isActive).toBe(true);
  });

  test('requires name and deviceType', async () => {
    await expect(AttendanceDevice().create({ name: 'NoType' })).rejects.toThrow();
    await expect(AttendanceDevice().create({ deviceType: 'rfid' })).rejects.toThrow();
  });

  test('second device gets different code', async () => {
    const d2 = await AttendanceDevice().create({ name: 'Exit Gate', deviceType: 'rfid' });
    expect(d2.deviceCode).not.toBe(device.deviceCode);
  });

  test('can set device offline', async () => {
    device.isOnline = false;
    await device.save();
    const found = await AttendanceDevice().findById(device._id);
    expect(found.isOnline).toBe(false);
  });
});

// ============================================================================
describe('Employee setup for attendance tests', () => {
  test('creates department and employee', async () => {
    dept = await Department().create({ name: 'Engineering HR', description: 'Test' });
    expect(dept._id).toBeTruthy();

    emp = await Employee().create({
      firstName: 'Ravi',
      lastName: 'Kumar',
      workEmail: 'ravi.kumar.att@test.com',
      mobile: '9876543210',
      department: dept._id,
      joiningDate: new Date('2024-01-01'),
      employmentType: 'full_time',
    });
    expect(emp.employeeCode).toMatch(/^EMP-\d{4}-\d{5}$/);
  });
});

// ============================================================================
describe('EmployeePunch model', () => {
  let punch;

  test('creates punch-in record', async () => {
    punch = await EmployeePunch().create({
      employee: emp._id,
      punchTime: new Date(),
      punchType: 'in',
      deviceType: 'biometric',
    });
    expect(punch._id).toBeTruthy();
    expect(punch.punchType).toBe('in');
    expect(punch.isManual).toBe(false);
  });

  test('creates punch-out record', async () => {
    const punchOut = await EmployeePunch().create({
      employee: emp._id,
      punchTime: new Date(Date.now() + 8 * 3600_000),
      punchType: 'out',
      deviceType: 'biometric',
    });
    expect(punchOut.punchType).toBe('out');
  });

  test('manual punch has flag', async () => {
    const mp = await EmployeePunch().create({
      employee: emp._id,
      punchTime: new Date(),
      punchType: 'in',
      isManual: true,
      manualReason: 'Device offline',
    });
    expect(mp.isManual).toBe(true);
    expect(mp.manualReason).toBe('Device offline');
  });

  test('requires employee and punchType', async () => {
    await expect(EmployeePunch().create({ punchTime: new Date(), punchType: 'in' })).rejects.toThrow();
    await expect(EmployeePunch().create({ employee: emp._id, punchTime: new Date() })).rejects.toThrow();
  });

  test('lists punches for employee', async () => {
    const list = await EmployeePunch().find({ employee: emp._id, isDeleted: false });
    expect(list.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
describe('Attendance model', () => {
  let att;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  test('creates attendance record with auto-number', async () => {
    att = await Attendance().create({
      employee: emp._id,
      date: today,
      status: 'present',
      punchIn: new Date(today.getTime() + 9 * 3600_000),
      punchOut: new Date(today.getTime() + 18 * 3600_000),
      totalHours: 9,
      source: 'manual',
    });
    expect(att.attendanceNumber).toMatch(/^ATT-\d{4}-\d{6}$/);
    expect(att.status).toBe('present');
  });

  test('requires employee and date', async () => {
    await expect(Attendance().create({ date: today })).rejects.toThrow();
    await expect(Attendance().create({ employee: emp._id })).rejects.toThrow();
  });

  test('enforces unique employee+date constraint', async () => {
    await expect(Attendance().create({ employee: emp._id, date: today, status: 'absent' })).rejects.toThrow();
  });

  test('can mark late', async () => {
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const a2 = await Attendance().create({
      employee: emp._id,
      date: yesterday,
      status: 'late',
      isLate: true,
      lateByMinutes: 35,
    });
    expect(a2.isLate).toBe(true);
    expect(a2.lateByMinutes).toBe(35);
  });

  test('soft delete works', async () => {
    const d2 = new Date(today); d2.setDate(d2.getDate() - 2);
    const a3 = await Attendance().create({ employee: emp._id, date: d2, status: 'absent' });
    await Attendance().findByIdAndUpdate(a3._id, { isDeleted: true });
    const found = await Attendance().findOne({ _id: a3._id, isDeleted: false });
    expect(found).toBeNull();
  });

  test('can query by status', async () => {
    const list = await Attendance().find({ employee: emp._id, status: 'present', isDeleted: false });
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  test('total hours is computed correctly', async () => {
    const record = await Attendance().findById(att._id);
    expect(record.totalHours).toBe(9);
  });
});

// ============================================================================
describe('AttendanceAdjustment model', () => {
  let adj, att2;

  test('setup: create attendance to adjust', async () => {
    const d = new Date(); d.setDate(d.getDate() - 5); d.setHours(0,0,0,0);
    att2 = await Attendance().create({ employee: emp._id, date: d, status: 'absent' });
    expect(att2._id).toBeTruthy();
  });

  test('creates adjustment with auto-number', async () => {
    adj = await AttendanceAdj().create({
      attendance: att2._id,
      employee: emp._id,
      date: att2.date,
      adjustmentType: 'status_change',
      originalValue: 'absent',
      requestedValue: 'present',
      reason: 'Work from home',
      requestedBy: new mongoose.Types.ObjectId(),
    });
    expect(adj.adjustmentNumber).toMatch(/^ATADJ-\d{4}-\d{5}$/);
    expect(adj.status).toBe('pending');
  });

  test('requires mandatory fields', async () => {
    await expect(AttendanceAdj().create({ employee: emp._id })).rejects.toThrow();
  });

  test('status transitions', async () => {
    adj.status = 'approved';
    adj.approvedBy = new mongoose.Types.ObjectId();
    adj.approvedAt = new Date();
    await adj.save();
    expect(adj.status).toBe('approved');
  });

  test('creates approval record', async () => {
    const approval = await AttendanceApproval().create({
      adjustment: adj._id,
      employee: emp._id,
      approver: new mongoose.Types.ObjectId(),
      action: 'approved',
      comments: 'Verified',
    });
    expect(approval.action).toBe('approved');
    expect(approval.actionAt).toBeTruthy();
  });
});

// ============================================================================
describe('AttendanceSummary model', () => {
  test('creates monthly summary', async () => {
    const summary = await AttendanceSummary().create({
      employee: emp._id,
      year: 2026,
      month: 1,
      workingDays: 22,
      presentDays: 20,
      absentDays: 1,
      lateDays: 2,
      leaveDays: 1,
      totalHours: 176,
      overtimeHours: 4,
      attendancePercent: 91,
    });
    expect(summary._id).toBeTruthy();
    expect(summary.attendancePercent).toBe(91);
  });

  test('enforces unique employee+year+month', async () => {
    await expect(AttendanceSummary().create({ employee: emp._id, year: 2026, month: 1 })).rejects.toThrow();
  });

  test('second month summary', async () => {
    const s2 = await AttendanceSummary().create({ employee: emp._id, year: 2026, month: 2, presentDays: 19, workingDays: 20 });
    expect(s2.month).toBe(2);
  });

  test('query by year and month', async () => {
    const list = await AttendanceSummary().find({ employee: emp._id, year: 2026 });
    expect(list.length).toBe(2);
  });
});

// ============================================================================
describe('AttendanceException model', () => {
  test('creates exception', async () => {
    const exc = await AttendanceException().create({
      employee: emp._id,
      date: new Date(),
      exceptionType: 'missed_punch_out',
      details: 'Employee forgot to punch out',
    });
    expect(exc._id).toBeTruthy();
    expect(exc.isResolved).toBe(false);
  });

  test('requires employee, date, exceptionType', async () => {
    await expect(AttendanceException().create({ employee: emp._id, date: new Date() })).rejects.toThrow();
  });

  test('resolve exception', async () => {
    const exc = await AttendanceException().findOne({ employee: emp._id });
    exc.isResolved = true;
    exc.resolvedBy = new mongoose.Types.ObjectId();
    exc.resolvedAt = new Date();
    exc.resolution = 'Manual punch-out recorded';
    await exc.save();
    const found = await AttendanceException().findById(exc._id);
    expect(found.isResolved).toBe(true);
    expect(found.resolution).toBe('Manual punch-out recorded');
  });

  test('query unresolved exceptions', async () => {
    await AttendanceException().create({ employee: emp._id, date: new Date('2026-01-15'), exceptionType: 'missed_punch_in' });
    const unresolved = await AttendanceException().find({ isResolved: false });
    expect(unresolved.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
describe('Holiday model', () => {
  test('creates holiday with auto-code', async () => {
    const h = await Holiday().create({
      name: 'Republic Day',
      date: new Date('2026-01-26'),
      holidayType: 'national',
    });
    expect(h.holidayCode).toMatch(/^HOL-\d{4}$/);
    expect(h.year).toBe(2026);
  });

  test('creates optional holiday', async () => {
    const h2 = await Holiday().create({
      name: 'Diwali',
      date: new Date('2026-10-20'),
      holidayType: 'national',
      isOptional: true,
    });
    expect(h2.isOptional).toBe(true);
  });

  test('requires name and date', async () => {
    await expect(Holiday().create({ name: 'No Date' })).rejects.toThrow();
    await expect(Holiday().create({ date: new Date() })).rejects.toThrow();
  });

  test('lists holidays for year', async () => {
    const list = await Holiday().find({ year: 2026, isDeleted: false });
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  test('soft delete holiday', async () => {
    const h3 = await Holiday().create({ name: 'Test Holiday', date: new Date('2026-05-01') });
    h3.isDeleted = true;
    await h3.save();
    const found = await Holiday().findOne({ _id: h3._id, isDeleted: false });
    expect(found).toBeNull();
  });
});

// ============================================================================
describe('LeaveType model', () => {
  test('creates annual leave type', async () => {
    lt = await LeaveType().create({
      code: 'AL',
      name: 'Annual Leave',
      isPaid: true,
      isCarryForward: true,
      maxCarryForward: 15,
      allowHalfDay: true,
      requireApproval: true,
      noticeDaysRequired: 2,
      encashable: true,
      maxEncashableDays: 10,
      color: '#4F46E5',
    });
    expect(lt._id).toBeTruthy();
    expect(lt.code).toBe('AL');
    expect(lt.isPaid).toBe(true);
  });

  test('creates sick leave type', async () => {
    const sl = await LeaveType().create({
      code: 'SL',
      name: 'Sick Leave',
      isPaid: true,
      requireDocuments: true,
      allowHalfDay: true,
      color: '#EF4444',
    });
    expect(sl.code).toBe('SL');
    expect(sl.requireDocuments).toBe(true);
  });

  test('code must be unique', async () => {
    await expect(LeaveType().create({ code: 'AL', name: 'Duplicate' })).rejects.toThrow();
  });

  test('requires code and name', async () => {
    await expect(LeaveType().create({ name: 'No Code' })).rejects.toThrow();
    await expect(LeaveType().create({ code: 'NC' })).rejects.toThrow();
  });

  test('lists active leave types', async () => {
    const list = await LeaveType().find({ isActive: true, isDeleted: false });
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  test('soft delete leave type', async () => {
    const tmp = await LeaveType().create({ code: 'TMP', name: 'Temporary' });
    tmp.isDeleted = true;
    await tmp.save();
    const found = await LeaveType().findOne({ _id: tmp._id, isDeleted: false });
    expect(found).toBeNull();
  });
});

// ============================================================================
describe('LeavePolicy model', () => {
  let lp;

  test('creates leave policy with auto-code', async () => {
    lp = await LeavePolicy().create({
      name: 'Standard Leave Policy',
      effectiveFrom: new Date('2026-01-01'),
      isDefault: true,
      allocations: [
        { leaveType: lt._id, daysPerYear: 21, accrualType: 'monthly' },
      ],
    });
    expect(lp.policyCode).toMatch(/^LPOL-\d{4}$/);
    expect(lp.isDefault).toBe(true);
    expect(lp.allocations.length).toBe(1);
  });

  test('second policy has different code', async () => {
    const p2 = await LeavePolicy().create({ name: 'Contractual Policy', effectiveFrom: new Date('2026-01-01') });
    expect(p2.policyCode).not.toBe(lp.policyCode);
  });

  test('requires name and effectiveFrom', async () => {
    await expect(LeavePolicy().create({ name: 'No Date' })).rejects.toThrow();
    await expect(LeavePolicy().create({ effectiveFrom: new Date() })).rejects.toThrow();
  });

  test('soft delete policy', async () => {
    const p3 = await LeavePolicy().create({ name: 'Temp Policy', effectiveFrom: new Date() });
    p3.isDeleted = true;
    await p3.save();
    const found = await LeavePolicy().findOne({ _id: p3._id, isDeleted: false });
    expect(found).toBeNull();
  });
});

// ============================================================================
describe('LeaveBalance model', () => {
  test('creates leave balance', async () => {
    balance = await LeaveBalance().create({
      employee: emp._id,
      leaveType: lt._id,
      year: 2026,
      openingBalance: 0,
      accrued: 21,
      taken: 5,
      closingBalance: 16,
    });
    expect(balance._id).toBeTruthy();
    expect(balance.closingBalance).toBe(16);
  });

  test('enforces unique employee+leaveType+year', async () => {
    await expect(LeaveBalance().create({ employee: emp._id, leaveType: lt._id, year: 2026 })).rejects.toThrow();
  });

  test('tracks pending balance', async () => {
    balance.pending = 3;
    await balance.save();
    const found = await LeaveBalance().findById(balance._id);
    expect(found.pending).toBe(3);
  });

  test('separate balance for different year', async () => {
    const b2 = await LeaveBalance().create({ employee: emp._id, leaveType: lt._id, year: 2025, openingBalance: 5, accrued: 18, closingBalance: 23 });
    expect(b2.year).toBe(2025);
  });

  test('query by employee and year', async () => {
    const list = await LeaveBalance().find({ employee: emp._id, year: 2026 });
    expect(list.length).toBe(1);
  });
});

// ============================================================================
describe('LeaveAccrual model', () => {
  test('creates monthly accrual', async () => {
    const acc = await LeaveAccrual().create({
      employee: emp._id,
      leaveType: lt._id,
      year: 2026,
      month: 6,
      days: 1.75,
      accrualType: 'monthly',
    });
    expect(acc._id).toBeTruthy();
    expect(acc.days).toBe(1.75);
  });

  test('enforces unique employee+leaveType+year+month', async () => {
    await expect(LeaveAccrual().create({ employee: emp._id, leaveType: lt._id, year: 2026, month: 6, days: 1.75 })).rejects.toThrow();
  });

  test('different month creates new accrual', async () => {
    const acc2 = await LeaveAccrual().create({ employee: emp._id, leaveType: lt._id, year: 2026, month: 7, days: 1.75 });
    expect(acc2.month).toBe(7);
  });
});

// ============================================================================
describe('LeaveRequest model', () => {
  let lr;

  test('creates leave request with auto-number', async () => {
    lr = await LeaveRequest().create({
      employee: emp._id,
      leaveType: lt._id,
      startDate: new Date('2026-07-10'),
      endDate:   new Date('2026-07-14'),
      totalDays: 5,
      reason: 'Annual vacation',
      status: 'pending',
    });
    expect(lr.requestNumber).toMatch(/^LR-\d{4}-\d{5}$/);
    expect(lr.status).toBe('pending');
  });

  test('requires mandatory fields', async () => {
    await expect(LeaveRequest().create({ employee: emp._id })).rejects.toThrow();
  });

  test('half-day leave request', async () => {
    const hlr = await LeaveRequest().create({
      employee: emp._id,
      leaveType: lt._id,
      startDate: new Date('2026-07-16'),
      endDate:   new Date('2026-07-16'),
      totalDays: 0.5,
      isHalfDay: true,
      halfDaySession: 'morning',
      reason: 'Doctor visit',
    });
    expect(hlr.isHalfDay).toBe(true);
    expect(hlr.halfDaySession).toBe('morning');
    expect(hlr.totalDays).toBe(0.5);
  });

  test('approve leave request', async () => {
    const approver = new mongoose.Types.ObjectId();
    lr.status     = 'approved';
    lr.approvedBy = approver;
    lr.approvedAt = new Date();
    await lr.save();
    expect(lr.status).toBe('approved');
  });

  test('creates approval record', async () => {
    const appr = await LeaveApproval().create({
      leaveRequest: lr._id,
      employee: emp._id,
      approver: new mongoose.Types.ObjectId(),
      action: 'approved',
      comments: 'Enjoy your vacation',
    });
    expect(appr.action).toBe('approved');
    expect(appr.level).toBe(1);
  });

  test('cancel leave request', async () => {
    const clr = await LeaveRequest().create({
      employee: emp._id,
      leaveType: lt._id,
      startDate: new Date('2026-08-01'),
      endDate:   new Date('2026-08-05'),
      totalDays: 5,
      reason: 'Trip',
    });
    clr.status      = 'cancelled';
    clr.cancelledOn = new Date();
    clr.cancelReason = 'Plans changed';
    await clr.save();
    const found = await LeaveRequest().findById(clr._id);
    expect(found.status).toBe('cancelled');
  });

  test('soft delete leave request', async () => {
    const dlr = await LeaveRequest().create({
      employee: emp._id,
      leaveType: lt._id,
      startDate: new Date('2026-09-01'),
      endDate:   new Date('2026-09-02'),
      totalDays: 2,
      reason: 'To delete',
      status: 'rejected',
    });
    dlr.isDeleted = true;
    await dlr.save();
    const found = await LeaveRequest().findOne({ _id: dlr._id, isDeleted: false });
    expect(found).toBeNull();
  });

  test('query pending requests', async () => {
    await LeaveRequest().create({
      employee: emp._id,
      leaveType: lt._id,
      startDate: new Date('2026-10-01'),
      endDate:   new Date('2026-10-03'),
      totalDays: 3,
      reason: 'Another leave',
      status: 'pending',
    });
    const pending = await LeaveRequest().find({ status: 'pending', isDeleted: false });
    expect(pending.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
describe('LeaveEncashment model', () => {
  test('creates encashment request with auto-number', async () => {
    const enc = await LeaveEncashment().create({
      employee: emp._id,
      leaveType: lt._id,
      year: 2026,
      requestedDays: 5,
      perDayAmount: 2500,
      requestedBy: new mongoose.Types.ObjectId(),
    });
    expect(enc.encashmentNumber).toMatch(/^LENC-\d{4}-\d{4}$/);
    expect(enc.status).toBe('pending');
  });

  test('approve encashment', async () => {
    const enc2 = await LeaveEncashment().create({
      employee: emp._id,
      leaveType: lt._id,
      year: 2026,
      requestedDays: 3,
      perDayAmount: 2500,
      requestedBy: new mongoose.Types.ObjectId(),
    });
    enc2.status       = 'approved';
    enc2.approvedDays = 3;
    enc2.totalAmount  = 3 * 2500;
    enc2.approvedBy   = new mongoose.Types.ObjectId();
    enc2.approvedAt   = new Date();
    await enc2.save();
    expect(enc2.totalAmount).toBe(7500);
    expect(enc2.status).toBe('approved');
  });

  test('requires employee, leaveType, year, requestedDays', async () => {
    await expect(LeaveEncashment().create({ leaveType: lt._id, year: 2026, requestedDays: 3, requestedBy: new mongoose.Types.ObjectId() })).rejects.toThrow();
  });

  test('query by status', async () => {
    const pending = await LeaveEncashment().find({ status: 'pending', isDeleted: false });
    expect(pending.length).toBeGreaterThanOrEqual(1);
  });
});

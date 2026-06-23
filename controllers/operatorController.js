'use strict';
const OperatorShift      = require('../models/OperatorShift');
const OperatorAttendance = require('../models/OperatorAttendance');
const OperatorSkill      = require('../models/OperatorSkill');
const ProductionEvent    = require('../models/ProductionEvent');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');

// ─── Shifts ───────────────────────────────────────────────────────────────────
exports.assignShift = async (req, res) => {
  try {
    const { operator, shift, factory, date } = req.body;
    if (!operator || !shift || !factory || !date) return fail(res, 'operator, shift, factory and date are required');
    const doc = await OperatorShift.create(req.body);
    return created(res, doc, 'Shift assigned');
  } catch (err) { return serverError(res, err); }
};

exports.getShiftAssignments = async (req, res) => {
  try {
    const { page = 1, limit = 20, operator, factory, shift, date, status } = req.query;
    const filter = { isDeleted: false };
    if (operator) filter.operator = operator;
    if (factory)  filter.factory  = factory;
    if (shift)    filter.shift    = shift;
    if (status)   filter.status   = status;
    if (date)     filter.date     = { $gte: new Date(new Date(date).setHours(0,0,0,0)), $lte: new Date(new Date(date).setHours(23,59,59,999)) };
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await OperatorShift.countDocuments(filter);
    const data  = await OperatorShift.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit))
      .populate('operator', 'name email').populate('shift', 'name').populate('factory', 'name')
      .populate('workCenter', 'name');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.updateShiftAssignment = async (req, res) => {
  try {
    const doc = await OperatorShift.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Shift assignment');
    if (['completed','absent'].includes(doc.status)) return fail(res, `Cannot edit a ${doc.status} shift`);
    const allowed = ['workCenter','status','notes','hoursWorked','overtimeHours'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    await doc.save();
    return ok(res, doc, 'Shift assignment updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteShiftAssignment = async (req, res) => {
  try {
    const doc = await OperatorShift.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Shift assignment');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ─── Attendance ───────────────────────────────────────────────────────────────
exports.recordAttendance = async (req, res) => {
  try {
    const { operator, factory, date, status } = req.body;
    if (!operator || !factory || !date || !status) return fail(res, 'operator, factory, date and status are required');
    const existing = await OperatorAttendance.findOne({ operator, factory, date: { $gte: new Date(new Date(date).setHours(0,0,0,0)), $lte: new Date(new Date(date).setHours(23,59,59,999)) }, isDeleted: false });
    if (existing) {
      const allowed = ['status','checkIn','checkOut','hoursWorked','overtimeHours','lateMinutes','notes'];
      for (const k of allowed) if (req.body[k] !== undefined) existing[k] = req.body[k];
      await existing.save();
      return ok(res, existing, 'Attendance updated');
    }
    const doc = await OperatorAttendance.create({ ...req.body, checkIn: req.body.checkIn ? new Date(req.body.checkIn) : new Date() });
    if (status === 'present' || status === 'late') {
      await ProductionEvent.create({ eventType: 'operator_clocked_in', operator, factory, message: `Operator clocked in${status === 'late' ? ' (late)' : ''}`, severity: 'info', metadata: { attendanceId: doc._id, status } });
    }
    return created(res, doc, 'Attendance recorded');
  } catch (err) { return serverError(res, err); }
};

exports.clockOut = async (req, res) => {
  try {
    const doc = await OperatorAttendance.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Attendance');
    if (doc.checkOut) return fail(res, 'Already clocked out');
    doc.checkOut = req.body.checkOut ? new Date(req.body.checkOut) : new Date();
    if (doc.checkIn) doc.hoursWorked = Math.round((doc.checkOut.getTime() - doc.checkIn.getTime()) / 36000) / 100;
    if (req.body.overtimeHours !== undefined) doc.overtimeHours = req.body.overtimeHours;
    await doc.save();
    await ProductionEvent.create({ eventType: 'operator_clocked_out', operator: doc.operator, factory: doc.factory, message: `Operator clocked out after ${doc.hoursWorked} hrs`, severity: 'info', metadata: { attendanceId: doc._id } });
    return ok(res, doc, 'Clocked out successfully');
  } catch (err) { return serverError(res, err); }
};

exports.getAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 20, operator, factory, status, dateFrom, dateTo } = req.query;
    const filter = { isDeleted: false };
    if (operator) filter.operator = operator;
    if (factory)  filter.factory  = factory;
    if (status)   filter.status   = status;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo)   filter.date.$lte = new Date(dateTo);
    }
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await OperatorAttendance.countDocuments(filter);
    const data  = await OperatorAttendance.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit))
      .populate('operator', 'name email').populate('factory', 'name');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ─── Skills ───────────────────────────────────────────────────────────────────
exports.addSkill = async (req, res) => {
  try {
    const { operator, skillName, proficiencyLevel } = req.body;
    if (!operator || !skillName || !proficiencyLevel) return fail(res, 'operator, skillName and proficiencyLevel are required');
    const existing = await OperatorSkill.findOne({ operator, skillName, isDeleted: false });
    if (existing) return fail(res, 'Skill already exists for this operator');
    const doc = await OperatorSkill.create(req.body);
    return created(res, doc, 'Skill added');
  } catch (err) { return serverError(res, err); }
};

exports.getSkills = async (req, res) => {
  try {
    const { operator, skillCategory, proficiencyLevel, isActive } = req.query;
    const filter = { isDeleted: false };
    if (operator)        filter.operator        = operator;
    if (skillCategory)   filter.skillCategory   = skillCategory;
    if (proficiencyLevel) filter.proficiencyLevel = Number(proficiencyLevel);
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const data = await OperatorSkill.find(filter).sort({ operator: 1, skillCategory: 1, skillName: 1 })
      .populate('operator', 'name email');
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.updateSkill = async (req, res) => {
  try {
    const doc = await OperatorSkill.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Skill');
    const allowed = ['proficiencyLevel','isActive','certificationDate','certificationExpiry','certificationBody','notes'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    await doc.save();
    return ok(res, doc, 'Skill updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteSkill = async (req, res) => {
  try {
    const doc = await OperatorSkill.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Skill');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

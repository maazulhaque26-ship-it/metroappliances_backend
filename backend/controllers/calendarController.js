'use strict';
const MachineCalendar    = require('../models/MachineCalendar');
const ProductionCalendar = require('../models/ProductionCalendar');
const HolidayCalendar    = require('../models/HolidayCalendar');
const PlanningConstraint = require('../models/PlanningConstraint');
const AuditLog           = require('../models/AuditLog');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');

function audit(req, action, entity, doc, before = null) {
  try {
    AuditLog.create({
      admin: req.user._id,
      adminName:  req.user.name  || '',
      adminEmail: req.user.email || '',
      adminRole:  req.user.role  || 'admin',
      action,
      entity,
      entityId:    doc._id,
      entityLabel: String(doc._id),
      changes:     { before, after: doc.toObject ? doc.toObject() : doc },
      ip:          req.ip,
      userAgent:   req.get('user-agent') || '',
    });
  } catch (_) {}
}

// ── Machine Calendar ──────────────────────────────────────────────────────────

exports.getMachineCalendar = async (req, res) => {
  try {
    const { machine, factory, from, to } = req.query;
    const q = {};
    if (machine) q.machine = machine;
    if (factory) q.factory = factory;
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = new Date(from);
      if (to)   q.date.$lte = new Date(to);
    }
    const docs = await MachineCalendar.find(q)
      .populate('machine', 'name serialNumber')
      .populate('shift',   'name shiftType')
      .sort({ date: 1 })
      .lean();
    return ok(res, docs);
  } catch (e) {
    return serverError(res, e);
  }
};

exports.getMachineCalendarBulk = async (req, res) => {
  try {
    const { factory, from, to } = req.query;
    if (!factory) return fail(res, 'factory is required', 422);
    const q = { factory };
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = new Date(from);
      if (to)   q.date.$lte = new Date(to);
    }
    const docs = await MachineCalendar.find(q)
      .populate('machine', 'name serialNumber status')
      .populate('shift',   'name shiftType')
      .sort({ date: 1, machine: 1 })
      .lean();

    // Group by machine for easier frontend rendering
    const grouped = {};
    for (const d of docs) {
      const key = String(d.machine?._id || d.machine);
      if (!grouped[key]) grouped[key] = { machine: d.machine, days: [] };
      grouped[key].days.push(d);
    }
    return ok(res, Object.values(grouped));
  } catch (e) {
    return serverError(res, e);
  }
};

exports.setMachineAvailability = async (req, res) => {
  try {
    const { machine, factory, date, shift, available, unavailableReason, plannedHours, notes } = req.body;
    if (!machine || !factory || !date) {
      return fail(res, 'machine, factory, and date are required', 422);
    }
    const doc = await MachineCalendar.findOneAndUpdate(
      { machine, date: new Date(date) },
      { machine, factory, date: new Date(date), shift, available, unavailableReason, plannedHours, notes, createdBy: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );
    audit(req, 'upsert', 'MachineCalendar', doc);
    return ok(res, doc);
  } catch (e) {
    if (e.name === 'ValidationError') return fail(res, e.message, 422);
    return serverError(res, e);
  }
};

// ── Production Calendar ───────────────────────────────────────────────────────

exports.getProductionCalendar = async (req, res) => {
  try {
    const { factory, from, to } = req.query;
    if (!factory) return fail(res, 'factory is required', 422);
    const q = { factory };
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = new Date(from);
      if (to)   q.date.$lte = new Date(to);
    }
    const docs = await ProductionCalendar.find(q)
      .populate('shifts',  'name shiftType')
      .populate('holiday', 'name type')
      .sort({ date: 1 })
      .lean();
    return ok(res, docs);
  } catch (e) {
    return serverError(res, e);
  }
};

exports.setProductionDay = async (req, res) => {
  try {
    const { factory, date, isWorkingDay, shifts, plannedOutput, holiday, notes } = req.body;
    if (!factory || !date) return fail(res, 'factory and date are required', 422);
    const doc = await ProductionCalendar.findOneAndUpdate(
      { factory, date: new Date(date) },
      { factory, date: new Date(date), isWorkingDay, shifts, plannedOutput, holiday, notes },
      { upsert: true, new: true, runValidators: true }
    );
    audit(req, 'upsert', 'ProductionCalendar', doc);
    return ok(res, doc);
  } catch (e) {
    if (e.name === 'ValidationError') return fail(res, e.message, 422);
    return serverError(res, e);
  }
};

exports.generateCalendar = async (req, res) => {
  try {
    const { factory, from, to, defaultShifts = [], workDays = [1,2,3,4,5] } = req.body;
    if (!factory || !from || !to) return fail(res, 'factory, from, and to are required', 422);

    const start = new Date(from);
    const end   = new Date(to);
    if (end <= start) return fail(res, 'to must be after from', 422);

    const ops = [];
    const cur = new Date(start);
    while (cur <= end) {
      const dow = cur.getDay();
      const isWorkingDay = workDays.includes(dow);
      ops.push({
        updateOne: {
          filter: { factory, date: new Date(cur) },
          update: { $setOnInsert: { factory, date: new Date(cur), isWorkingDay, shifts: isWorkingDay ? defaultShifts : [] } },
          upsert: true,
        },
      });
      cur.setDate(cur.getDate() + 1);
    }

    const result = await ProductionCalendar.bulkWrite(ops);
    return ok(res, { upserted: result.upsertedCount, modified: result.modifiedCount });
  } catch (e) {
    return serverError(res, e);
  }
};

// ── Holiday Calendar ──────────────────────────────────────────────────────────

exports.getHolidays = async (req, res) => {
  try {
    const { year, type, factory, page = 1, limit = 50 } = req.query;
    const q = { isDeleted: false };
    if (year)    q.year = +year;
    if (type)    q.type = type;
    if (factory) q.factories = factory;

    const total    = await HolidayCalendar.countDocuments(q);
    const holidays = await HolidayCalendar.find(q)
      .populate('factories', 'name')
      .sort({ date: 1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .lean();

    return paginated(res, holidays, { total, page: +page, limit: +limit });
  } catch (e) {
    return serverError(res, e);
  }
};

exports.createHoliday = async (req, res) => {
  try {
    const doc = await HolidayCalendar.create({ ...req.body, createdBy: req.user._id });
    audit(req, 'create', 'HolidayCalendar', doc);
    return created(res, doc);
  } catch (e) {
    if (e.name === 'ValidationError') return fail(res, e.message, 422);
    return serverError(res, e);
  }
};

exports.updateHoliday = async (req, res) => {
  try {
    const doc = await HolidayCalendar.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Holiday not found');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    audit(req, 'update', 'HolidayCalendar', doc, before);
    return ok(res, doc);
  } catch (e) {
    if (e.name === 'ValidationError') return fail(res, e.message, 422);
    return serverError(res, e);
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const doc = await HolidayCalendar.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Holiday not found');
    doc.isDeleted = true;
    await doc.save();
    audit(req, 'delete', 'HolidayCalendar', doc);
    return noContent(res);
  } catch (e) {
    return serverError(res, e);
  }
};

// ── Planning Constraints ──────────────────────────────────────────────────────

exports.getConstraints = async (req, res) => {
  try {
    const { factory, constraintType, severity, isActive, page = 1, limit = 20 } = req.query;
    const q = { isDeleted: false };
    if (factory)        q.factory        = factory;
    if (constraintType) q.constraintType = constraintType;
    if (severity)       q.severity       = severity;
    if (isActive !== undefined) q.isActive = isActive === 'true';

    const total = await PlanningConstraint.countDocuments(q);
    const docs  = await PlanningConstraint.find(q)
      .populate('factory',    'name')
      .populate('workCenter', 'name')
      .populate('machine',    'name')
      .sort({ severity: -1, validFrom: 1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .lean();

    return paginated(res, docs, { total, page: +page, limit: +limit });
  } catch (e) {
    return serverError(res, e);
  }
};

exports.createConstraint = async (req, res) => {
  try {
    const doc = await PlanningConstraint.create({ ...req.body, createdBy: req.user._id });
    audit(req, 'create', 'PlanningConstraint', doc);
    return created(res, doc);
  } catch (e) {
    if (e.name === 'ValidationError') return fail(res, e.message, 422);
    return serverError(res, e);
  }
};

exports.updateConstraint = async (req, res) => {
  try {
    const doc = await PlanningConstraint.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Planning constraint not found');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    audit(req, 'update', 'PlanningConstraint', doc, before);
    return ok(res, doc);
  } catch (e) {
    if (e.name === 'ValidationError') return fail(res, e.message, 422);
    return serverError(res, e);
  }
};

exports.deleteConstraint = async (req, res) => {
  try {
    const doc = await PlanningConstraint.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Planning constraint not found');
    doc.isDeleted = true;
    await doc.save();
    audit(req, 'delete', 'PlanningConstraint', doc);
    return noContent(res);
  } catch (e) {
    return serverError(res, e);
  }
};

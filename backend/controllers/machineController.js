'use strict';
const Machine    = require('../models/Machine');
const AuditLog   = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError, noContent } = require('../utils/response');

function audit(req, action, m, before = null) {
  try {
    AuditLog.create({
      admin: req.user._id, adminName: req.user.name || '', adminEmail: req.user.email || '',
      adminRole: req.user.role || 'admin', action, entity: 'Machine',
      entityId: m._id, entityLabel: m.name,
      changes: { before, after: m.toObject ? m.toObject() : m },
      ip: req.ip, userAgent: req.get('user-agent') || '',
    });
  } catch (_) {}
}

exports.createMachine = async (req, res) => {
  try {
    const machine = await Machine.create(req.body);
    audit(req, 'MACHINE_CREATED', machine);
    return created(res, machine, 'Machine created');
  } catch (err) {
    if (err.code === 11000) return fail(res, 'Machine code already exists');
    return serverError(res, err);
  }
};

exports.getMachines = async (req, res) => {
  try {
    const { page = 1, limit = 20, factory, workCenter, status, search } = req.query;
    const filter = { isDeleted: false };
    if (factory)    filter.factory    = factory;
    if (workCenter) filter.workCenter = workCenter;
    if (status)     filter.status     = status;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { type: { $regex: search, $options: 'i' } },
    ];
    const total = await Machine.countDocuments(filter);
    const data  = await Machine.find(filter)
      .populate('factory', 'name code')
      .populate('workCenter', 'name code')
      .sort({ code: 1 })
      .skip((page - 1) * Number(limit)).limit(Number(limit));
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getMachine = async (req, res) => {
  try {
    const machine = await Machine.findOne({ _id: req.params.id, isDeleted: false })
      .populate('factory', 'name code')
      .populate('workCenter', 'name code');
    if (!machine) return notFound(res, 'Machine');
    return ok(res, machine);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateMachine = async (req, res) => {
  try {
    const machine = await Machine.findOne({ _id: req.params.id, isDeleted: false });
    if (!machine) return notFound(res, 'Machine');
    const before = machine.toObject();
    Object.assign(machine, req.body);
    await machine.save();
    audit(req, 'MACHINE_UPDATED', machine, before);
    return ok(res, machine, 'Machine updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteMachine = async (req, res) => {
  try {
    const machine = await Machine.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!machine) return notFound(res, 'Machine');
    audit(req, 'MACHINE_DELETED', machine);
    return noContent(res, 'Machine deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateMachineStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['running', 'idle', 'maintenance', 'breakdown', 'decommissioned'];
    if (!allowed.includes(status)) return fail(res, 'Invalid machine status');
    const machine = await Machine.findOne({ _id: req.params.id, isDeleted: false });
    if (!machine) return notFound(res, 'Machine');
    const before = machine.toObject();
    machine.status = status;
    await machine.save();
    audit(req, 'MACHINE_STATUS_UPDATED', machine, before);
    const io = req.app.locals.io;
    if (io) io.emit('manufacturing:machine_status', { id: machine._id, code: machine.code, status });
    return ok(res, machine, 'Machine status updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.logMaintenance = async (req, res) => {
  try {
    const machine = await Machine.findOne({ _id: req.params.id, isDeleted: false });
    if (!machine) return notFound(res, 'Machine');
    machine.maintenanceLogs.push(req.body);
    machine.lastMaintenanceDate = new Date();
    if (req.body.nextMaintenanceDate) machine.nextMaintenanceDate = new Date(req.body.nextMaintenanceDate);
    if (machine.status === 'breakdown' || machine.status === 'maintenance') machine.status = 'idle';
    await machine.save();
    audit(req, 'MACHINE_MAINTENANCE_LOGGED', machine);
    return ok(res, machine, 'Maintenance logged');
  } catch (err) {
    return serverError(res, err);
  }
};

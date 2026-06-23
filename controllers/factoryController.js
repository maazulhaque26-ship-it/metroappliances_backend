'use strict';
const Factory    = require('../models/Factory');
const WorkCenter = require('../models/WorkCenter');
const Machine    = require('../models/Machine');
const AuditLog   = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError, noContent } = require('../utils/response');

function audit(req, action, factory, before = null) {
  try {
    AuditLog.create({
      admin: req.user._id, adminName: req.user.name || '', adminEmail: req.user.email || '',
      adminRole: req.user.role || 'admin', action, entity: 'Factory',
      entityId: factory._id, entityLabel: factory.name,
      changes: { before, after: factory.toObject ? factory.toObject() : factory },
      ip: req.ip, userAgent: req.get('user-agent') || '',
    });
  } catch (_) {}
}

exports.createFactory = async (req, res) => {
  try {
    const factory = await Factory.create(req.body);
    audit(req, 'FACTORY_CREATED', factory);
    const io = req.app.locals.io;
    if (io) io.emit('manufacturing:factory_created', { id: factory._id, name: factory.name });
    return created(res, factory, 'Factory created');
  } catch (err) {
    if (err.code === 11000) return fail(res, 'Factory code already exists');
    return serverError(res, err);
  }
};

exports.getFactories = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
    const total     = await Factory.countDocuments(filter);
    const factories = await Factory.find(filter).sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit)).limit(Number(limit));
    return paginated(res, factories, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getFactory = async (req, res) => {
  try {
    const factory = await Factory.findOne({ _id: req.params.id, isDeleted: false });
    if (!factory) return notFound(res, 'Factory');
    const [workCenters, machines] = await Promise.all([
      WorkCenter.find({ factory: factory._id, isDeleted: false }).sort({ code: 1 }),
      Machine.countDocuments({ factory: factory._id, isDeleted: false }),
    ]);
    return ok(res, { ...factory.toObject(), workCenters, machineCount: machines });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateFactory = async (req, res) => {
  try {
    const factory = await Factory.findOne({ _id: req.params.id, isDeleted: false });
    if (!factory) return notFound(res, 'Factory');
    const before = factory.toObject();
    Object.assign(factory, req.body);
    await factory.save();
    audit(req, 'FACTORY_UPDATED', factory, before);
    return ok(res, factory, 'Factory updated');
  } catch (err) {
    if (err.code === 11000) return fail(res, 'Factory code already exists');
    return serverError(res, err);
  }
};

exports.deleteFactory = async (req, res) => {
  try {
    const factory = await Factory.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!factory) return notFound(res, 'Factory');
    audit(req, 'FACTORY_DELETED', factory);
    return noContent(res, 'Factory deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

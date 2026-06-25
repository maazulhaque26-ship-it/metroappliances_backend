'use strict';
const MRPReservation = require('../models/MRPReservation');
const AuditLog       = require('../models/AuditLog');
const { ok, paginated, notFound, fail, serverError } = require('../utils/response');

exports.getReservations = async (req, res) => {
  try {
    const { page = 1, limit = 20, mrpRun, material, status } = req.query;
    const filter = { isDeleted: false };
    if (mrpRun)   filter.mrpRun   = mrpRun;
    if (material) filter.material = material;
    if (status)   filter.status   = status;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await MRPReservation.countDocuments(filter);
    const data  = await MRPReservation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip).limit(Number(limit))
      .populate('material',  'name sku')
      .populate('mrpRun',    'runNumber')
      .populate('warehouse', 'name code');
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.getReservation = async (req, res) => {
  try {
    const doc = await MRPReservation.findOne({ _id: req.params.id, isDeleted: false })
      .populate('material',            'name sku')
      .populate('mrpRun',              'runNumber status')
      .populate('materialRequirement', 'requirementNumber')
      .populate('warehouse',           'name code')
      .populate('productionOrder',     'orderNumber');
    if (!doc) return notFound(res, 'MRP reservation not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.releaseReservation = async (req, res) => {
  try {
    const doc = await MRPReservation.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'MRP reservation not found');
    if (doc.status !== 'active') return fail(res, 'Only active reservations can be released');
    const before = doc.toObject();
    doc.status = 'released';
    await doc.save();
    await AuditLog.create({
      admin: req.user?._id, adminName: req.user?.name || '', adminEmail: req.user?.email || '',
      adminRole: req.user?.role || 'admin', action: 'update', entity: 'MRPReservation',
      entityId: doc._id, entityLabel: doc.reservationNumber,
      changes: { before, after: { status: 'released' } },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return ok(res, doc, 'Reservation released');
  } catch (err) { return serverError(res, err); }
};

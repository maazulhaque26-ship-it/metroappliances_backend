'use strict';
const EWayBill  = require('../models/EWayBill');
const AuditLog  = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

exports.getEWayBills = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const q = { isDeleted: false };
    if (status) q.status = status;
    if (search) q.$or = [
      { eWayBillNumber: { $regex: search, $options: 'i' } },
      { toName:         { $regex: search, $options: 'i' } },
      { vehicleNo:      { $regex: search, $options: 'i' } },
    ];
    const [data, total] = await Promise.all([
      EWayBill.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)),
      EWayBill.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getEWayBill = async (req, res) => {
  try {
    const doc = await EWayBill.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'E-way bill');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createEWayBill = async (req, res) => {
  try {
    const doc = await EWayBill.create({ ...req.body, generatedBy: req.user._id });
    return created(res, doc, 'E-way bill created');
  } catch (e) { return serverError(res, e); }
};

exports.generateEWB = async (req, res) => {
  try {
    const doc = await EWayBill.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'E-way bill');
    if (doc.status === 'generated') return fail(res, 'E-way bill already generated');

    // Auto-calculate validity based on distance (every 200 km = 1 day, min 1 day, max 20 days)
    const distanceKm = doc.distance || 0;
    const validDays  = Math.min(Math.max(Math.ceil(distanceKm / 200), 1), 20);
    const validUpto  = new Date(Date.now() + validDays * 86400000);

    // Generate EWB number
    const ewbNo = req.body.ewbNo || `EWB${Date.now()}`;

    doc.ewbNo       = ewbNo;
    doc.ewbDate     = new Date();
    doc.validUpto   = validUpto;
    doc.status      = 'generated';
    doc.jsonPayload = {
      ewbNo, ewbDate: doc.ewbDate, validUpto, fromGSTIN: doc.fromGSTIN, toGSTIN: doc.toGSTIN,
      supplyType: doc.supplyType, transportMode: doc.transportMode, vehicleNo: doc.vehicleNo,
      invoiceNo: doc.invoiceNo, invoiceValue: doc.invoiceValue,
    };
    await doc.save();

    const io = req.app.locals.io;
    if (io) io.emit('tax:ewaybill_generated', { ewayBillId: doc._id, eWayBillNumber: doc.eWayBillNumber, ewbNo: doc.ewbNo, toName: doc.toName, validUpto: doc.validUpto });

    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'UPDATE', entity: 'EWayBill', entityId: doc._id, entityLabel: doc.eWayBillNumber, changes: { before: { status: 'pending' }, after: { status: 'generated', ewbNo: doc.ewbNo } }, ip: req.ip, userAgent: req.headers['user-agent'] });

    return ok(res, doc, 'E-way bill generated');
  } catch (e) { return serverError(res, e); }
};

exports.updateTransport = async (req, res) => {
  try {
    const { vehicleNo, transporterName, transporterId, transDocNo, transDocDate } = req.body;
    const doc = await EWayBill.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'E-way bill');
    if (doc.status === 'cancelled') return fail(res, 'Cannot update cancelled e-way bill');
    if (vehicleNo)        doc.vehicleNo        = vehicleNo.toUpperCase();
    if (transporterName)  doc.transporterName  = transporterName;
    if (transporterId)    doc.transporterId    = transporterId;
    if (transDocNo)       doc.transDocNo       = transDocNo;
    if (transDocDate)     doc.transDocDate     = new Date(transDocDate);
    await doc.save();
    return ok(res, doc, 'Transport details updated');
  } catch (e) { return serverError(res, e); }
};

exports.cancelEWayBill = async (req, res) => {
  try {
    const doc = await EWayBill.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'E-way bill');
    if (doc.status !== 'generated') return fail(res, 'Only generated e-way bills can be cancelled');
    doc.status             = 'cancelled';
    doc.cancellationReason = req.body.reason || '';
    doc.cancelledDate      = new Date();
    await doc.save();
    return ok(res, doc, 'E-way bill cancelled');
  } catch (e) { return serverError(res, e); }
};

exports.deleteEWayBill = async (req, res) => {
  try {
    const doc = await EWayBill.findOneAndUpdate({ _id: req.params.id, status: 'pending' }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'E-way bill');
    return noContent(res);
  } catch (e) { return serverError(res, e); }
};

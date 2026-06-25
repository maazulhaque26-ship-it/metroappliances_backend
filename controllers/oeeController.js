'use strict';
const OEERecord      = require('../models/OEERecord');
const MachineRuntime = require('../models/MachineRuntime');
const ProductionEvent = require('../models/ProductionEvent');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

// ─── OEE calculation engine ──────────────────────────────────────────────────
function calcOEE(availability, performance, quality) {
  return Math.round(availability * performance * quality / 10000) / 100;
}

exports.recordOEE = async (req, res) => {
  try {
    const { machine, date, availability, performance, quality, plannedProductionTimeMins, totalParts, goodParts } = req.body;
    if (!machine || !date || availability == null || performance == null || quality == null) {
      return fail(res, 'machine, date, availability, performance and quality are required');
    }
    const oee = calcOEE(Number(availability), Number(performance), Number(quality));
    const defectiveParts = (totalParts || 0) - (goodParts || 0);
    const doc = await OEERecord.create({ ...req.body, oee, defectiveParts: defectiveParts >= 0 ? defectiveParts : 0 });
    await ProductionEvent.create({ eventType: 'oee_calculated', machine: doc.machine, factory: doc.factory, message: `OEE calculated for machine: ${oee}%`, severity: oee < 65 ? 'warning' : 'info', metadata: { oee, availability, performance, quality } });
    const io = req.app.locals.io;
    if (io) io.emit('mes:oee_updated', { machineId: machine, oee, date });
    return created(res, doc, 'OEE record created');
  } catch (err) { return serverError(res, err); }
};

exports.getOEERecords = async (req, res) => {
  try {
    const { page = 1, limit = 30, machine, factory, dateFrom, dateTo } = req.query;
    const filter = { isDeleted: false };
    if (machine) filter.machine = machine;
    if (factory) filter.factory = factory;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo)   filter.date.$lte = new Date(dateTo);
    }
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await OEERecord.countDocuments(filter);
    const data  = await OEERecord.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit))
      .populate('machine', 'name code').populate('factory', 'name');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getOEERecord = async (req, res) => {
  try {
    const doc = await OEERecord.findOne({ _id: req.params.id, isDeleted: false })
      .populate('machine', 'name code').populate('factory', 'name');
    if (!doc) return notFound(res, 'OEE record');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getOEESummary = async (req, res) => {
  try {
    const { machine, factory, dateFrom, dateTo } = req.query;
    const match = { isDeleted: false };
    if (machine) match.machine = require('mongoose').Types.ObjectId(machine);
    if (factory) match.factory = require('mongoose').Types.ObjectId(factory);
    if (dateFrom || dateTo) {
      match.date = {};
      if (dateFrom) match.date.$gte = new Date(dateFrom);
      if (dateTo)   match.date.$lte = new Date(dateTo);
    }
    const [summary] = await OEERecord.aggregate([
      { $match: match },
      { $group: {
        _id: null,
        avgOEE:          { $avg: '$oee' },
        avgAvailability: { $avg: '$availability' },
        avgPerformance:  { $avg: '$performance' },
        avgQuality:      { $avg: '$quality' },
        avgMTBF:         { $avg: '$mtbf' },
        avgMTTR:         { $avg: '$mttr' },
        totalParts:      { $sum: '$totalParts' },
        goodParts:       { $sum: '$goodParts' },
        defectiveParts:  { $sum: '$defectiveParts' },
        count:           { $sum: 1 },
      }},
    ]);
    return ok(res, summary || {});
  } catch (err) { return serverError(res, err); }
};

// ─── Machine runtime ─────────────────────────────────────────────────────────
exports.getMachineRuntimes = async (req, res) => {
  try {
    const { page = 1, limit = 30, machine, factory, dateFrom, dateTo } = req.query;
    const filter = { isDeleted: false };
    if (machine) filter.machine = machine;
    if (factory) filter.factory = factory;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo)   filter.date.$lte = new Date(dateTo);
    }
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await MachineRuntime.countDocuments(filter);
    const data  = await MachineRuntime.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit))
      .populate('machine', 'name code').populate('workOrder', 'orderNumber').populate('factory', 'name');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getMachineRuntime = async (req, res) => {
  try {
    const doc = await MachineRuntime.findOne({ _id: req.params.id, isDeleted: false })
      .populate('machine', 'name code').populate('workOrder', 'orderNumber').populate('factory', 'name');
    if (!doc) return notFound(res, 'Machine runtime');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateMachineRuntime = async (req, res) => {
  try {
    const doc = await MachineRuntime.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Machine runtime');
    const allowed = ['runtimeMins','idleTimeMins','downtimeMins','setupTimeMins','throughput','utilizationPct','notes'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    await doc.save();
    return ok(res, doc, 'Machine runtime updated');
  } catch (err) { return serverError(res, err); }
};

'use strict';
const LaborTracking  = require('../models/LaborTracking');
const ProductionEvent = require('../models/ProductionEvent');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');

exports.createLaborEntry = async (req, res) => {
  try {
    const { workOrder, operator, date } = req.body;
    if (!workOrder || !operator || !date) return fail(res, 'workOrder, operator and date are required');
    const doc = await LaborTracking.create(req.body);
    return created(res, doc, 'Labor entry created');
  } catch (err) { return serverError(res, err); }
};

exports.getLaborEntries = async (req, res) => {
  try {
    const { page = 1, limit = 20, workOrder, operator, factory, dateFrom, dateTo } = req.query;
    const filter = { isDeleted: false };
    if (workOrder) filter.workOrder = workOrder;
    if (operator)  filter.operator  = operator;
    if (factory)   filter.factory   = factory;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo)   filter.date.$lte = new Date(dateTo);
    }
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await LaborTracking.countDocuments(filter);
    const data  = await LaborTracking.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit))
      .populate('workOrder', 'orderNumber productName').populate('operator', 'name').populate('factory', 'name');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getLaborEntry = async (req, res) => {
  try {
    const doc = await LaborTracking.findOne({ _id: req.params.id, isDeleted: false })
      .populate('workOrder', 'orderNumber productName').populate('operator', 'name').populate('factory', 'name');
    if (!doc) return notFound(res, 'Labor entry');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateLaborEntry = async (req, res) => {
  try {
    const doc = await LaborTracking.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Labor entry');
    const allowed = ['hoursWorked','regularHours','overtimeHours','setupHours','unitsProduced','efficiencyPct','hourlyRate','overtimeRate','totalLaborCost','notes'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    await doc.save();
    return ok(res, doc, 'Labor entry updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteLaborEntry = async (req, res) => {
  try {
    const doc = await LaborTracking.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Labor entry');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

exports.getLaborSummary = async (req, res) => {
  try {
    const { factory, workOrder, dateFrom, dateTo } = req.query;
    const match = { isDeleted: false };
    if (workOrder) match.workOrder = require('mongoose').Types.ObjectId(workOrder);
    if (factory)   match.factory   = require('mongoose').Types.ObjectId(factory);
    if (dateFrom || dateTo) {
      match.date = {};
      if (dateFrom) match.date.$gte = new Date(dateFrom);
      if (dateTo)   match.date.$lte = new Date(dateTo);
    }
    const [summary] = await LaborTracking.aggregate([
      { $match: match },
      { $group: {
        _id: null,
        totalHours:      { $sum: '$hoursWorked' },
        totalRegular:    { $sum: '$regularHours' },
        totalOvertime:   { $sum: '$overtimeHours' },
        totalSetup:      { $sum: '$setupHours' },
        totalUnits:      { $sum: '$unitsProduced' },
        avgEfficiency:   { $avg: '$efficiencyPct' },
        totalLaborCost:  { $sum: '$totalLaborCost' },
        operatorCount:   { $addToSet: '$operator' },
      }},
      { $project: { _id: 0, totalHours: 1, totalRegular: 1, totalOvertime: 1, totalSetup: 1, totalUnits: 1, avgEfficiency: { $round: ['$avgEfficiency', 1] }, totalLaborCost: 1, operatorCount: { $size: '$operatorCount' } } },
    ]);
    return ok(res, summary || {});
  } catch (err) { return serverError(res, err); }
};

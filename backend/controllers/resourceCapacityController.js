'use strict';
const mongoose = require('mongoose');
const { ok, created, notFound, serverError } = require('../utils/response');
const { emit } = require('../utils/socket');

const Capacity = () => mongoose.model('ResourceCapacity');
const Demand   = () => mongoose.model('ResourceDemand');

// ── Capacity records ────────────────────────────────────────────────────────
exports.listCapacity = async (req, res) => {
  try {
    const filter = { isDeleted: false };
    if (req.query.portfolio) filter.portfolio = req.query.portfolio;
    if (req.query.period) filter.period = req.query.period;
    if (req.query.employee) filter.employee = req.query.employee;
    const docs = await Capacity().find(filter).sort({ period: 1 })
      .populate('employee', 'firstName lastName employeeCode').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createCapacity = async (req, res) => {
  try {
    const doc = await Capacity().create(req.body);
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateCapacity = async (req, res) => {
  try {
    const doc = await Capacity().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Capacity record');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteCapacity = async (req, res) => {
  try {
    const doc = await Capacity().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Capacity record');
    return ok(res, { message: 'Capacity deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Demand records ──────────────────────────────────────────────────────────
exports.listDemand = async (req, res) => {
  try {
    const filter = { isDeleted: false };
    if (req.query.portfolio) filter.portfolio = req.query.portfolio;
    if (req.query.project) filter.project = req.query.project;
    if (req.query.period) filter.period = req.query.period;
    const docs = await Demand().find(filter).sort({ period: 1 })
      .populate('employee', 'firstName lastName employeeCode')
      .populate('project', 'name projectCode').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createDemand = async (req, res) => {
  try {
    const doc = await Demand().create(req.body);
    emit(req.app.locals.io, 'portfolio:demand_created', { demandId: doc._id, employeeId: doc.employee });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateDemand = async (req, res) => {
  try {
    const doc = await Demand().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Demand record');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteDemand = async (req, res) => {
  try {
    const doc = await Demand().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Demand record');
    return ok(res, { message: 'Demand deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Demand vs Capacity (per period) ─────────────────────────────────────────
exports.getDemandVsCapacity = async (req, res) => {
  try {
    const match = { isDeleted: false };
    if (req.query.portfolio) match.portfolio = new mongoose.Types.ObjectId(req.query.portfolio);

    const [capByPeriod, demByPeriod] = await Promise.all([
      Capacity().aggregate([
        { $match: match },
        { $group: { _id: '$period', capacity: { $sum: '$availableHours' }, allocated: { $sum: '$allocatedHours' } } },
      ]),
      Demand().aggregate([
        { $match: match },
        { $group: { _id: '$period', demand: { $sum: '$demandHours' } } },
      ]),
    ]);

    const map = {};
    capByPeriod.forEach(c => { map[c._id] = { period: c._id, capacity: c.capacity, allocated: c.allocated, demand: 0 }; });
    demByPeriod.forEach(d => {
      map[d._id] = map[d._id] || { period: d._id, capacity: 0, allocated: 0, demand: 0 };
      map[d._id].demand = d.demand;
    });
    const rows = Object.values(map).map(r => ({
      ...r,
      gap: r.capacity - r.demand,
      utilization: r.capacity ? Number(((r.demand / r.capacity) * 100).toFixed(1)) : 0,
    })).sort((a, b) => String(a.period).localeCompare(String(b.period)));

    return ok(res, rows);
  } catch (err) { return serverError(res, err); }
};

// ── Utilization per employee ────────────────────────────────────────────────
exports.getUtilization = async (req, res) => {
  try {
    const match = { isDeleted: false };
    if (req.query.portfolio) match.portfolio = new mongoose.Types.ObjectId(req.query.portfolio);
    if (req.query.period) match.period = req.query.period;

    const caps = await Capacity().find(match).populate('employee', 'firstName lastName employeeCode').lean();
    const demMatch = { ...match };
    const dems = await Demand().aggregate([
      { $match: demMatch },
      { $group: { _id: { employee: '$employee', period: '$period' }, demand: { $sum: '$demandHours' } } },
    ]);
    const demKey = {};
    dems.forEach(d => { demKey[`${d._id.employee}_${d._id.period}`] = d.demand; });

    const rows = caps.map(c => {
      const demand = demKey[`${c.employee?._id}_${c.period}`] || 0;
      const name = c.employee ? `${c.employee.firstName || ''} ${c.employee.lastName || ''}`.trim() : 'Unknown';
      const utilization = c.availableHours ? Number(((demand / c.availableHours) * 100).toFixed(1)) : 0;
      return {
        employee: c.employee?._id, name, period: c.period,
        availableHours: c.availableHours, demand, utilization,
        status: utilization > 100 ? 'overallocated' : utilization >= 80 ? 'optimal' : 'underutilized',
      };
    });
    return ok(res, rows);
  } catch (err) { return serverError(res, err); }
};

// ── Conflicts: employees whose demand exceeds capacity in a period ──────────
exports.getConflicts = async (req, res) => {
  try {
    const match = { isDeleted: false };
    if (req.query.portfolio) match.portfolio = new mongoose.Types.ObjectId(req.query.portfolio);

    const caps = await Capacity().find(match).populate('employee', 'firstName lastName employeeCode').lean();
    const capKey = {};
    caps.forEach(c => { capKey[`${c.employee?._id}_${c.period}`] = c; });

    const dems = await Demand().aggregate([
      { $match: match },
      { $group: { _id: { employee: '$employee', period: '$period' }, demand: { $sum: '$demandHours' }, count: { $sum: 1 } } },
    ]);

    const conflicts = [];
    for (const d of dems) {
      const cap = capKey[`${d._id.employee}_${d._id.period}`];
      const available = cap ? cap.availableHours : 0;
      if (d.demand > available) {
        const emp = cap?.employee;
        conflicts.push({
          employee: d._id.employee,
          name: emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Unknown',
          period: d._id.period,
          availableHours: available,
          demandHours: d.demand,
          overBy: d.demand - available,
          competingDemands: d.count,
        });
      }
    }
    conflicts.sort((a, b) => b.overBy - a.overBy);
    return ok(res, conflicts);
  } catch (err) { return serverError(res, err); }
};

// ── Heatmap: employee × period utilization matrix ───────────────────────────
exports.getHeatmap = async (req, res) => {
  try {
    const match = { isDeleted: false };
    if (req.query.portfolio) match.portfolio = new mongoose.Types.ObjectId(req.query.portfolio);

    const caps = await Capacity().find(match).populate('employee', 'firstName lastName employeeCode').lean();
    const dems = await Demand().aggregate([
      { $match: match },
      { $group: { _id: { employee: '$employee', period: '$period' }, demand: { $sum: '$demandHours' } } },
    ]);
    const demKey = {};
    dems.forEach(d => { demKey[`${d._id.employee}_${d._id.period}`] = d.demand; });

    const periods = [...new Set(caps.map(c => c.period))].sort((a, b) => String(a).localeCompare(String(b)));
    const empMap = {};
    caps.forEach(c => {
      const id = String(c.employee?._id);
      if (!empMap[id]) {
        empMap[id] = {
          employee: c.employee?._id,
          name: c.employee ? `${c.employee.firstName || ''} ${c.employee.lastName || ''}`.trim() : 'Unknown',
          cells: {},
        };
      }
      const demand = demKey[`${id}_${c.period}`] || 0;
      empMap[id].cells[c.period] = c.availableHours ? Number(((demand / c.availableHours) * 100).toFixed(0)) : 0;
    });

    return ok(res, { periods, rows: Object.values(empMap) });
  } catch (err) { return serverError(res, err); }
};

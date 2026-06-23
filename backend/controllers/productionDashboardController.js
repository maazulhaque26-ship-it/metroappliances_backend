'use strict';
const ProductionOrder   = require('../models/ProductionOrder');
const ProductionBatch   = require('../models/ProductionBatch');
const Factory           = require('../models/Factory');
const Machine           = require('../models/Machine');
const WorkCenter        = require('../models/WorkCenter');
const Shift             = require('../models/Shift');
const BillOfMaterials   = require('../models/BillOfMaterials');
const ProductionSettings = require('../models/ProductionSettings');
const { ok, serverError } = require('../utils/response');

function todayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
}

exports.getDashboard = async (req, res) => {
  try {
    const today = todayRange();
    const [
      runningOrders,
      plannedOrders,
      pausedOrders,
      completedToday,
      totalFactories,
      totalMachines,
      runningMachines,
      maintenanceMachines,
      totalBOMs,
      totalWorkCenters,
      settings,
      todayBatches,
      allOrders,
    ] = await Promise.all([
      ProductionOrder.countDocuments({ status: 'in_progress', isDeleted: false }),
      ProductionOrder.countDocuments({ status: { $in: ['confirmed', 'scheduled'] }, isDeleted: false }),
      ProductionOrder.countDocuments({ status: 'paused', isDeleted: false }),
      ProductionOrder.find({ status: 'completed', actualEndDate: today, isDeleted: false })
        .select('completedQuantity rejectedQuantity'),
      Factory.countDocuments({ isDeleted: false }),
      Machine.countDocuments({ isDeleted: false }),
      Machine.countDocuments({ status: 'running', isDeleted: false }),
      Machine.countDocuments({ status: { $in: ['maintenance', 'breakdown'] }, isDeleted: false }),
      BillOfMaterials.countDocuments({ isDeleted: false }),
      WorkCenter.countDocuments({ isDeleted: false }),
      ProductionSettings.getSingleton(),
      ProductionBatch.find({ createdAt: today, isDeleted: false }).select('completedQty rejectedQty'),
      ProductionOrder.find({ isDeleted: false }).select('completedQuantity rejectedQuantity oeeScore'),
    ]);

    const todayOutput    = completedToday.reduce((s, o) => s + (o.completedQuantity || 0), 0);
    const todayRejected  = completedToday.reduce((s, o) => s + (o.rejectedQuantity  || 0), 0);
    const machineUtilization = totalMachines > 0
      ? Math.round((runningMachines / totalMachines) * 100) : 0;
    const totalOutput   = allOrders.reduce((s, o) => s + (o.completedQuantity || 0), 0);
    const totalRejected = allOrders.reduce((s, o) => s + (o.rejectedQuantity  || 0), 0);
    const scrapRate     = (totalOutput + totalRejected) > 0
      ? Number(((totalRejected / (totalOutput + totalRejected)) * 100).toFixed(2)) : 0;
    const avgOEE = allOrders.filter(o => o.oeeScore > 0).length
      ? Number((allOrders.filter(o => o.oeeScore > 0).reduce((s, o) => s + o.oeeScore, 0)
          / allOrders.filter(o => o.oeeScore > 0).length).toFixed(1)) : 0;

    return ok(res, {
      orders: { running: runningOrders, planned: plannedOrders, paused: pausedOrders },
      todayOutput, todayRejected,
      machines: { total: totalMachines, running: runningMachines, maintenance: maintenanceMachines, utilization: machineUtilization },
      factories: totalFactories,
      workCenters: totalWorkCenters,
      boms: totalBOMs,
      scrapRate,
      oee: avgOEE,
      oeeTarget: settings.oeeTarget,
      scrapThreshold: settings.scrapThreshold,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getProductionTrend = async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      const orders = await ProductionOrder.find({
        actualEndDate: { $gte: start, $lte: end },
        status: 'completed', isDeleted: false,
      }).select('completedQuantity rejectedQuantity');
      trend.push({
        date:     `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        output:   orders.reduce((s, o) => s + (o.completedQuantity || 0), 0),
        rejected: orders.reduce((s, o) => s + (o.rejectedQuantity  || 0), 0),
        orders:   orders.length,
      });
    }
    return ok(res, trend);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getOEEReport = async (req, res) => {
  try {
    const factories = await Factory.find({ isDeleted: false }).select('name code');
    const result = await Promise.all(factories.map(async (f) => {
      const machines = await Machine.find({ factory: f._id, isDeleted: false }).select('status oee utilizationRate name');
      const running  = machines.filter(m => m.status === 'running').length;
      const avgOEE   = machines.filter(m => m.oee > 0).length
        ? Math.round(machines.filter(m => m.oee > 0).reduce((s, m) => s + m.oee, 0) / machines.filter(m => m.oee > 0).length)
        : 0;
      return {
        factory: f.name, code: f.code,
        machines: machines.length, running, avgOEE,
        utilization: machines.length > 0 ? Math.round((running / machines.length) * 100) : 0,
      };
    }));
    return ok(res, result);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getShiftPerformance = async (req, res) => {
  try {
    const shifts = await Shift.find({ isDeleted: false, isActive: true })
      .populate('factory', 'name code').select('name code factory targetOutput startTime endTime');
    const result = await Promise.all(shifts.map(async (s) => {
      const orders = await ProductionOrder.find({ shift: s._id, isDeleted: false })
        .select('completedQuantity plannedQuantity status');
      const output  = orders.reduce((sum, o) => sum + (o.completedQuantity || 0), 0);
      const planned = orders.reduce((sum, o) => sum + (o.plannedQuantity  || 0), 0);
      return {
        shift: s.name, code: s.code, factory: s.factory?.name,
        startTime: s.startTime, endTime: s.endTime,
        targetOutput: s.targetOutput, output, planned,
        efficiency: planned > 0 ? Math.round((output / planned) * 100) : 0,
        orders: orders.length,
      };
    }));
    return ok(res, result);
  } catch (err) {
    return serverError(res, err);
  }
};

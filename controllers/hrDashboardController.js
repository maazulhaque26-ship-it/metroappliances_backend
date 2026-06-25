'use strict';
const Employee         = require('../models/Employee');
const Department       = require('../models/Department');
const Designation      = require('../models/Designation');
const BusinessUnit     = require('../models/BusinessUnit');
const EmployeeTransfer = require('../models/EmployeeTransfer');
const EmployeePromotion= require('../models/EmployeePromotion');
const EmployeeProbation= require('../models/EmployeeProbation');
const EmployeeExit     = require('../models/EmployeeExit');
const { ok, serverError } = require('../utils/response');

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalEmployees, activeEmployees, probationEmployees, confirmedEmployees,
      pendingTransfers, pendingPromotions, exitsThisMonth, newJoinersThisMonth,
      deptDist, buDist,
    ] = await Promise.all([
      Employee.countDocuments({ isDeleted: false }),
      Employee.countDocuments({ status: 'active', isDeleted: false }),
      Employee.countDocuments({ status: 'probation', isDeleted: false }),
      Employee.countDocuments({ status: 'active', confirmationDate: { $exists: true }, isDeleted: false }),
      EmployeeTransfer.countDocuments({ status: 'pending' }),
      EmployeePromotion.countDocuments({ status: 'pending' }),
      EmployeeExit.countDocuments({
        lastWorkingDay: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lt:  new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      }),
      Employee.countDocuments({
        joiningDate: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lt:  new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
        isDeleted: false,
      }),
      Employee.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
        { $unwind: { path: '$dept', preserveNullAndEmpty: true } },
        { $project: { name: { $ifNull: ['$dept.name', 'Unknown'] }, count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Employee.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$businessUnit', count: { $sum: 1 } } },
        { $lookup: { from: 'businessunits', localField: '_id', foreignField: '_id', as: 'bu' } },
        { $unwind: { path: '$bu', preserveNullAndEmpty: true } },
        { $project: { name: { $ifNull: ['$bu.name', 'Unknown'] }, count: 1 } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Monthly growth last 6 months
    const now = new Date();
    const growthData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = await Employee.countDocuments({
        joiningDate: { $lte: new Date(d.getFullYear(), d.getMonth() + 1, 0) },
        isDeleted: false,
      });
      growthData.push({
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        count,
      });
    }

    return ok(res, {
      metrics: {
        totalEmployees, activeEmployees, probationEmployees, confirmedEmployees,
        pendingTransfers, pendingPromotions, exitsThisMonth, newJoinersThisMonth,
      },
      deptDistribution: deptDist,
      buDistribution:   buDist,
      employeeGrowth:   growthData,
    });
  } catch (err) { return serverError(res, err); }
};

exports.getHeadcountReport = async (req, res) => {
  try {
    const byDept = await Employee.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: { dept: '$department', status: '$status' }, count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id.dept', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmpty: true } },
      { $project: { dept: { $ifNull: ['$dept.name', 'Unknown'] }, status: '$_id.status', count: 1 } },
      { $sort: { dept: 1 } },
    ]);
    return ok(res, byDept);
  } catch (err) { return serverError(res, err); }
};

exports.getAttritionReport = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const monthly = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(Number(year), m, 1);
      const end   = new Date(Number(year), m + 1, 0);
      const exits = await EmployeeExit.countDocuments({ lastWorkingDay: { $gte: start, $lte: end } });
      const total = await Employee.countDocuments({ joiningDate: { $lt: end }, isDeleted: false });
      monthly.push({ month: start.toLocaleString('default', { month: 'short' }), exits, total, rate: total ? +(exits / total * 100).toFixed(2) : 0 });
    }
    return ok(res, monthly);
  } catch (err) { return serverError(res, err); }
};

exports.getNewJoinersReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m   = month ? parseInt(month) - 1 : new Date().getMonth();
    const y   = year  ? parseInt(year)      : new Date().getFullYear();
    const start = new Date(y, m, 1);
    const end   = new Date(y, m + 1, 0, 23, 59, 59);
    const employees = await Employee.find({ joiningDate: { $gte: start, $lte: end }, isDeleted: false })
      .populate('department designation businessUnit location')
      .sort({ joiningDate: -1 });
    return ok(res, employees);
  } catch (err) { return serverError(res, err); }
};

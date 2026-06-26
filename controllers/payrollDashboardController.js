'use strict';
const mongoose    = require('mongoose');
const PayrollRun  = require('../models/PayrollRun');
const PayrollEmployee = require('../models/PayrollEmployee');
const Loan        = require('../models/Loan');
const AdvanceSalary = require('../models/AdvanceSalary');
const Bonus       = require('../models/Bonus');
const { ok, serverError } = require('../utils/response');

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalRuns,
      draftRuns,
      calculatedRuns,
      approvedRuns,
      postedRuns,
      paidRuns,
      activeLoans,
      pendingAdvances,
      pendingBonuses,
      recentRuns,
    ] = await Promise.all([
      PayrollRun.countDocuments({ isDeleted: false }),
      PayrollRun.countDocuments({ status: 'draft',      isDeleted: false }),
      PayrollRun.countDocuments({ status: 'calculated', isDeleted: false }),
      PayrollRun.countDocuments({ status: 'approved',   isDeleted: false }),
      PayrollRun.countDocuments({ status: 'posted',     isDeleted: false }),
      PayrollRun.countDocuments({ status: 'paid',       isDeleted: false }),
      Loan.countDocuments({ status: { $in: ['active','disbursed'] }, isDeleted: false }),
      AdvanceSalary.countDocuments({ status: 'applied', isDeleted: false }),
      Bonus.countDocuments({ status: 'draft', isDeleted: false }),
      PayrollRun.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('period', 'name startDate endDate')
        .select('runNumber status totalNetPay totalEmployees period createdAt'),
    ]);

    const [totalNetPaidResult, totalGrossResult] = await Promise.all([
      PayrollRun.aggregate([
        { $match: { status: 'paid', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$totalNetPay' } } },
      ]),
      PayrollRun.aggregate([
        { $match: { status: { $in: ['posted','paid'] }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$totalGross' } } },
      ]),
    ]);

    return ok(res, {
      kpis: {
        totalRuns,
        draftRuns,
        calculatedRuns,
        approvedRuns,
        postedRuns,
        paidRuns,
        activeLoans,
        pendingAdvances,
        pendingBonuses,
        totalNetPaid:  totalNetPaidResult[0]?.total  || 0,
        totalGrossYTD: totalGrossResult[0]?.total || 0,
      },
      recentRuns,
    });
  } catch (e) { return serverError(res, e); }
};

const VendorBill      = require('../models/VendorBill');
const VendorPayment   = require('../models/VendorPayment');
const VendorAging     = require('../models/VendorAging');
const PaymentRun      = require('../models/PaymentRun');
const InvoiceMatch    = require('../models/InvoiceMatch');
const GSTInputCredit  = require('../models/GSTInputCredit');
const { ok, serverError } = require('../utils/response');

exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalBills,
      draftBills,
      pendingApproval,
      overdueCount,
      paidThisMonth,
      totalOutstanding,
      recentBills,
      recentPayments,
      monthlyPayments,
      matchStats,
      openPaymentRuns,
    ] = await Promise.all([
      VendorBill.countDocuments({ isDeleted: false }),
      VendorBill.countDocuments({ isDeleted: false, status: 'draft' }),
      VendorBill.countDocuments({ isDeleted: false, approvalStatus: 'pending', status: { $in: ['submitted','approved'] } }),
      VendorBill.countDocuments({ isDeleted: false, status: 'overdue' }),
      VendorPayment.aggregate([
        { $match: { isDeleted: false, status: 'posted', paymentDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$netAmount' }, count: { $sum: 1 } } },
      ]),
      VendorBill.aggregate([
        { $match: { isDeleted: false, status: { $in: ['approved','partially_paid','overdue'] } } },
        { $group: { _id: null, total: { $sum: '$outstandingAmount' } } },
      ]),
      VendorBill.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(8)
        .populate('vendor', 'name').lean(),
      VendorPayment.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(8)
        .populate('vendor', 'name').lean(),
      VendorPayment.aggregate([
        { $match: { isDeleted: false, status: 'posted', paymentDate: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' }, day: { $dayOfMonth: '$paymentDate' } }, amount: { $sum: '$netAmount' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      InvoiceMatch.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$matchStatus', count: { $sum: 1 } } },
      ]),
      PaymentRun.countDocuments({ isDeleted: false, status: { $in: ['draft','proposed','approved'] } }),
    ]);

    const paidThisMonthData = paidThisMonth[0] || { total: 0, count: 0 };
    const totalOutstandingData = totalOutstanding[0] || { total: 0 };

    return ok(res, {
      kpis: {
        totalBills,
        draftBills,
        pendingApproval,
        overdueCount,
        paidThisMonth: paidThisMonthData.total,
        paymentsThisMonth: paidThisMonthData.count,
        totalOutstanding: totalOutstandingData.total,
        openPaymentRuns,
      },
      recentBills,
      recentPayments,
      monthlyPayments,
      matchStats,
    });
  } catch (e) { return serverError(res, e); }
};

exports.getAgingSummary = async (req, res) => {
  try {
    const summary = await VendorBill.aggregate([
      { $match: { isDeleted: false, status: { $in: ['approved','partially_paid','overdue'] }, outstandingAmount: { $gt: 0 } } },
      {
        $addFields: {
          daysOverdue: {
            $divide: [{ $subtract: [new Date(), '$dueDate'] }, 86400000],
          },
        },
      },
      {
        $group: {
          _id: null,
          current:    { $sum: { $cond: [{ $lte: ['$daysOverdue', 0] }, '$outstandingAmount', 0] } },
          days1_30:   { $sum: { $cond: [{ $and: [{ $gt: ['$daysOverdue', 0] }, { $lte: ['$daysOverdue', 30] }] }, '$outstandingAmount', 0] } },
          days31_60:  { $sum: { $cond: [{ $and: [{ $gt: ['$daysOverdue', 30] }, { $lte: ['$daysOverdue', 60] }] }, '$outstandingAmount', 0] } },
          days61_90:  { $sum: { $cond: [{ $and: [{ $gt: ['$daysOverdue', 60] }, { $lte: ['$daysOverdue', 90] }] }, '$outstandingAmount', 0] } },
          days91_120: { $sum: { $cond: [{ $and: [{ $gt: ['$daysOverdue', 90] }, { $lte: ['$daysOverdue', 120] }] }, '$outstandingAmount', 0] } },
          days120Plus:{ $sum: { $cond: [{ $gt: ['$daysOverdue', 120] }, '$outstandingAmount', 0] } },
          total:      { $sum: '$outstandingAmount' },
        },
      },
    ]);
    return ok(res, summary[0] || { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days91_120: 0, days120Plus: 0, total: 0 });
  } catch (e) { return serverError(res, e); }
};

exports.getTopVendorsByPayable = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const top = await VendorBill.aggregate([
      { $match: { isDeleted: false, status: { $in: ['approved','partially_paid','overdue'] }, outstandingAmount: { $gt: 0 } } },
      { $group: { _id: '$vendor', vendorName: { $first: '$vendorName' }, totalOutstanding: { $sum: '$outstandingAmount' }, billCount: { $sum: 1 } } },
      { $sort: { totalOutstanding: -1 } },
      { $limit: Number(limit) },
    ]);
    return ok(res, top);
  } catch (e) { return serverError(res, e); }
};

exports.getGSTCreditSummary = async (req, res) => {
  try {
    const summary = await GSTInputCredit.aggregate([
      { $match: { isDeleted: false } },
      { $group: {
        _id: '$gstCategory',
        totalTax:       { $sum: '$totalTax' },
        eligibleCredit: { $sum: '$eligibleCredit' },
        claimedCredit:  { $sum: '$claimedCredit' },
        count:          { $sum: 1 },
      }},
    ]);
    return ok(res, summary);
  } catch (e) { return serverError(res, e); }
};

const CustomerInvoice  = require('../models/CustomerInvoice');
const CustomerReceipt  = require('../models/CustomerReceipt');
const CustomerAging    = require('../models/CustomerAging');
const CustomerCreditLimit = require('../models/CustomerCreditLimit');
const BadDebt          = require('../models/BadDebt');
const { ok, serverError } = require('../utils/response');

exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalInvoices,
      draftInvoices,
      pendingApproval,
      overdueCount,
      collectedThisMonth,
      totalOutstanding,
      blockedCustomers,
      badDebtTotal,
      recentInvoices,
      recentReceipts,
      monthlyReceipts,
      dsoData,
    ] = await Promise.all([
      CustomerInvoice.countDocuments({ isDeleted: false }),
      CustomerInvoice.countDocuments({ isDeleted: false, status: 'draft' }),
      CustomerInvoice.countDocuments({ isDeleted: false, approvalStatus: 'pending', status: { $in: ['submitted','approved'] } }),
      CustomerInvoice.countDocuments({ isDeleted: false, status: 'overdue' }),
      CustomerReceipt.aggregate([
        { $match: { isDeleted: false, status: 'posted', receiptDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$netAmount' }, count: { $sum: 1 } } },
      ]),
      CustomerInvoice.aggregate([
        { $match: { isDeleted: false, status: { $in: ['approved','partially_paid','overdue'] } } },
        { $group: { _id: null, total: { $sum: '$outstandingAmount' } } },
      ]),
      CustomerCreditLimit.countDocuments({ isDeleted: false, isBlocked: true }),
      BadDebt.aggregate([
        { $match: { isDeleted: false, status: { $in: ['approved','posted'] } } },
        { $group: { _id: null, total: { $sum: '$badDebtAmount' } } },
      ]),
      CustomerInvoice.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(8)
        .populate('customer', 'name email').lean(),
      CustomerReceipt.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(8)
        .populate('customer', 'name email').lean(),
      CustomerReceipt.aggregate([
        { $match: { isDeleted: false, status: 'posted', receiptDate: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { year: { $year: '$receiptDate' }, month: { $month: '$receiptDate' }, day: { $dayOfMonth: '$receiptDate' } }, amount: { $sum: '$netAmount' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      CustomerInvoice.aggregate([
        { $match: { isDeleted: false, status: 'paid', glPosted: true } },
        { $group: { _id: null, avgDays: { $avg: { $divide: [{ $subtract: ['$updatedAt', '$invoiceDate'] }, 86400000] } } } },
      ]),
    ]);

    const collectedData    = collectedThisMonth[0]   || { total: 0, count: 0 };
    const outstandingData  = totalOutstanding[0]      || { total: 0 };
    const badDebtData      = badDebtTotal[0]          || { total: 0 };
    const dso              = Math.round(dsoData[0]?.avgDays || 0);

    return ok(res, {
      kpis: {
        totalInvoices,
        draftInvoices,
        pendingApproval,
        overdueCount,
        collectedThisMonth: collectedData.total,
        collectionsThisMonth: collectedData.count,
        totalOutstanding: outstandingData.total,
        blockedCustomers,
        badDebt: badDebtData.total,
        dso,
      },
      recentInvoices,
      recentReceipts,
      monthlyReceipts,
    });
  } catch (e) { return serverError(res, e); }
};

exports.getAgingSummary = async (req, res) => {
  try {
    const summary = await CustomerInvoice.aggregate([
      { $match: { isDeleted: false, status: { $in: ['approved','partially_paid','overdue'] }, outstandingAmount: { $gt: 0 } } },
      {
        $addFields: {
          daysOverdue: { $divide: [{ $subtract: [new Date(), '$dueDate'] }, 86400000] },
        },
      },
      {
        $group: {
          _id: null,
          current:     { $sum: { $cond: [{ $lte: ['$daysOverdue', 0] }, '$outstandingAmount', 0] } },
          days1_30:    { $sum: { $cond: [{ $and: [{ $gt: ['$daysOverdue', 0] }, { $lte: ['$daysOverdue', 30] }] }, '$outstandingAmount', 0] } },
          days31_60:   { $sum: { $cond: [{ $and: [{ $gt: ['$daysOverdue', 30] }, { $lte: ['$daysOverdue', 60] }] }, '$outstandingAmount', 0] } },
          days61_90:   { $sum: { $cond: [{ $and: [{ $gt: ['$daysOverdue', 60] }, { $lte: ['$daysOverdue', 90] }] }, '$outstandingAmount', 0] } },
          days91_120:  { $sum: { $cond: [{ $and: [{ $gt: ['$daysOverdue', 90] }, { $lte: ['$daysOverdue', 120] }] }, '$outstandingAmount', 0] } },
          days180Plus: { $sum: { $cond: [{ $gt: ['$daysOverdue', 120] }, '$outstandingAmount', 0] } },
          total:       { $sum: '$outstandingAmount' },
        },
      },
    ]);
    return ok(res, summary[0] || { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days91_120: 0, days180Plus: 0, total: 0 });
  } catch (e) { return serverError(res, e); }
};

exports.getTopCustomersByReceivable = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const top = await CustomerInvoice.aggregate([
      { $match: { isDeleted: false, status: { $in: ['approved','partially_paid','overdue'] }, outstandingAmount: { $gt: 0 } } },
      { $group: { _id: '$customer', customerName: { $first: '$customerName' }, totalOutstanding: { $sum: '$outstandingAmount' }, invoiceCount: { $sum: 1 } } },
      { $sort: { totalOutstanding: -1 } },
      { $limit: Number(limit) },
    ]);
    return ok(res, top);
  } catch (e) { return serverError(res, e); }
};

exports.getCreditExposure = async (req, res) => {
  try {
    const exposure = await CustomerCreditLimit.aggregate([
      { $match: { isDeleted: false } },
      { $group: {
        _id: '$riskRating',
        totalLimit:     { $sum: '$creditLimit' },
        totalUsed:      { $sum: '$usedCredit' },
        totalAvailable: { $sum: '$availableCredit' },
        count:          { $sum: 1 },
      }},
    ]);
    return ok(res, exposure);
  } catch (e) { return serverError(res, e); }
};

'use strict';
const GSTReturn              = require('../models/GSTReturn');
const GSTSettlement          = require('../models/GSTSettlement');
const GSTInputCreditLedger   = require('../models/GSTInputCreditLedger');
const GSTOutputTaxLedger     = require('../models/GSTOutputTaxLedger');
const TDSDeduction           = require('../models/TDSDeduction');
const TDSDeposit             = require('../models/TDSDeposit');
const ComplianceTask         = require('../models/ComplianceTask');
const EInvoice               = require('../models/EInvoice');
const EWayBill               = require('../models/EWayBill');
const GSTInvoice             = require('../models/GSTInvoice');
const { ok, serverError }    = require('../utils/response');

exports.getDashboard = async (req, res) => {
  try {
    const now      = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      pendingReturns,
      pendingCompliance,
      overdueCompliance,
      gstPayableAgg,
      itcBalanceAgg,
      outputTaxAgg,
      tdsPayableAgg,
      taxCollectedAgg,
      taxPaidAgg,
      monthlyGST,
      recentEInvoices,
      recentEWayBills,
      eInvoicePending,
      eWayBillExpiring,
    ] = await Promise.all([
      GSTReturn.countDocuments({ status: 'draft', isDeleted: false }),
      ComplianceTask.countDocuments({ status: { $in: ['pending','in_progress'] }, isDeleted: false }),
      ComplianceTask.countDocuments({ status: 'overdue', isDeleted: false }),
      // Net GST payable from latest settlements
      GSTSettlement.aggregate([
        { $match: { status: { $in: ['draft','calculated'] }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$totalPayable' } } },
      ]),
      // ITC balance (credit side of ITC ledger)
      GSTInputCreditLedger.aggregate([
        { $match: { entryType: 'credit', isDeleted: false } },
        { $group: { _id: '$taxHead', balance: { $sum: '$amount' } } },
      ]),
      // Output tax this month
      GSTOutputTaxLedger.aggregate([
        { $match: { entryType: 'liability', entryDate: { $gte: monthStart, $lt: nextMonth }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // TDS payable (pending deposits)
      TDSDeduction.aggregate([
        { $match: { status: 'pending', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$tdsAmount' } } },
      ]),
      // Tax collected (output + TDS) this month
      GSTInvoice.aggregate([
        { $match: { invoiceDate: { $gte: monthStart, $lt: nextMonth }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$totalTax' } } },
      ]),
      // Tax paid (settlements + TDS deposits)
      GSTSettlement.aggregate([
        { $match: { status: 'paid', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$totalPaid' } } },
      ]),
      // Monthly GST trend (last 6 months)
      GSTInvoice.aggregate([
        { $match: { isDeleted: false, invoiceDate: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$invoiceDate' } }, output: { $sum: '$totalTax' }, taxable: { $sum: '$taxableValue' } } },
        { $sort: { _id: 1 } },
      ]),
      // Recent e-invoices
      EInvoice.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5).select('eInvoiceNumber irnStatus invoiceNumber totalValue createdAt'),
      // Recent e-way bills
      EWayBill.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5).select('eWayBillNumber status vehicleNo toName invoiceValue validUpto'),
      // Pending e-invoice generation
      EInvoice.countDocuments({ irnStatus: 'pending', isDeleted: false }),
      // E-way bills expiring in 24 hours
      EWayBill.countDocuments({ status: 'in_transit', validUpto: { $lte: new Date(Date.now() + 86400000) }, isDeleted: false }),
    ]);

    const totalITCBalance = itcBalanceAgg.reduce((s, i) => s + i.balance, 0);

    return ok(res, {
      metrics: {
        gstPayable:       gstPayableAgg[0]?.total || 0,
        itcBalance:       totalITCBalance,
        itcBreakdown:     itcBalanceAgg,
        outputTaxMonth:   outputTaxAgg[0]?.total || 0,
        tdsPayable:       tdsPayableAgg[0]?.total || 0,
        pendingReturns,
        pendingCompliance,
        overdueCompliance,
        taxCollected:     taxCollectedAgg[0]?.total || 0,
        taxPaid:          taxPaidAgg[0]?.total || 0,
        eInvoicePending,
        eWayBillExpiring,
      },
      monthlyGST,
      recentEInvoices,
      recentEWayBills,
    });
  } catch (e) { return serverError(res, e); }
};

exports.getComplianceStatus = async (req, res) => {
  try {
    const now = new Date();
    const [tasks] = await Promise.all([
      ComplianceTask.find({ isDeleted: false })
        .sort({ dueDate: 1 })
        .limit(20)
        .select('taskNumber taskName complianceType period dueDate status priority'),
    ]);
    const overdue   = tasks.filter(t => t.status === 'overdue' || (t.status === 'pending' && t.dueDate < now));
    const upcoming  = tasks.filter(t => t.status === 'pending' && t.dueDate >= now);
    const completed = tasks.filter(t => t.status === 'completed');
    return ok(res, { overdue, upcoming, completed });
  } catch (e) { return serverError(res, e); }
};

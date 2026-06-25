'use strict';
const GSTReturn            = require('../models/GSTReturn');
const GSTInvoice           = require('../models/GSTInvoice');
const GSTSettlement        = require('../models/GSTSettlement');
const GSTInputCreditLedger = require('../models/GSTInputCreditLedger');
const GSTOutputTaxLedger   = require('../models/GSTOutputTaxLedger');
const TDSDeduction         = require('../models/TDSDeduction');
const TDSDeposit           = require('../models/TDSDeposit');
const TDSCertificate       = require('../models/TDSCertificate');
const TaxAudit             = require('../models/TaxAudit');
const ComplianceTask       = require('../models/ComplianceTask');
const GSTInputCredit       = require('../models/GSTInputCredit');
const { ok, serverError }  = require('../utils/response');

// ── GSTR-1 Summary ────────────────────────────────────────────────────────────

exports.getGSTR1Summary = async (req, res) => {
  try {
    const { period } = req.query;
    if (!period) return res.status(400).json({ success: false, message: 'period is required (YYYY-MM)' });

    const [byType, totals, b2bInvoices] = await Promise.all([
      GSTInvoice.aggregate([
        { $match: { gstr1Period: period, isDeleted: false } },
        { $group: { _id: '$invoiceType', count: { $sum: 1 }, taxableValue: { $sum: '$taxableValue' }, totalTax: { $sum: '$totalTax' }, invoiceValue: { $sum: '$invoiceValue' } } },
      ]),
      GSTInvoice.aggregate([
        { $match: { gstr1Period: period, isDeleted: false } },
        { $group: { _id: null, count: { $sum: 1 }, taxableValue: { $sum: '$taxableValue' }, igst: { $sum: '$igstAmount' }, cgst: { $sum: '$cgstAmount' }, sgst: { $sum: '$sgstAmount' }, cess: { $sum: '$cessAmount' }, totalTax: { $sum: '$totalTax' }, invoiceValue: { $sum: '$invoiceValue' } } },
      ]),
      GSTInvoice.find({ gstr1Period: period, invoiceType: 'B2B', isDeleted: false }).sort({ invoiceDate: 1 }).select('gstInvoiceNumber invoiceDate partyName partyGSTIN taxableValue igstAmount cgstAmount sgstAmount totalTax invoiceValue supplyType'),
    ]);

    return ok(res, { period, summary: totals[0] || {}, byType, b2bInvoices });
  } catch (e) { return serverError(res, e); }
};

// ── GSTR-3B Summary ───────────────────────────────────────────────────────────

exports.getGSTR3BSummary = async (req, res) => {
  try {
    const { period } = req.query;
    if (!period) return res.status(400).json({ success: false, message: 'period is required (YYYY-MM)' });

    const [outputTax, itcAvailable, gstReturn] = await Promise.all([
      GSTOutputTaxLedger.aggregate([
        { $match: { period, entryType: 'liability', isDeleted: false } },
        { $group: { _id: '$taxHead', amount: { $sum: '$amount' } } },
      ]),
      GSTInputCreditLedger.aggregate([
        { $match: { period, entryType: 'credit', isDeleted: false } },
        { $group: { _id: '$taxHead', amount: { $sum: '$amount' } } },
      ]),
      GSTReturn.findOne({ period, returnType: 'GSTR-3B', isDeleted: false }).select('returnNumber status filingDate totalIGST totalCGST totalSGST totalCess'),
    ]);

    const toMap = (arr) => arr.reduce((m, i) => { m[i._id] = i.amount; return m; }, {});
    const outputMap = toMap(outputTax);
    const itcMap    = toMap(itcAvailable);

    return ok(res, {
      period,
      outwardSupplies: outputMap,
      itcAvailable:    itcMap,
      netPayable: {
        igst: (outputMap.igst || 0) - (itcMap.igst || 0),
        cgst: (outputMap.cgst || 0) - (itcMap.cgst || 0),
        sgst: (outputMap.sgst || 0) - (itcMap.sgst || 0),
        cess: (outputMap.cess || 0) - (itcMap.cess || 0),
      },
      existingReturn: gstReturn || null,
    });
  } catch (e) { return serverError(res, e); }
};

// ── Input Credit Register ─────────────────────────────────────────────────────

exports.getInputCreditReport = async (req, res) => {
  try {
    const { period, search } = req.query;
    const q = { isDeleted: false };
    if (period) q.filedPeriod = period;
    if (search) q.$or = [{ vendorName: { $regex: search, $options: 'i' } }, { creditNumber: { $regex: search, $options: 'i' } }];
    const [data, totals] = await Promise.all([
      GSTInputCredit.find(q).sort({ billDate: 1 }).populate('vendor','name'),
      GSTInputCredit.aggregate([
        { $match: q },
        { $group: { _id: null, igst: { $sum: '$igstAmount' }, cgst: { $sum: '$cgstAmount' }, sgst: { $sum: '$sgstAmount' }, totalITC: { $sum: '$totalITC' }, count: { $sum: 1 } } },
      ]),
    ]);
    return ok(res, { period, records: data, totals: totals[0] || {} });
  } catch (e) { return serverError(res, e); }
};

// ── TDS Register ──────────────────────────────────────────────────────────────

exports.getTDSRegister = async (req, res) => {
  try {
    const { assessmentYear, quarter, status } = req.query;
    const q = { isDeleted: false };
    if (assessmentYear) q.assessmentYear = assessmentYear;
    if (quarter)        q.quarter        = quarter;
    if (status)         q.status         = status;
    const [deductions, totals] = await Promise.all([
      TDSDeduction.find(q).sort({ deductionDate: 1 }).populate('tdsSection','section description'),
      TDSDeduction.aggregate([
        { $match: q },
        { $group: { _id: '$assessmentYear', grossAmount: { $sum: '$grossAmount' }, tdsAmount: { $sum: '$tdsAmount' }, count: { $sum: 1 } } },
      ]),
    ]);
    return ok(res, { deductions, totals });
  } catch (e) { return serverError(res, e); }
};

// ── GST Settlement Report ─────────────────────────────────────────────────────

exports.getSettlementReport = async (req, res) => {
  try {
    const { period, status } = req.query;
    const q = { isDeleted: false };
    if (period) q.period = period;
    if (status) q.status = status;
    const [settlements, totals] = await Promise.all([
      GSTSettlement.find(q).sort({ createdAt: -1 }),
      GSTSettlement.aggregate([
        { $match: q },
        { $group: { _id: '$status', totalPayable: { $sum: '$totalPayable' }, totalPaid: { $sum: '$totalPaid' }, count: { $sum: 1 } } },
      ]),
    ]);
    return ok(res, { settlements, totals });
  } catch (e) { return serverError(res, e); }
};

// ── Tax Audit Report ──────────────────────────────────────────────────────────

exports.getTaxAuditReport = async (req, res) => {
  try {
    const { fiscalYear } = req.query;
    const q = { isDeleted: false };
    if (fiscalYear) q.fiscalYear = fiscalYear;
    const [audits, summary] = await Promise.all([
      TaxAudit.find(q).sort({ createdAt: -1 }),
      TaxAudit.aggregate([
        { $match: q },
        { $group: { _id: '$status', turnover: { $sum: '$turnover' }, totalTaxPayable: { $sum: '$totalTaxPayable' }, totalTaxPaid: { $sum: '$totalTaxPaid' }, count: { $sum: 1 } } },
      ]),
    ]);
    return ok(res, { fiscalYear, audits, summary });
  } catch (e) { return serverError(res, e); }
};

// ── Compliance Summary ────────────────────────────────────────────────────────

exports.getComplianceSummary = async (req, res) => {
  try {
    const { period, fiscalYear } = req.query;
    const q = { isDeleted: false };
    if (period)     q.period     = period;
    if (fiscalYear) q.fiscalYear = fiscalYear;
    const [byStatus, overdue] = await Promise.all([
      ComplianceTask.aggregate([
        { $match: q },
        { $group: { _id: { status: '$status', complianceType: '$complianceType' }, count: { $sum: 1 } } },
      ]),
      ComplianceTask.find({ ...q, status: 'overdue' }).sort({ dueDate: 1 }).select('taskNumber taskName complianceType dueDate period priority'),
    ]);
    return ok(res, { byStatus, overdue });
  } catch (e) { return serverError(res, e); }
};

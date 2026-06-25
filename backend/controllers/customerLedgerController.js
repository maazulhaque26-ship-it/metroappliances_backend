const mongoose      = require('mongoose');
const CustomerLedger  = require('../models/CustomerLedger');
const CustomerStatement = require('../models/CustomerStatement');
const { paginated, created, ok, notFound, serverError, noContent } = require('../utils/response');

// ── List ledger entries ───────────────────────────────────────────────────────

exports.getLedger = async (req, res) => {
  try {
    const { page = 1, limit = 20, customer, startDate, endDate, entryType } = req.query;
    const q = { isDeleted: false };
    if (customer)  q.customer  = customer;
    if (entryType) q.entryType = entryType;
    if (startDate || endDate) {
      q.entryDate = {};
      if (startDate) q.entryDate.$gte = new Date(startDate);
      if (endDate)   q.entryDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      CustomerLedger.find(q).sort({ entryDate: -1 })
        .populate('customer', 'name email')
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      CustomerLedger.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getLedgerEntry = async (req, res) => {
  try {
    const doc = await CustomerLedger.findOne({ _id: req.params.id, isDeleted: false })
      .populate('customer', 'name email');
    if (!doc) return notFound(res, 'Ledger Entry');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── Customer account statement with running balance ───────────────────────────

exports.getAccountStatement = async (req, res) => {
  try {
    const { customer, fromDate, toDate } = req.query;
    if (!customer || !fromDate || !toDate) return serverError(res, { message: 'customer, fromDate, toDate required' });

    const custId = mongoose.Types.ObjectId.createFromHexString(customer);
    const from   = new Date(fromDate);
    const to     = new Date(toDate);

    const openingAgg = await CustomerLedger.aggregate([
      { $match: { customer: custId, isDeleted: false, entryDate: { $lt: from } } },
      { $group: { _id: null, debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
    ]);
    const openingBalance = openingAgg.length ? (openingAgg[0].debit - openingAgg[0].credit) : 0;

    const entries = await CustomerLedger.find({ customer: custId, isDeleted: false, entryDate: { $gte: from, $lte: to } })
      .sort({ entryDate: 1, createdAt: 1 }).lean();

    let running = openingBalance;
    const lines = entries.map(e => {
      running += e.debit - e.credit;
      return { ...e, runningBalance: running };
    });

    return ok(res, { customer, fromDate, toDate, openingBalance, closingBalance: running, entries: lines });
  } catch (e) { return serverError(res, e); }
};

// ── Statements ────────────────────────────────────────────────────────────────

exports.getStatements = async (req, res) => {
  try {
    const { page = 1, limit = 20, customer } = req.query;
    const q = { isDeleted: false };
    if (customer) q.customer = customer;
    const [data, total] = await Promise.all([
      CustomerStatement.find(q).sort({ createdAt: -1 }).populate('customer', 'name email').skip((page - 1) * limit).limit(Number(limit)).lean(),
      CustomerStatement.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getStatement = async (req, res) => {
  try {
    const doc = await CustomerStatement.findOne({ _id: req.params.id, isDeleted: false }).populate('customer', 'name email');
    if (!doc) return notFound(res, 'Customer Statement');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.generateStatement = async (req, res) => {
  try {
    const { customer, fromDate, toDate } = req.body;
    if (!customer || !fromDate || !toDate) return serverError(res, { message: 'customer, fromDate, toDate required' });

    const custId = mongoose.Types.ObjectId.createFromHexString(customer);
    const from   = new Date(fromDate);
    const to     = new Date(toDate);

    const openingAgg = await CustomerLedger.aggregate([
      { $match: { customer: custId, isDeleted: false, entryDate: { $lt: from } } },
      { $group: { _id: null, debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
    ]);
    const openingBalance = openingAgg.length ? (openingAgg[0].debit - openingAgg[0].credit) : 0;

    const entries = await CustomerLedger.find({ customer: custId, isDeleted: false, entryDate: { $gte: from, $lte: to } })
      .sort({ entryDate: 1 }).lean();

    let running = openingBalance;
    let totalDebits = 0, totalCredits = 0;
    const lines = entries.map(e => {
      running += e.debit - e.credit;
      totalDebits  += e.debit;
      totalCredits += e.credit;
      return { entryDate: e.entryDate, reference: e.reference, narration: e.narration, debit: e.debit, credit: e.credit, runningBalance: running };
    });

    const stmt = await CustomerStatement.create({
      customer,
      fromDate: from,
      toDate:   to,
      openingBalance,
      closingBalance: running,
      totalDebits,
      totalCredits,
      statementLines: lines,
      generatedBy: req.admin._id,
    });

    return created(res, stmt, 'Statement generated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteStatement = async (req, res) => {
  try {
    const doc = await CustomerStatement.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Customer Statement');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Statement deleted');
  } catch (e) { return serverError(res, e); }
};

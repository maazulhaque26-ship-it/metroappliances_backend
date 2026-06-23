const VendorLedger    = require('../models/VendorLedger');
const VendorStatement = require('../models/VendorStatement');
const VendorBill      = require('../models/VendorBill');
const VendorPayment   = require('../models/VendorPayment');
const { paginated, created, ok, notFound, serverError, fail } = require('../utils/response');

// ── Ledger entries per vendor ─────────────────────────────────────────────────

exports.getLedger = async (req, res) => {
  try {
    const { vendor, page = 1, limit = 50, startDate, endDate } = req.query;
    if (!vendor) return fail(res, 'vendor query parameter is required');
    const q = { vendor, isDeleted: false };
    if (startDate || endDate) {
      q.entryDate = {};
      if (startDate) q.entryDate.$gte = new Date(startDate);
      if (endDate)   q.entryDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      VendorLedger.find(q).sort({ entryDate: 1, createdAt: 1 }).skip((page - 1) * limit).limit(Number(limit)).lean(),
      VendorLedger.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getLedgerEntry = async (req, res) => {
  try {
    const doc = await VendorLedger.findOne({ _id: req.params.id, isDeleted: false })
      .populate('vendor', 'name').populate('journalEntry', 'journalNumber');
    if (!doc) return notFound(res, 'Ledger Entry');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── Account statement ─────────────────────────────────────────────────────────

exports.getAccountStatement = async (req, res) => {
  try {
    const { vendor, fromDate, toDate } = req.query;
    if (!vendor) return fail(res, 'vendor query parameter is required');
    if (!fromDate || !toDate) return fail(res, 'fromDate and toDate are required');

    const from = new Date(fromDate);
    const to   = new Date(toDate);

    // Opening balance: sum of all entries before fromDate
    const openingAgg = await VendorLedger.aggregate([
      { $match: { vendor: require('mongoose').Types.ObjectId.createFromHexString(vendor), entryDate: { $lt: from }, isDeleted: false } },
      { $group: { _id: null, totalDebit: { $sum: '$debit' }, totalCredit: { $sum: '$credit' } } },
    ]);
    const openingBalance = openingAgg.length > 0 ? openingAgg[0].totalDebit - openingAgg[0].totalCredit : 0;

    const entries = await VendorLedger.find({ vendor, entryDate: { $gte: from, $lte: to }, isDeleted: false })
      .sort({ entryDate: 1, createdAt: 1 }).lean();

    let running = openingBalance;
    const lines = entries.map(e => {
      running += (e.debit - e.credit);
      return { ...e, runningBalance: running };
    });

    const totalDebits  = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredits = entries.reduce((s, e) => s + e.credit, 0);
    const closingBalance = openingBalance + totalDebits - totalCredits;

    return ok(res, { openingBalance, lines, totalDebits, totalCredits, closingBalance, fromDate, toDate });
  } catch (e) { return serverError(res, e); }
};

// ── Statements ────────────────────────────────────────────────────────────────

exports.getStatements = async (req, res) => {
  try {
    const { page = 1, limit = 20, vendor } = req.query;
    const q = { isDeleted: false };
    if (vendor) q.vendor = vendor;
    const [data, total] = await Promise.all([
      VendorStatement.find(q).sort({ createdAt: -1 }).populate('vendor', 'name').skip((page - 1) * limit).limit(Number(limit)).lean(),
      VendorStatement.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getStatement = async (req, res) => {
  try {
    const doc = await VendorStatement.findOne({ _id: req.params.id, isDeleted: false }).populate('vendor', 'name email');
    if (!doc) return notFound(res, 'Vendor Statement');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.generateStatement = async (req, res) => {
  try {
    const { vendor, fromDate, toDate } = req.body;
    if (!vendor || !fromDate || !toDate) return fail(res, 'vendor, fromDate, toDate are required');

    const from = new Date(fromDate);
    const to   = new Date(toDate);

    const openingAgg = await VendorLedger.aggregate([
      { $match: { vendor: require('mongoose').Types.ObjectId.createFromHexString(vendor), entryDate: { $lt: from }, isDeleted: false } },
      { $group: { _id: null, totalDebit: { $sum: '$debit' }, totalCredit: { $sum: '$credit' } } },
    ]);
    const openingBalance = openingAgg.length > 0 ? openingAgg[0].totalDebit - openingAgg[0].totalCredit : 0;

    const entries = await VendorLedger.find({ vendor, entryDate: { $gte: from, $lte: to }, isDeleted: false })
      .sort({ entryDate: 1, createdAt: 1 }).lean();

    let running = openingBalance;
    const lines = entries.map(e => ({
      entryDate:   e.entryDate,
      entryType:   e.entryType,
      reference:   e.reference,
      narration:   e.narration,
      debit:       e.debit,
      credit:      e.credit,
      balance:     (running += (e.debit - e.credit), running),
    }));

    const totalDebits  = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredits = entries.reduce((s, e) => s + e.credit, 0);
    const closingBalance = openingBalance + totalDebits - totalCredits;

    const doc = await VendorStatement.create({
      vendor,
      fromDate: from,
      toDate:   to,
      openingBalance,
      totalDebits,
      totalCredits,
      closingBalance,
      lines,
      generatedBy: req.admin._id,
    });

    return created(res, doc, 'Statement generated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteStatement = async (req, res) => {
  try {
    const doc = await VendorStatement.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Vendor Statement');
    doc.isDeleted = true;
    await doc.save();
    return ok(res, null, 'Statement deleted');
  } catch (e) { return serverError(res, e); }
};

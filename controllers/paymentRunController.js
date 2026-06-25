const PaymentRun    = require('../models/PaymentRun');
const PaymentBatch  = require('../models/PaymentBatch');
const VendorPayment = require('../models/VendorPayment');
const VendorBill    = require('../models/VendorBill');
const AuditLog      = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── List & Get ────────────────────────────────────────────────────────────────

exports.getPaymentRuns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const q = { isDeleted: false };
    if (status) q.status = status;
    const [data, total] = await Promise.all([
      PaymentRun.find(q).sort({ runDate: -1 }).populate('approvedBy', 'name').skip((page - 1) * limit).limit(Number(limit)).lean(),
      PaymentRun.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getPaymentRun = async (req, res) => {
  try {
    const doc = await PaymentRun.findOne({ _id: req.params.id, isDeleted: false })
      .populate('filterVendors', 'name')
      .populate('proposalList.vendor', 'name email')
      .populate('approvedBy', 'name');
    if (!doc) return notFound(res, 'Payment Run');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── Create ────────────────────────────────────────────────────────────────────

exports.createPaymentRun = async (req, res) => {
  try {
    const doc = await PaymentRun.create({ ...req.body, createdBy: req.admin._id });
    return created(res, doc, 'Payment run created');
  } catch (e) { return serverError(res, e); }
};

// ── Propose — auto-populate bills matching criteria ───────────────────────────

exports.proposePaymentRun = async (req, res) => {
  try {
    const doc = await PaymentRun.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Payment Run');
    if (!['draft'].includes(doc.status)) return fail(res, 'Only draft runs can be proposed');

    const q = { isDeleted: false, status: { $in: ['approved','partially_paid','overdue'] }, outstandingAmount: { $gt: 0 } };
    if (doc.filterVendors && doc.filterVendors.length > 0) q.vendor = { $in: doc.filterVendors };
    if (doc.filterDueBefore) q.dueDate = { $lte: doc.filterDueBefore };
    if (doc.filterOverdue) q.status = 'overdue';

    const bills = await VendorBill.find(q).lean();

    // Group by vendor
    const vendorMap = {};
    for (const bill of bills) {
      const vid = bill.vendor.toString();
      if (!vendorMap[vid]) vendorMap[vid] = { vendor: bill.vendor, vendorName: bill.vendorName, bills: [], billCount: 0, totalDue: 0, paymentAmount: 0, include: true };
      vendorMap[vid].bills.push(bill._id);
      vendorMap[vid].billCount++;
      vendorMap[vid].totalDue      += bill.outstandingAmount;
      vendorMap[vid].paymentAmount += bill.outstandingAmount;
    }

    doc.proposalList  = Object.values(vendorMap);
    doc.totalProposed = doc.proposalList.reduce((s, v) => s + v.totalDue, 0);
    doc.vendorCount   = doc.proposalList.length;
    doc.billCount     = bills.length;
    doc.status        = 'proposed';
    await doc.save();

    return ok(res, doc, 'Payment run proposed');
  } catch (e) { return serverError(res, e); }
};

// ── Approve ───────────────────────────────────────────────────────────────────

exports.approvePaymentRun = async (req, res) => {
  try {
    const doc = await PaymentRun.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Payment Run');
    if (doc.status !== 'proposed') return fail(res, 'Only proposed runs can be approved');

    const included = doc.proposalList.filter(v => v.include);
    doc.totalApproved = included.reduce((s, v) => s + v.paymentAmount, 0);
    doc.vendorCount   = included.length;
    doc.status        = 'approved';
    doc.approvedBy    = req.admin._id;
    doc.approvedAt    = new Date();
    await doc.save();

    await AuditLog.create({
      admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      adminRole: req.admin.role, action: 'APPROVE', entity: 'PaymentRun',
      entityId: doc._id, entityLabel: doc.runNumber,
      changes: { before: { status: 'proposed' }, after: { status: 'approved', totalApproved: doc.totalApproved } },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });

    return ok(res, doc, 'Payment run approved');
  } catch (e) { return serverError(res, e); }
};

// ── Execute — create VendorPayments for each vendor ──────────────────────────

exports.executePaymentRun = async (req, res) => {
  try {
    const doc = await PaymentRun.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Payment Run');
    if (doc.status !== 'approved') return fail(res, 'Only approved runs can be executed');

    const paymentDate = doc.paymentDate || new Date();
    const included    = doc.proposalList.filter(v => v.include);

    // Create a batch
    const batch = await PaymentBatch.create({
      batchDate:     new Date(),
      paymentMethod: doc.paymentMethod,
      bankAccount:   doc.bankAccount,
      totalAmount:   doc.totalApproved,
      vendorCount:   included.length,
      billCount:     doc.billCount,
      status:        'processing',
      createdBy:     req.admin._id,
    });

    const payments = [];
    let failed = 0;

    for (const item of included) {
      try {
        const allocations = item.bills.map(bid => ({ vendorBill: bid, allocatedAmount: 0, billNumber: '' }));
        const bills = await VendorBill.find({ _id: { $in: item.bills } }).lean();
        for (const alloc of allocations) {
          const b = bills.find(b => b._id.toString() === alloc.vendorBill.toString());
          if (b) { alloc.allocatedAmount = b.outstandingAmount; alloc.billNumber = b.billNumber; }
        }

        const payment = await VendorPayment.create({
          paymentType:      'batch',
          vendor:           item.vendor,
          vendorName:       item.vendorName,
          paymentDate,
          paymentMethod:    doc.paymentMethod,
          bankAccount:      doc.bankAccount,
          amount:           item.paymentAmount,
          netAmount:        item.paymentAmount,
          allocations,
          unallocatedAmount: 0,
          status:           'approved',
          paymentBatch:     batch._id,
          paymentRun:       doc._id,
          createdBy:        req.admin._id,
        });
        payments.push(payment._id);
      } catch (_) { failed++; }
    }

    batch.payments = payments;
    batch.status   = failed > 0 ? 'failed' : 'completed';
    batch.processedAt = new Date();
    await batch.save();

    doc.status      = failed > 0 ? (failed < included.length ? 'partially_failed' : 'failed') : 'executed';
    doc.executedAt  = new Date();
    doc.paymentBatch = batch._id;
    await doc.save();

    return ok(res, { run: doc, batch, payments: payments.length, failed }, 'Payment run executed');
  } catch (e) { return serverError(res, e); }
};

// ── Cancel / Delete ───────────────────────────────────────────────────────────

exports.cancelPaymentRun = async (req, res) => {
  try {
    const doc = await PaymentRun.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Payment Run');
    if (['executed','cancelled'].includes(doc.status)) return fail(res, 'Cannot cancel this run');
    doc.status = 'cancelled';
    await doc.save();
    return ok(res, doc, 'Payment run cancelled');
  } catch (e) { return serverError(res, e); }
};

exports.deletePaymentRun = async (req, res) => {
  try {
    const doc = await PaymentRun.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Payment Run');
    if (!['draft','cancelled'].includes(doc.status)) return fail(res, 'Only draft or cancelled runs can be deleted');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Payment run deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Payment Batches ───────────────────────────────────────────────────────────

exports.getPaymentBatches = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const q = { isDeleted: false };
    if (status) q.status = status;
    const [data, total] = await Promise.all([
      PaymentBatch.find(q).sort({ batchDate: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean(),
      PaymentBatch.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getPaymentBatch = async (req, res) => {
  try {
    const doc = await PaymentBatch.findOne({ _id: req.params.id, isDeleted: false })
      .populate('payments', 'paymentNumber vendor amount status');
    if (!doc) return notFound(res, 'Payment Batch');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── Payment Advice ────────────────────────────────────────────────────────────

exports.getPaymentAdvices = async (req, res) => {
  try {
    const PaymentAdvice = require('../models/PaymentAdvice');
    const { page = 1, limit = 20, vendor, status } = req.query;
    const q = { isDeleted: false };
    if (vendor) q.vendor = vendor;
    if (status) q.status = status;
    const [data, total] = await Promise.all([
      PaymentAdvice.find(q).sort({ createdAt: -1 }).populate('vendor', 'name').skip((page - 1) * limit).limit(Number(limit)).lean(),
      PaymentAdvice.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getPaymentAdvice = async (req, res) => {
  try {
    const PaymentAdvice = require('../models/PaymentAdvice');
    const doc = await PaymentAdvice.findOne({ _id: req.params.id, isDeleted: false })
      .populate('vendor', 'name email').populate('payment', 'paymentNumber amount');
    if (!doc) return notFound(res, 'Payment Advice');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createPaymentAdvice = async (req, res) => {
  try {
    const PaymentAdvice = require('../models/PaymentAdvice');
    const doc = await PaymentAdvice.create({ ...req.body, createdBy: req.admin._id });
    return created(res, doc, 'Payment advice created');
  } catch (e) { return serverError(res, e); }
};

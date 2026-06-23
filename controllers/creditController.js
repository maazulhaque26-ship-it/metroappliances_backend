const CustomerCreditLimit  = require('../models/CustomerCreditLimit');
const CustomerCreditReview = require('../models/CustomerCreditReview');
const CustomerInvoice      = require('../models/CustomerInvoice');
const AuditLog             = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── Credit Limits ─────────────────────────────────────────────────────────────

exports.getCreditLimits = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', riskRating, isBlocked } = req.query;
    const q = { isDeleted: false };
    if (search) q.$or = [{ customerName: { $regex: search, $options: 'i' } }];
    if (riskRating !== undefined) q.riskRating = riskRating;
    if (isBlocked  !== undefined) q.isBlocked  = isBlocked === 'true';
    const [data, total] = await Promise.all([
      CustomerCreditLimit.find(q).sort({ creditLimit: -1 }).populate('customer', 'name email').skip((page - 1) * limit).limit(Number(limit)).lean(),
      CustomerCreditLimit.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getCreditLimit = async (req, res) => {
  try {
    const doc = await CustomerCreditLimit.findOne({ _id: req.params.id, isDeleted: false }).populate('customer', 'name email phone');
    if (!doc) return notFound(res, 'Credit Limit');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.getCreditLimitByCustomer = async (req, res) => {
  try {
    const doc = await CustomerCreditLimit.findOne({ customer: req.params.customerId, isDeleted: false });
    if (!doc) return notFound(res, 'Credit Limit');

    const outstanding = await CustomerInvoice.aggregate([
      { $match: { customer: doc.customer, isDeleted: false, status: { $in: ['approved','partially_paid','overdue'] } } },
      { $group: { _id: null, total: { $sum: '$outstandingAmount' } } },
    ]);
    const usedCredit = outstanding[0]?.total || 0;
    doc.usedCredit      = usedCredit;
    doc.availableCredit = Math.max(0, doc.creditLimit - usedCredit);
    await doc.save();

    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createCreditLimit = async (req, res) => {
  try {
    const existing = await CustomerCreditLimit.findOne({ customer: req.body.customer, isDeleted: false });
    if (existing) return fail(res, 'Credit limit already exists for this customer');
    const doc = await CustomerCreditLimit.create({
      ...req.body,
      availableCredit: req.body.creditLimit || 0,
      approvedBy:      req.admin._id,
      approvedAt:      new Date(),
    });
    await AuditLog.create({
      admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      adminRole: req.admin.role, action: 'CREATE', entity: 'CustomerCreditLimit',
      entityId: doc._id, entityLabel: doc.customerName,
      changes: { before: null, after: doc.toObject() },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return created(res, doc, 'Credit limit created');
  } catch (e) { return serverError(res, e); }
};

exports.updateCreditLimit = async (req, res) => {
  try {
    const doc = await CustomerCreditLimit.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Credit Limit');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    doc.approvedBy  = req.admin._id;
    doc.approvedAt  = new Date();
    await doc.save();
    const io = req.app.locals.io;
    if (io) io.emit('finance:credit_limit_changed', { customerId: doc.customer, creditLimit: doc.creditLimit });
    await AuditLog.create({
      admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      adminRole: req.admin.role, action: 'UPDATE', entity: 'CustomerCreditLimit',
      entityId: doc._id, entityLabel: doc.customerName,
      changes: { before, after: doc.toObject() },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return ok(res, doc, 'Credit limit updated');
  } catch (e) { return serverError(res, e); }
};

exports.blockCustomer = async (req, res) => {
  try {
    const doc = await CustomerCreditLimit.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Credit Limit');
    doc.isBlocked   = true;
    doc.blockReason = req.body.reason || 'Blocked by admin';
    doc.blockedAt   = new Date();
    doc.blockedBy   = req.admin._id;
    doc.riskRating  = 'blocked';
    await doc.save();
    const io = req.app.locals.io;
    if (io) io.emit('finance:credit_limit_changed', { customerId: doc.customer, isBlocked: true });
    return ok(res, doc, 'Customer credit blocked');
  } catch (e) { return serverError(res, e); }
};

exports.unblockCustomer = async (req, res) => {
  try {
    const doc = await CustomerCreditLimit.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Credit Limit');
    doc.isBlocked   = false;
    doc.blockReason = '';
    doc.riskRating  = req.body.riskRating || 'medium';
    await doc.save();
    const io = req.app.locals.io;
    if (io) io.emit('finance:credit_limit_changed', { customerId: doc.customer, isBlocked: false });
    return ok(res, doc, 'Customer credit unblocked');
  } catch (e) { return serverError(res, e); }
};

exports.deleteCreditLimit = async (req, res) => {
  try {
    const doc = await CustomerCreditLimit.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Credit Limit');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Credit limit deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Credit Reviews ────────────────────────────────────────────────────────────

exports.getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, customer, status } = req.query;
    const q = { isDeleted: false };
    if (customer) q.customer = customer;
    if (status)   q.status   = status;
    const [data, total] = await Promise.all([
      CustomerCreditReview.find(q).sort({ reviewDate: -1 }).populate('customer', 'name email').populate('requestedBy', 'name').skip((page - 1) * limit).limit(Number(limit)).lean(),
      CustomerCreditReview.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createReview = async (req, res) => {
  try {
    const doc = await CustomerCreditReview.create({ ...req.body, requestedBy: req.admin._id });
    return created(res, doc, 'Credit review requested');
  } catch (e) { return serverError(res, e); }
};

exports.approveReview = async (req, res) => {
  try {
    const review = await CustomerCreditReview.findOne({ _id: req.params.id, isDeleted: false });
    if (!review) return notFound(res, 'Credit Review');
    if (review.status !== 'pending') return fail(res, 'Only pending reviews can be approved');

    review.status        = 'approved';
    review.approvedLimit = req.body.approvedLimit || review.proposedLimit;
    review.approvedBy    = req.admin._id;
    review.approvedAt    = new Date();
    await review.save();

    if (review.creditLimit) {
      const cl = await CustomerCreditLimit.findById(review.creditLimit);
      if (cl) {
        cl.creditLimit    = review.approvedLimit;
        cl.availableCredit = Math.max(0, review.approvedLimit - cl.usedCredit);
        cl.lastReviewDate = new Date();
        if (review.riskRatingChange) cl.riskRating = review.riskRatingChange;
        await cl.save();
      }
    }

    const io = req.app.locals.io;
    if (io) io.emit('finance:credit_limit_changed', { customerId: review.customer, newLimit: review.approvedLimit });

    return ok(res, review, 'Credit review approved and limit updated');
  } catch (e) { return serverError(res, e); }
};

exports.rejectReview = async (req, res) => {
  try {
    const review = await CustomerCreditReview.findOne({ _id: req.params.id, isDeleted: false });
    if (!review) return notFound(res, 'Credit Review');
    review.status          = 'rejected';
    review.rejectionReason = req.body.reason || '';
    review.approvedBy      = req.admin._id;
    review.approvedAt      = new Date();
    await review.save();
    return ok(res, review, 'Credit review rejected');
  } catch (e) { return serverError(res, e); }
};

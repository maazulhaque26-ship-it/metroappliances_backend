const PurchaseRequisition = require('../models/PurchaseRequisition');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');
const { generatePRNumber, buildApprovalChain } = require('../utils/procurementHelpers');

exports.getRequisitions = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (search)   filter.$or = [
      { prNumber:        { $regex: search, $options: 'i' } },
      { title:           { $regex: search, $options: 'i' } },
      { requestedByName: { $regex: search, $options: 'i' } },
    ];
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      PurchaseRequisition.find(filter).populate('requestedBy', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      PurchaseRequisition.countDocuments(filter),
    ]);
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.createRequisition = async (req, res) => {
  try {
    const prNumber = await generatePRNumber();
    const pr = await PurchaseRequisition.create({
      ...req.body,
      prNumber,
      requestedBy: req.user._id,
      requestedByName: req.user.name,
      approvalSteps: buildApprovalChain(),
    });
    return created(res, pr, 'Purchase requisition created');
  } catch (err) { return serverError(res, err); }
};

exports.getRequisitionById = async (req, res) => {
  try {
    const pr = await PurchaseRequisition.findOne({ _id: req.params.id, isDeleted: false })
      .populate('requestedBy', 'name email')
      .populate('items.product', 'name sku images')
      .populate('items.preferredVendor', 'companyName vendorCode')
      .populate('purchaseOrder', 'poNumber status totalAmount');
    if (!pr) return notFound(res, 'Purchase requisition not found');
    return ok(res, pr);
  } catch (err) { return serverError(res, err); }
};

exports.updateRequisition = async (req, res) => {
  try {
    const pr = await PurchaseRequisition.findOne({ _id: req.params.id, isDeleted: false });
    if (!pr) return notFound(res, 'Requisition not found');
    if (!['draft', 'submitted'].includes(pr.status)) return fail(res, 'Cannot edit requisition in current status');
    Object.assign(pr, req.body);
    await pr.save();
    return ok(res, pr, 'Requisition updated');
  } catch (err) { return serverError(res, err); }
};

exports.submitRequisition = async (req, res) => {
  try {
    const pr = await PurchaseRequisition.findOne({ _id: req.params.id, isDeleted: false });
    if (!pr) return notFound(res, 'Requisition not found');
    if (pr.status !== 'draft') return fail(res, 'Only draft requisitions can be submitted');
    pr.status = 'submitted';
    pr.currentApprovalStep = 1;
    await pr.save();
    return ok(res, pr, 'Requisition submitted for approval');
  } catch (err) { return serverError(res, err); }
};

exports.approveRequisition = async (req, res) => {
  try {
    const pr = await PurchaseRequisition.findOne({ _id: req.params.id, isDeleted: false });
    if (!pr) return notFound(res, 'Requisition not found');
    if (!['submitted', 'manager_review', 'finance_review'].includes(pr.status)) {
      return fail(res, 'Requisition cannot be approved in current status');
    }

    const step = pr.approvalSteps.find(s => s.step === pr.currentApprovalStep);
    if (step) {
      step.status      = 'approved';
      step.approver    = req.user._id;
      step.approverName = req.user.name;
      step.comments    = req.body.comments;
      step.actedAt     = new Date();
    }

    const nextStep = pr.approvalSteps.find(s => s.step === pr.currentApprovalStep + 1);
    if (nextStep) {
      pr.currentApprovalStep += 1;
      pr.status = nextStep.role === 'finance' ? 'finance_review' : 'manager_review';
    } else {
      pr.status = 'approved';
    }
    await pr.save();
    return ok(res, pr, 'Requisition approved');
  } catch (err) { return serverError(res, err); }
};

exports.rejectRequisition = async (req, res) => {
  try {
    const pr = await PurchaseRequisition.findOne({ _id: req.params.id, isDeleted: false });
    if (!pr) return notFound(res, 'Requisition not found');
    if (pr.status === 'approved' || pr.status === 'converted') return fail(res, 'Cannot reject at this stage');

    const step = pr.approvalSteps.find(s => s.step === pr.currentApprovalStep);
    if (step) {
      step.status      = 'rejected';
      step.approver    = req.user._id;
      step.approverName = req.user.name;
      step.comments    = req.body.comments;
      step.actedAt     = new Date();
    }
    pr.status          = 'rejected';
    pr.rejectionReason = req.body.reason || req.body.comments;
    await pr.save();
    return ok(res, pr, 'Requisition rejected');
  } catch (err) { return serverError(res, err); }
};

exports.cancelRequisition = async (req, res) => {
  try {
    const pr = await PurchaseRequisition.findOne({ _id: req.params.id, isDeleted: false });
    if (!pr) return notFound(res, 'Requisition not found');
    if (['converted', 'cancelled'].includes(pr.status)) return fail(res, 'Requisition already cancelled or converted');
    pr.status = 'cancelled';
    await pr.save();
    return ok(res, pr, 'Requisition cancelled');
  } catch (err) { return serverError(res, err); }
};

const PurchaseOrder       = require('../models/PurchaseOrder');
const PurchaseRequisition = require('../models/PurchaseRequisition');
const Vendor              = require('../models/Vendor');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');
const { generatePONumber, buildApprovalChain } = require('../utils/procurementHelpers');

exports.getPOs = async (req, res) => {
  try {
    const { status, vendor, search, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (vendor) filter.vendor = vendor;
    if (search) filter.$or = [
      { poNumber:   { $regex: search, $options: 'i' } },
      { vendorName: { $regex: search, $options: 'i' } },
    ];
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      PurchaseOrder.find(filter).populate('vendor', 'companyName vendorCode').populate('createdBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      PurchaseOrder.countDocuments(filter),
    ]);
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.createPO = async (req, res) => {
  try {
    const poNumber = await generatePONumber();
    const vendor   = await Vendor.findById(req.body.vendor);
    const po = await PurchaseOrder.create({
      ...req.body,
      poNumber,
      vendorName:  vendor?.companyName || req.body.vendorName,
      createdBy:   req.user._id,
      createdByName: req.user.name,
      approvalSteps: buildApprovalChain(),
    });
    // If linked to PR, mark it
    if (req.body.purchaseRequisition) {
      await PurchaseRequisition.findByIdAndUpdate(req.body.purchaseRequisition, { purchaseOrder: po._id, status: 'converted' });
    }
    return created(res, po, 'Purchase order created');
  } catch (err) { return serverError(res, err); }
};

exports.getPOById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, isDeleted: false })
      .populate('vendor', 'companyName vendorCode email phone paymentTerms')
      .populate('createdBy', 'name email')
      .populate('rfq', 'rfqNumber title')
      .populate('purchaseRequisition', 'prNumber title')
      .populate('deliveryWarehouse', 'name code address')
      .populate('items.product', 'name sku images')
      .populate('grn', 'grnNumber status');
    if (!po) return notFound(res, 'Purchase order not found');
    return ok(res, po);
  } catch (err) { return serverError(res, err); }
};

exports.updatePO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!po) return notFound(res, 'Purchase order not found');
    if (!['draft'].includes(po.status)) return fail(res, 'Only draft POs can be edited');
    Object.assign(po, req.body);
    await po.save();
    return ok(res, po, 'Purchase order updated');
  } catch (err) { return serverError(res, err); }
};

const _advanceApproval = async (po, userId, userName, comments) => {
  const step = po.approvalSteps.find(s => s.step === po.currentApprovalStep);
  if (step) {
    step.status      = 'approved';
    step.approver    = userId;
    step.approverName = userName;
    step.comments    = comments;
    step.actedAt     = new Date();
  }
  const nextStep = po.approvalSteps.find(s => s.step === po.currentApprovalStep + 1);
  if (nextStep) {
    po.currentApprovalStep += 1;
  } else {
    po.status     = 'approved';
    po.approvedBy = userId;
    po.approvedAt = new Date();
  }
};

exports.submitPO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!po) return notFound(res, 'Purchase order not found');
    if (po.status !== 'draft') return fail(res, 'Only draft POs can be submitted');
    po.status                = 'pending_approval';
    po.currentApprovalStep   = 1;
    await po.save();
    return ok(res, po, 'Purchase order submitted for approval');
  } catch (err) { return serverError(res, err); }
};

exports.approvePO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!po) return notFound(res, 'Purchase order not found');
    if (!['pending_approval'].includes(po.status)) return fail(res, 'PO is not pending approval');
    await _advanceApproval(po, req.user._id, req.user.name, req.body.comments);
    await po.save();
    return ok(res, po, 'Approval recorded');
  } catch (err) { return serverError(res, err); }
};

exports.rejectPO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!po) return notFound(res, 'Purchase order not found');
    if (!['pending_approval'].includes(po.status)) return fail(res, 'PO is not pending approval');

    const step = po.approvalSteps.find(s => s.step === po.currentApprovalStep);
    if (step) {
      step.status      = 'rejected';
      step.approver    = req.user._id;
      step.approverName = req.user.name;
      step.comments    = req.body.comments;
      step.actedAt     = new Date();
    }
    po.status       = 'draft';
    po.currentApprovalStep = 0;
    await po.save();
    return ok(res, po, 'PO rejected and returned to draft');
  } catch (err) { return serverError(res, err); }
};

exports.releasePO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!po) return notFound(res, 'Purchase order not found');
    if (po.status !== 'approved') return fail(res, 'Only approved POs can be released');
    po.status     = 'released';
    po.releasedAt = new Date();
    await po.save();
    // Update vendor spend
    await Vendor.findByIdAndUpdate(po.vendor, { $inc: { totalOrders: 1 } });
    return ok(res, po, 'Purchase order released');
  } catch (err) { return serverError(res, err); }
};

exports.sendPO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!po) return notFound(res, 'Purchase order not found');
    if (po.status !== 'released') return fail(res, 'Only released POs can be sent');
    po.status = 'sent';
    po.sentAt  = new Date();
    await po.save();
    return ok(res, po, 'Purchase order sent to supplier');
  } catch (err) { return serverError(res, err); }
};

exports.cancelPO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!po) return notFound(res, 'Purchase order not found');
    if (['completed', 'cancelled'].includes(po.status)) return fail(res, 'Cannot cancel PO in current status');
    po.status       = 'cancelled';
    po.cancelReason = req.body.reason;
    await po.save();
    return ok(res, po, 'Purchase order cancelled');
  } catch (err) { return serverError(res, err); }
};

exports.completePO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!po) return notFound(res, 'Purchase order not found');
    po.status = 'completed';
    po.actualDeliveryDate = new Date();
    if (req.body.grn) po.grn = req.body.grn;
    await po.save();
    // Update vendor metrics
    await Vendor.findByIdAndUpdate(po.vendor, { $inc: { totalSpend: po.totalAmount } });
    return ok(res, po, 'Purchase order completed');
  } catch (err) { return serverError(res, err); }
};

// Supplier-side actions (called from supplier portal via admin middleware)
exports.supplierAcknowledge = async (req, res) => {
  try {
    const vendorId = String(req.supplierUser?.vendor?._id || req.supplierUser?.vendor);
    const po = await PurchaseOrder.findOne({ _id: req.params.id, vendor: vendorId, isDeleted: false });
    if (!po) return notFound(res, 'Purchase order not found');
    if (po.status !== 'sent') return fail(res, 'PO must be in "sent" status to acknowledge');
    po.status          = 'acknowledged';
    po.acknowledgedAt  = new Date();
    await po.save();
    return ok(res, po, 'Purchase order acknowledged');
  } catch (err) { return serverError(res, err); }
};

exports.supplierAccept = async (req, res) => {
  try {
    const vendorId = String(req.supplierUser?.vendor?._id || req.supplierUser?.vendor);
    const po = await PurchaseOrder.findOne({ _id: req.params.id, vendor: vendorId, isDeleted: false });
    if (!po) return notFound(res, 'Purchase order not found');
    if (!['sent', 'acknowledged'].includes(po.status)) return fail(res, 'Cannot accept PO in current status');
    po.status        = 'supplier_accepted';
    po.supplierNotes = req.body.notes;
    await po.save();
    return ok(res, po, 'Purchase order accepted');
  } catch (err) { return serverError(res, err); }
};

exports.supplierReject = async (req, res) => {
  try {
    const vendorId = String(req.supplierUser?.vendor?._id || req.supplierUser?.vendor);
    const po = await PurchaseOrder.findOne({ _id: req.params.id, vendor: vendorId, isDeleted: false });
    if (!po) return notFound(res, 'Purchase order not found');
    if (!['sent', 'acknowledged'].includes(po.status)) return fail(res, 'Cannot reject PO in current status');
    po.status        = 'supplier_rejected';
    po.supplierNotes = req.body.reason;
    await po.save();
    return ok(res, po, 'Purchase order rejected by supplier');
  } catch (err) { return serverError(res, err); }
};

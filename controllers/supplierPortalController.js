const PurchaseOrder = require('../models/PurchaseOrder');
const RFQ           = require('../models/RFQ');
const SupplierUser  = require('../models/SupplierUser');
const Vendor        = require('../models/Vendor');
const { ok, paginated, notFound, fail, serverError } = require('../utils/response');

const _vendorId = (req) => String(req.supplierUser.vendor?._id || req.supplierUser.vendor);

exports.getDashboard = async (req, res) => {
  try {
    const vendorId = _vendorId(req);
    const [openPOs, pendingPOs, openRFQs, recentPOs] = await Promise.all([
      PurchaseOrder.countDocuments({ vendor: vendorId, status: { $in: ['sent', 'acknowledged', 'supplier_accepted', 'partially_delivered'] }, isDeleted: false }),
      PurchaseOrder.countDocuments({ vendor: vendorId, status: 'sent', isDeleted: false }),
      RFQ.countDocuments({ 'vendors.vendor': vendorId, status: 'published', isDeleted: false }),
      PurchaseOrder.find({ vendor: vendorId, isDeleted: false }).sort({ createdAt: -1 }).limit(5)
        .select('poNumber status totalAmount expectedDeliveryDate createdAt'),
    ]);
    return ok(res, { openPOs, pendingPOs, openRFQs, recentPOs });
  } catch (err) { return serverError(res, err); }
};

exports.getMyOrders = async (req, res) => {
  try {
    const vendorId = _vendorId(req);
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { vendor: vendorId, isDeleted: false };
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      PurchaseOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .select('-approvalSteps'),
      PurchaseOrder.countDocuments(filter),
    ]);
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const vendorId = _vendorId(req);
    const po = await PurchaseOrder.findOne({ _id: req.params.id, vendor: vendorId, isDeleted: false })
      .populate('deliveryWarehouse', 'name address')
      .populate('items.product', 'name sku');
    if (!po) return notFound(res, 'Purchase order not found');
    return ok(res, po);
  } catch (err) { return serverError(res, err); }
};

exports.acknowledgeOrder = async (req, res) => {
  try {
    const vendorId = _vendorId(req);
    const po = await PurchaseOrder.findOne({ _id: req.params.id, vendor: vendorId, status: 'sent', isDeleted: false });
    if (!po) return notFound(res, 'PO not found or not in sent status');
    po.status         = 'acknowledged';
    po.acknowledgedAt = new Date();
    await po.save();
    return ok(res, po, 'Purchase order acknowledged');
  } catch (err) { return serverError(res, err); }
};

exports.acceptOrder = async (req, res) => {
  try {
    const vendorId = _vendorId(req);
    const po = await PurchaseOrder.findOne({ _id: req.params.id, vendor: vendorId, status: { $in: ['sent', 'acknowledged'] }, isDeleted: false });
    if (!po) return notFound(res, 'PO not found or cannot be accepted');
    po.status        = 'supplier_accepted';
    po.supplierNotes = req.body.notes;
    await po.save();
    return ok(res, po, 'Purchase order accepted');
  } catch (err) { return serverError(res, err); }
};

exports.rejectOrder = async (req, res) => {
  try {
    const vendorId = _vendorId(req);
    const po = await PurchaseOrder.findOne({ _id: req.params.id, vendor: vendorId, status: { $in: ['sent', 'acknowledged'] }, isDeleted: false });
    if (!po) return notFound(res, 'PO not found or cannot be rejected');
    po.status        = 'supplier_rejected';
    po.supplierNotes = req.body.reason;
    await po.save();
    return ok(res, po, 'Purchase order rejected');
  } catch (err) { return serverError(res, err); }
};

exports.getMyRFQs = async (req, res) => {
  try {
    const vendorId = _vendorId(req);
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { 'vendors.vendor': vendorId, isDeleted: false };
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      RFQ.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .select('rfqNumber title status submissionDeadline deliveryDate items vendors.$'),
      RFQ.countDocuments(filter),
    ]);
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.getProfile = async (req, res) => {
  try {
    const user   = req.supplierUser;
    const vendor = await Vendor.findById(_vendorId(req))
      .select('-isDeleted -__v');
    return ok(res, { user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }, vendor });
  } catch (err) { return serverError(res, err); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await SupplierUser.findByIdAndUpdate(req.supplierUser._id, { name, phone }, { new: true });
    return ok(res, user, 'Profile updated');
  } catch (err) { return serverError(res, err); }
};

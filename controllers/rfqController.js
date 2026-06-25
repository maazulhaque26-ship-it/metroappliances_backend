const RFQ    = require('../models/RFQ');
const Vendor = require('../models/Vendor');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');
const { generateRFQNumber } = require('../utils/procurementHelpers');

exports.getRFQs = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (search) filter.$or = [
      { rfqNumber: { $regex: search, $options: 'i' } },
      { title:     { $regex: search, $options: 'i' } },
    ];
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      RFQ.find(filter).populate('createdBy', 'name').populate('selectedVendor', 'companyName vendorCode').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      RFQ.countDocuments(filter),
    ]);
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.createRFQ = async (req, res) => {
  try {
    const rfqNumber = await generateRFQNumber();
    const rfq = await RFQ.create({
      ...req.body,
      rfqNumber,
      createdBy: req.user._id,
      createdByName: req.user.name,
    });
    return created(res, rfq, 'RFQ created');
  } catch (err) { return serverError(res, err); }
};

exports.getRFQById = async (req, res) => {
  try {
    const rfq = await RFQ.findOne({ _id: req.params.id, isDeleted: false })
      .populate('createdBy', 'name email')
      .populate('purchaseRequisition', 'prNumber title')
      .populate('vendors.vendor', 'companyName vendorCode email phone')
      .populate('selectedVendor', 'companyName vendorCode')
      .populate('deliveryWarehouse', 'name code');
    if (!rfq) return notFound(res, 'RFQ not found');
    return ok(res, rfq);
  } catch (err) { return serverError(res, err); }
};

exports.updateRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findOne({ _id: req.params.id, isDeleted: false });
    if (!rfq) return notFound(res, 'RFQ not found');
    if (rfq.status !== 'draft') return fail(res, 'Only draft RFQs can be edited');
    Object.assign(rfq, req.body);
    await rfq.save();
    return ok(res, rfq, 'RFQ updated');
  } catch (err) { return serverError(res, err); }
};

exports.publishRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findOne({ _id: req.params.id, isDeleted: false });
    if (!rfq) return notFound(res, 'RFQ not found');
    if (rfq.status !== 'draft') return fail(res, 'Only draft RFQs can be published');
    if (!rfq.vendors?.length)   return fail(res, 'Add at least one vendor before publishing');
    rfq.status      = 'published';
    rfq.publishedAt = new Date();
    await rfq.save();
    return ok(res, rfq, 'RFQ published and vendors notified');
  } catch (err) { return serverError(res, err); }
};

exports.closeRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findOne({ _id: req.params.id, isDeleted: false });
    if (!rfq) return notFound(res, 'RFQ not found');
    if (rfq.status !== 'published') return fail(res, 'Only published RFQs can be closed');
    rfq.status   = 'closed';
    rfq.closedAt = new Date();
    await rfq.save();
    return ok(res, rfq, 'RFQ closed');
  } catch (err) { return serverError(res, err); }
};

exports.awardRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findOne({ _id: req.params.id, isDeleted: false });
    if (!rfq) return notFound(res, 'RFQ not found');
    if (!['closed', 'published'].includes(rfq.status)) return fail(res, 'RFQ must be closed or published to award');

    const vendorEntry = rfq.vendors.find(v => String(v.vendor) === req.params.vendorId);
    if (!vendorEntry) return notFound(res, 'Vendor not found in RFQ');

    rfq.selectedVendor = req.params.vendorId;
    rfq.status         = 'awarded';
    rfq.awardedAt      = new Date();
    vendorEntry.status = 'selected';
    rfq.vendors.filter(v => String(v.vendor) !== req.params.vendorId)
               .forEach(v => { if (v.status === 'responded') v.status = 'invited'; });
    await rfq.save();
    return ok(res, rfq, 'RFQ awarded');
  } catch (err) { return serverError(res, err); }
};

// Admin records a vendor's quotation response on their behalf
exports.recordQuotation = async (req, res) => {
  try {
    const rfq = await RFQ.findOne({ _id: req.params.id, isDeleted: false });
    if (!rfq) return notFound(res, 'RFQ not found');

    const vendorEntry = rfq.vendors.find(v => String(v.vendor) === req.params.vendorId);
    if (!vendorEntry) return fail(res, 'Vendor not in this RFQ');

    Object.assign(vendorEntry, req.body);
    vendorEntry.status      = 'responded';
    vendorEntry.respondedAt = new Date();
    await rfq.save();
    return ok(res, rfq, 'Quotation recorded');
  } catch (err) { return serverError(res, err); }
};

// Supplier portal: submit their own quotation
exports.supplierSubmitQuote = async (req, res) => {
  try {
    const rfq = await RFQ.findOne({ _id: req.params.id, isDeleted: false, status: 'published' });
    if (!rfq) return notFound(res, 'RFQ not found or not open');

    const vendorId    = String(req.supplierUser.vendor._id || req.supplierUser.vendor);
    const vendorEntry = rfq.vendors.find(v => String(v.vendor) === vendorId);
    if (!vendorEntry) return fail(res, 'Your vendor is not invited to this RFQ');

    Object.assign(vendorEntry, req.body);
    vendorEntry.status      = 'responded';
    vendorEntry.respondedAt = new Date();
    await rfq.save();
    return ok(res, rfq, 'Quotation submitted');
  } catch (err) { return serverError(res, err); }
};

exports.cancelRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, status: { $nin: ['awarded', 'cancelled'] } },
      { status: 'cancelled' },
      { new: true }
    );
    if (!rfq) return notFound(res, 'RFQ not found or cannot be cancelled');
    return ok(res, rfq, 'RFQ cancelled');
  } catch (err) { return serverError(res, err); }
};

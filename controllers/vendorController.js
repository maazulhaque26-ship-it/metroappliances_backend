const Vendor            = require('../models/Vendor');
const VendorContact     = require('../models/VendorContact');
const VendorBankAccount = require('../models/VendorBankAccount');
const VendorDocument    = require('../models/VendorDocument');
const VendorContract    = require('../models/VendorContract');
const VendorPerformance = require('../models/VendorPerformance');
const VendorCategory    = require('../models/VendorCategory');
const VendorAddress     = require('../models/VendorAddress');
const VendorRating      = require('../models/VendorRating');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');
const { generateVendorCode, generateContractNumber } = require('../utils/procurementHelpers');

// ── Vendor CRUD ────────────────────────────────────────────────────────────
exports.getVendors = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (search) filter.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { vendorCode:  { $regex: search, $options: 'i' } },
      { gstNumber:   { $regex: search, $options: 'i' } },
      { email:       { $regex: search, $options: 'i' } },
    ];
    const skip  = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Vendor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Vendor.countDocuments(filter),
    ]);
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.createVendor = async (req, res) => {
  try {
    const vendorCode = await generateVendorCode();
    const vendor     = await Vendor.create({ ...req.body, vendorCode });
    return created(res, vendor, 'Vendor created');
  } catch (err) { return serverError(res, err); }
};

exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ _id: req.params.id, isDeleted: false });
    if (!vendor) return notFound(res, 'Vendor not found');

    const [contacts, addresses, bankAccounts, documents, contracts, categories, ratings] = await Promise.all([
      VendorContact.find({ vendor: vendor._id, isDeleted: false }),
      VendorAddress.find({ vendor: vendor._id, isDeleted: false }),
      VendorBankAccount.find({ vendor: vendor._id, isDeleted: false }),
      VendorDocument.find({ vendor: vendor._id, isDeleted: false }),
      VendorContract.find({ vendor: vendor._id, isDeleted: false }).sort({ createdAt: -1 }),
      VendorCategory.find({ vendor: vendor._id, isDeleted: false }).populate('category', 'name'),
      VendorRating.find({ vendor: vendor._id, isDeleted: false }).sort({ createdAt: -1 }).limit(10),
    ]);

    return ok(res, { vendor, contacts, addresses, bankAccounts, documents, contracts, categories, ratings });
  } catch (err) { return serverError(res, err); }
};

exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!vendor) return notFound(res, 'Vendor not found');
    return ok(res, vendor, 'Vendor updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!vendor) return notFound(res, 'Vendor not found');
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

exports.approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status: 'active', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!vendor) return notFound(res, 'Vendor not found');
    return ok(res, vendor, 'Vendor approved');
  } catch (err) { return serverError(res, err); }
};

exports.blacklistVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status: 'blacklisted', blacklistedReason: req.body.reason },
      { new: true }
    );
    if (!vendor) return notFound(res, 'Vendor not found');
    return ok(res, vendor, 'Vendor blacklisted');
  } catch (err) { return serverError(res, err); }
};

// ── Vendor sub-resources ───────────────────────────────────────────────────
exports.addContact = async (req, res) => {
  try {
    const contact = await VendorContact.create({ ...req.body, vendor: req.params.id });
    return created(res, contact, 'Contact added');
  } catch (err) { return serverError(res, err); }
};

exports.addAddress = async (req, res) => {
  try {
    const address = await VendorAddress.create({ ...req.body, vendor: req.params.id });
    return created(res, address, 'Address added');
  } catch (err) { return serverError(res, err); }
};

exports.addBankAccount = async (req, res) => {
  try {
    const account = await VendorBankAccount.create({ ...req.body, vendor: req.params.id });
    return created(res, account, 'Bank account added');
  } catch (err) { return serverError(res, err); }
};

exports.addDocument = async (req, res) => {
  try {
    const doc = await VendorDocument.create({ ...req.body, vendor: req.params.id });
    return created(res, doc, 'Document added');
  } catch (err) { return serverError(res, err); }
};

exports.verifyDocument = async (req, res) => {
  try {
    const doc = await VendorDocument.findOneAndUpdate(
      { _id: req.params.docId, vendor: req.params.id },
      { status: req.body.status, verifiedBy: req.user._id, verifiedAt: new Date(), rejectionReason: req.body.rejectionReason },
      { new: true }
    );
    if (!doc) return notFound(res, 'Document not found');
    return ok(res, doc, 'Document status updated');
  } catch (err) { return serverError(res, err); }
};

exports.addContract = async (req, res) => {
  try {
    const contractNumber = await generateContractNumber();
    const contract = await VendorContract.create({ ...req.body, vendor: req.params.id, contractNumber });
    return created(res, contract, 'Contract added');
  } catch (err) { return serverError(res, err); }
};

exports.addRating = async (req, res) => {
  try {
    const rating = await VendorRating.create({
      ...req.body,
      vendor: req.params.id,
      ratedBy: req.user._id,
      ratedByName: req.user.name,
    });
    // Recalculate vendor's overall rating
    const avgResult = await VendorRating.aggregate([
      { $match: { vendor: rating.vendor, isDeleted: false } },
      { $group: { _id: null, avg: { $avg: '$overallRating' } } },
    ]);
    if (avgResult.length) {
      await Vendor.findByIdAndUpdate(req.params.id, { overallRating: Math.round(avgResult[0].avg * 10) / 10 });
    }
    return created(res, rating, 'Rating added');
  } catch (err) { return serverError(res, err); }
};

// ── Vendor Performance ────────────────────────────────────────────────────
exports.getVendorPerformance = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const records = await VendorPerformance.find({ vendor: req.params.id, isDeleted: false })
      .sort({ period: -1 })
      .limit(Number(months));
    const vendor = await Vendor.findById(req.params.id).select('companyName vendorCode overallRating onTimeDeliveryRate qualityScore totalOrders totalSpend');
    return ok(res, { vendor, records });
  } catch (err) { return serverError(res, err); }
};

exports.addCategory = async (req, res) => {
  try {
    const cat = await VendorCategory.create({ ...req.body, vendor: req.params.id });
    return created(res, cat, 'Category added');
  } catch (err) { return serverError(res, err); }
};

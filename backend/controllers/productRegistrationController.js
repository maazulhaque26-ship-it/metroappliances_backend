'use strict';
const ProductRegistration = require('../models/ProductRegistration');
const WarrantyCard        = require('../models/WarrantyCard');
const Notification        = require('../models/Notification');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

async function notifyCustomer(userId, title, message, link = '') {
  try { await Notification.create({ user: userId, type: 'system', title, message, link }); } catch (_) {}
}

// Customer — register a product
exports.registerProduct = async (req, res) => {
  try {
    const serial = req.body.serialNumber?.toUpperCase();
    const existing = await ProductRegistration.findOne({ serialNumber: serial, isDeleted: false });
    if (existing) return fail(res, 'This serial number is already registered', 409);

    const reg = await ProductRegistration.create({ ...req.body, serialNumber: serial, customer: req.user._id, status: 'pending' });
    notifyCustomer(
      req.user._id,
      `Product Registered: ${reg.registrationNumber}`,
      `Your ${reg.productName} (${reg.serialNumber}) has been submitted for registration. Our team will verify shortly.`,
      `/my-products/${reg._id}`
    );
    return created(res, reg);
  } catch (err) {
    if (err.code === 11000) return fail(res, 'This serial number is already registered', 409);
    return serverError(res, err);
  }
};

// Customer — my registrations
exports.getMyRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { customer: req.user._id, isDeleted: false };
    if (status) filter.status = status;

    const total = await ProductRegistration.countDocuments(filter);
    const registrations = await ProductRegistration.find(filter)
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return paginated(res, registrations, total, Number(page), Number(limit));
  } catch (err) {
    return serverError(res, err);
  }
};

// Customer — single registration
exports.getMyRegistration = async (req, res) => {
  try {
    const reg = await ProductRegistration.findOne({ _id: req.params.id, customer: req.user._id, isDeleted: false })
      .populate('product', 'name images')
      .populate('warranty.warrantyId');
    if (!reg) return notFound(res, 'Registration');
    return ok(res, reg);
  } catch (err) {
    return serverError(res, err);
  }
};

// Admin — list all registrations
exports.getAllRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (search) filter.$or = [
      { registrationNumber: { $regex: search, $options: 'i' } },
      { serialNumber:       { $regex: search, $options: 'i' } },
      { productName:        { $regex: search, $options: 'i' } },
    ];

    const total = await ProductRegistration.countDocuments(filter);
    const registrations = await ProductRegistration.find(filter)
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return paginated(res, registrations, total, Number(page), Number(limit));
  } catch (err) {
    return serverError(res, err);
  }
};

// Admin — single
exports.getRegistration = async (req, res) => {
  try {
    const reg = await ProductRegistration.findOne({ _id: req.params.id, isDeleted: false })
      .populate('customer', 'name email phone')
      .populate('product', 'name images')
      .populate('warranty.warrantyId');
    if (!reg) return notFound(res, 'Registration');
    return ok(res, reg);
  } catch (err) {
    return serverError(res, err);
  }
};

// Admin — verify
exports.verifyRegistration = async (req, res) => {
  try {
    const reg = await ProductRegistration.findOne({ _id: req.params.id, isDeleted: false });
    if (!reg) return notFound(res, 'Registration');
    reg.status     = 'verified';
    reg.verifiedBy = req.user._id;
    reg.verifiedAt = new Date();
    if (req.body.notes) reg.notes = req.body.notes;
    await reg.save();
    notifyCustomer(reg.customer, `Registration Verified: ${reg.registrationNumber}`, `Your ${reg.productName} registration has been verified.`, `/my-products/${reg._id}`);
    return ok(res, reg);
  } catch (err) {
    return serverError(res, err);
  }
};

// Admin — invalidate
exports.invalidateRegistration = async (req, res) => {
  try {
    const reg = await ProductRegistration.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status: 'invalid', notes: req.body.reason || 'Invalid registration' },
      { new: true }
    );
    if (!reg) return notFound(res, 'Registration');
    notifyCustomer(reg.customer, `Registration Issue: ${reg.registrationNumber}`, `There was an issue with your product registration. Please contact support.`, `/my-products/${reg._id}`);
    return ok(res, reg);
  } catch (err) {
    return serverError(res, err);
  }
};

// Admin — activate warranty from registration
exports.activateWarrantyForRegistration = async (req, res) => {
  try {
    const reg = await ProductRegistration.findOne({ _id: req.params.id, isDeleted: false });
    if (!reg) return notFound(res, 'Registration');
    if (reg.status === 'warranty_activated') return fail(res, 'Warranty already activated', 400);

    const { duration = 12, warrantyType = 'manufacturer' } = req.body;
    const startDate = reg.purchaseDate || new Date();
    const endDate   = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + duration);

    const warranty = await WarrantyCard.create({
      serialNumber: reg.serialNumber,
      product:      reg.product,
      productName:  reg.productName,
      customer:     reg.customer,
      warrantyType,
      startDate,
      endDate,
      status: 'active',
    });

    reg.status  = 'warranty_activated';
    reg.warranty = { activatedAt: new Date(), warrantyId: warranty._id, duration };
    reg.verifiedBy = reg.verifiedBy || req.user._id;
    reg.verifiedAt = reg.verifiedAt || new Date();
    await reg.save();

    notifyCustomer(
      reg.customer,
      `Warranty Activated: ${reg.productName}`,
      `Your ${duration}-month warranty for ${reg.productName} (${reg.serialNumber}) is now active until ${endDate.toDateString()}.`,
      `/my-service/warranty`
    );
    return ok(res, { registration: reg, warranty });
  } catch (err) {
    return serverError(res, err);
  }
};

// Admin — transfer ownership
exports.transferOwnership = async (req, res) => {
  try {
    const reg = await ProductRegistration.findOne({ _id: req.params.id, isDeleted: false });
    if (!reg) return notFound(res, 'Registration');
    const { toCustomer, note } = req.body;
    reg.transferHistory.push({ fromCustomer: reg.customer, toCustomer, transferredAt: new Date(), note });
    reg.customer = toCustomer;
    reg.status   = 'transferred';
    await reg.save();
    return ok(res, reg);
  } catch (err) {
    return serverError(res, err);
  }
};

// Admin — stats
exports.getRegistrationStats = async (req, res) => {
  try {
    const [total, pending, verified, warrantyActivated, invalid] = await Promise.all([
      ProductRegistration.countDocuments({ isDeleted: false }),
      ProductRegistration.countDocuments({ isDeleted: false, status: 'pending' }),
      ProductRegistration.countDocuments({ isDeleted: false, status: 'verified' }),
      ProductRegistration.countDocuments({ isDeleted: false, status: 'warranty_activated' }),
      ProductRegistration.countDocuments({ isDeleted: false, status: 'invalid' }),
    ]);
    return ok(res, { total, pending, verified, warrantyActivated, invalid });
  } catch (err) {
    return serverError(res, err);
  }
};

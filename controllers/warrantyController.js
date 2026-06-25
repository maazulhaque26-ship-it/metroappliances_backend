const WarrantyCard  = require('../models/WarrantyCard');
const AMCContract   = require('../models/AMCContract');
const SerialNumber  = require('../models/SerialNumber');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

// ── Admin: create warranty card ───────────────────────────────────────────────
exports.createWarranty = async (req, res) => {
  try {
    const {
      serialNumber, productId, customerId, warrantyType,
      startDate, endDate, invoiceNumber, purchaseDate,
      purchaseAmount, dealerName, inclusions, exclusions, maxClaims,
    } = req.body;

    const warranty = await WarrantyCard.create({
      serialNumber, product: productId, customer: customerId,
      warrantyType, startDate, endDate,
      invoiceNumber, purchaseDate, purchaseAmount, dealerName,
      inclusions: inclusions || [], exclusions: exclusions || [],
      maxClaims: maxClaims || 0,
      status: 'pending_activation',
    });

    return created(res, { warranty });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: activate warranty ──────────────────────────────────────────────────
exports.activateWarranty = async (req, res) => {
  try {
    const warranty = await WarrantyCard.findOne({ _id: req.params.id, isDeleted: false });
    if (!warranty) return notFound(res, 'Warranty card');
    if (warranty.status !== 'pending_activation') {
      return fail(res, `Cannot activate: current status is ${warranty.status}`, 400);
    }
    warranty.status = 'active';
    warranty.activatedAt = new Date();
    warranty.activatedBy = req.user._id;
    await warranty.save();
    return ok(res, { warranty });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: list warranties ────────────────────────────────────────────────────
exports.getWarranties = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, warrantyType, search } = req.query;
    const q = { isDeleted: false };
    if (status) q.status = status;
    if (warrantyType) q.warrantyType = warrantyType;
    if (search) {
      q.$or = [
        { serialNumber: { $regex: search, $options: 'i' } },
        { warrantyNumber: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await WarrantyCard.countDocuments(q);
    const items = await WarrantyCard.find(q)
      .populate('product', 'name')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, items, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin / Customer: get single warranty ─────────────────────────────────────
exports.getWarranty = async (req, res) => {
  try {
    const warranty = await WarrantyCard.findOne({ _id: req.params.id, isDeleted: false })
      .populate('product', 'name images sku')
      .populate('customer', 'name email phone');
    if (!warranty) return notFound(res, 'Warranty card');
    return ok(res, { warranty });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Customer: check warranty by serial number ─────────────────────────────────
exports.checkWarrantyBySerial = async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const warranties = await WarrantyCard.find({ serialNumber, isDeleted: false })
      .populate('product', 'name images')
      .sort({ endDate: -1 });

    const now = new Date();
    const active = warranties.find(w => w.status === 'active' && w.endDate >= now);

    return ok(res, {
      serialNumber,
      hasActiveWarranty: !!active,
      activeWarranty: active || null,
      allWarranties: warranties,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: transfer warranty ──────────────────────────────────────────────────
exports.transferWarranty = async (req, res) => {
  try {
    const { toCustomerId, note } = req.body;
    const warranty = await WarrantyCard.findOne({ _id: req.params.id, isDeleted: false });
    if (!warranty) return notFound(res, 'Warranty card');
    if (warranty.status !== 'active') return fail(res, 'Only active warranties can be transferred', 400);

    warranty.transferHistory.push({
      fromCustomer: warranty.customer,
      toCustomer: toCustomerId,
      transferredAt: new Date(),
      note,
    });
    warranty.customer = toCustomerId;
    warranty.status = 'transferred';
    await warranty.save();
    return ok(res, { warranty });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: void warranty ──────────────────────────────────────────────────────
exports.voidWarranty = async (req, res) => {
  try {
    const warranty = await WarrantyCard.findOne({ _id: req.params.id, isDeleted: false });
    if (!warranty) return notFound(res, 'Warranty card');
    warranty.status = 'void';
    await warranty.save();
    return ok(res, { warranty });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: warranty stats ─────────────────────────────────────────────────────
exports.getWarrantyStats = async (req, res) => {
  try {
    const total     = await WarrantyCard.countDocuments({ isDeleted: false });
    const active    = await WarrantyCard.countDocuments({ isDeleted: false, status: 'active' });
    const expired   = await WarrantyCard.countDocuments({ isDeleted: false, status: 'expired' });
    const expiringIn30 = await WarrantyCard.countDocuments({
      isDeleted: false, status: 'active',
      endDate: { $lte: new Date(Date.now() + 30 * 86400000), $gte: new Date() },
    });
    return ok(res, { total, active, expired, expiringIn30 });
  } catch (err) {
    return serverError(res, err);
  }
};

// ──────────── AMC CONTRACT ────────────────────────────────────────────────────

exports.createAMC = async (req, res) => {
  try {
    const {
      customerId, productId, productName, serialNumber,
      startDate, endDate, durationMonths, amount,
      totalVisits, inclusions, exclusions,
    } = req.body;

    const amc = await AMCContract.create({
      customer: customerId, product: productId, productName, serialNumber,
      startDate, endDate, durationMonths, amount,
      totalVisits: totalVisits || 2,
      inclusions: inclusions || [], exclusions: exclusions || [],
    });
    return created(res, { amc });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getAMCContracts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const q = { isDeleted: false };
    if (status) q.status = status;
    if (search) {
      q.$or = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await AMCContract.countDocuments(q);
    const items = await AMCContract.find(q)
      .populate('customer', 'name email phone')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, items, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getAMCContract = async (req, res) => {
  try {
    const amc = await AMCContract.findOne({ _id: req.params.id, isDeleted: false })
      .populate('customer', 'name email phone')
      .populate('product', 'name images')
      .populate('visits.technicianId', 'name phone');
    if (!amc) return notFound(res, 'AMC contract');
    return ok(res, { amc });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.activateAMC = async (req, res) => {
  try {
    const amc = await AMCContract.findOne({ _id: req.params.id, isDeleted: false });
    if (!amc) return notFound(res, 'AMC contract');
    amc.status = 'active';
    amc.activatedAt = new Date();
    await amc.save();
    return ok(res, { amc });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.scheduleAMCVisit = async (req, res) => {
  try {
    const { scheduledAt, technicianId, notes } = req.body;
    const amc = await AMCContract.findOne({ _id: req.params.id, isDeleted: false });
    if (!amc) return notFound(res, 'AMC contract');
    amc.visits.push({ scheduledAt, technicianId, notes, status: 'scheduled' });
    await amc.save();
    return ok(res, { amc });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getAMCStats = async (req, res) => {
  try {
    const total  = await AMCContract.countDocuments({ isDeleted: false });
    const active = await AMCContract.countDocuments({ isDeleted: false, status: 'active' });
    const expired= await AMCContract.countDocuments({ isDeleted: false, status: 'expired' });
    const renewalDue = await AMCContract.countDocuments({
      isDeleted: false, status: 'active',
      endDate: { $lte: new Date(Date.now() + 30 * 86400000), $gte: new Date() },
    });
    return ok(res, { total, active, expired, renewalDue });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Customer: get own warranty / AMC status ───────────────────────────────────
exports.getMyWarranties = async (req, res) => {
  try {
    const warranties = await WarrantyCard.find({ customer: req.user._id, isDeleted: false })
      .populate('product', 'name images')
      .sort({ endDate: -1 });
    return ok(res, { warranties });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getMyAMCContracts = async (req, res) => {
  try {
    const amcs = await AMCContract.find({ customer: req.user._id, isDeleted: false })
      .populate('product', 'name images')
      .sort({ endDate: -1 });
    return ok(res, { amcs });
  } catch (err) {
    return serverError(res, err);
  }
};

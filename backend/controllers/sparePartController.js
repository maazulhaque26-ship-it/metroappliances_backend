const SparePart      = require('../models/SparePart');
const ServiceRequest = require('../models/ServiceRequest');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

exports.createSparePart = async (req, res) => {
  try {
    const part = await SparePart.create(req.body);
    return created(res, { part });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getSpareParts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, lowStock } = req.query;
    const q = { isDeleted: false, isActive: true };
    if (category) q.category = category;
    if (lowStock === 'true') q.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    if (search) {
      q.$or = [
        { partNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await SparePart.countDocuments(q);
    const items = await SparePart.find(q)
      .populate('compatibleProducts', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, items, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getSparePart = async (req, res) => {
  try {
    const part = await SparePart.findOne({ _id: req.params.id, isDeleted: false })
      .populate('compatibleProducts', 'name sku images');
    if (!part) return notFound(res, 'Spare part');
    return ok(res, { part });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateSparePart = async (req, res) => {
  try {
    const part = await SparePart.findOne({ _id: req.params.id, isDeleted: false });
    if (!part) return notFound(res, 'Spare part');
    const { consumptionLogs, ...updates } = req.body;
    Object.assign(part, updates);
    await part.save();
    return ok(res, { part });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteSparePart = async (req, res) => {
  try {
    const part = await SparePart.findOne({ _id: req.params.id, isDeleted: false });
    if (!part) return notFound(res, 'Spare part');
    part.isDeleted = true;
    part.isActive = false;
    await part.save();
    return ok(res, { message: 'Spare part deleted' });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const { adjustment, note } = req.body;
    const part = await SparePart.findOne({ _id: req.params.id, isDeleted: false });
    if (!part) return notFound(res, 'Spare part');
    part.quantity = Math.max(0, part.quantity + adjustment);
    await part.save();
    return ok(res, { part, newQuantity: part.quantity });
  } catch (err) {
    return serverError(res, err);
  }
};

// Technician consumes parts during a job
exports.consumePart = async (req, res) => {
  try {
    const { serviceRequestId, quantity } = req.body;
    const part = await SparePart.findOne({ _id: req.params.id, isDeleted: false });
    if (!part) return notFound(res, 'Spare part');
    if (part.quantity < quantity) return fail(res, `Insufficient stock. Available: ${part.quantity}`, 400);

    part.quantity -= quantity;
    part.consumptionLogs.push({
      serviceRequestId,
      technicianId: req.technician?._id || null,
      quantity,
      usedAt: new Date(),
    });
    await part.save();

    // Update partsUsed on the service request
    if (serviceRequestId) {
      const sr = await ServiceRequest.findById(serviceRequestId);
      if (sr) {
        const existing = sr.partsUsed.find(p => p.sparePartId?.toString() === part._id.toString());
        if (existing) {
          existing.quantity += quantity;
        } else {
          sr.partsUsed.push({
            sparePartId: part._id,
            partNumber: part.partNumber,
            name: part.name,
            quantity,
            unitPrice: part.unitPrice,
          });
        }
        await sr.save();
      }
    }

    return ok(res, { part, remainingStock: part.quantity });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getSparePartStats = async (req, res) => {
  try {
    const total    = await SparePart.countDocuments({ isDeleted: false, isActive: true });
    const lowStock = await SparePart.countDocuments({
      isDeleted: false, isActive: true,
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
    });
    const outOfStock = await SparePart.countDocuments({ isDeleted: false, isActive: true, quantity: 0 });
    return ok(res, { total, lowStock, outOfStock });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await SparePart.distinct('category', { isDeleted: false, isActive: true });
    return ok(res, { categories });
  } catch (err) {
    return serverError(res, err);
  }
};

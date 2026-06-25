'use strict';
const FlashSale = require('../models/FlashSale');
const Product   = require('../models/Product');

const PRODUCT_FIELDS = 'name slug images price discountPrice stock isActive';

// Public — returns currently active/live sale with populated products
exports.getActiveSale = async (req, res, next) => {
  try {
    const now = new Date();
    const sale = await FlashSale.findOne({
      isActive: true,
      startDate: { $lte: now },
      endDate:   { $gte: now },
    })
      .sort({ displayOrder: 1, startDate: 1 })
      .populate('products.product', PRODUCT_FIELDS)
      .lean();
    res.json({ success: true, flashSale: sale || null });
  } catch (err) { next(err); }
};

// Admin CRUD
exports.getAll = async (req, res, next) => {
  try {
    const items = await FlashSale.find()
      .sort({ startDate: -1 })
      .populate('products.product', 'name images price')
      .lean();
    res.json({ success: true, flashSales: items });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const item = await FlashSale.findById(req.params.id)
      .populate('products.product', PRODUCT_FIELDS)
      .lean();
    if (!item) return res.status(404).json({ success: false, message: 'Flash sale not found' });
    res.json({ success: true, flashSale: item });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const item = await FlashSale.create(req.body);
    res.status(201).json({ success: true, flashSale: item });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await FlashSale.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Flash sale not found' });
    res.json({ success: true, flashSale: item });
  } catch (err) { next(err); }
};

exports.toggle = async (req, res, next) => {
  try {
    const item = await FlashSale.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Flash sale not found' });
    item.isActive = !item.isActive;
    await item.save();
    res.json({ success: true, flashSale: item });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await FlashSale.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Flash sale deleted' });
  } catch (err) { next(err); }
};

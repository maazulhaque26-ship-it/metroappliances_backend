'use strict';
const PromotionalSection = require('../models/PromotionalSection');

const PRODUCT_FIELDS = 'name slug images price discountPrice stock isActive categories';

// Public — returns active sections with their products
exports.getActiveSections = async (req, res, next) => {
  try {
    const sections = await PromotionalSection.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .populate('products', PRODUCT_FIELDS)
      .lean();
    res.json({ success: true, sections });
  } catch (err) { next(err); }
};

// Admin CRUD
exports.getAll = async (req, res, next) => {
  try {
    const sections = await PromotionalSection.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .populate('products', 'name images price')
      .lean();
    res.json({ success: true, sections });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const section = await PromotionalSection.create(req.body);
    res.status(201).json({ success: true, section });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const section = await PromotionalSection.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    res.json({ success: true, section });
  } catch (err) { next(err); }
};

exports.toggle = async (req, res, next) => {
  try {
    const section = await PromotionalSection.findById(req.params.id);
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    section.isActive = !section.isActive;
    await section.save();
    res.json({ success: true, section });
  } catch (err) { next(err); }
};

exports.reorder = async (req, res, next) => {
  try {
    const { order } = req.body; // [{ id, displayOrder }]
    if (!Array.isArray(order)) return res.status(400).json({ success: false, message: 'order must be an array' });
    await Promise.all(order.map(({ id, displayOrder }) =>
      PromotionalSection.findByIdAndUpdate(id, { displayOrder })
    ));
    res.json({ success: true, message: 'Reordered' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await PromotionalSection.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Section deleted' });
  } catch (err) { next(err); }
};

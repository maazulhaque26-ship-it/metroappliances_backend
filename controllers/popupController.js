'use strict';
const MarketingPopup = require('../models/MarketingPopup');
const { cloudinary, cloudinaryPublicId } = require('../config/cloudinary');

// Public — returns active, in-schedule popups
exports.getLivePopups = async (req, res, next) => {
  try {
    const now = new Date();
    const items = await MarketingPopup.find({
      isActive: true,
      $or: [{ startDate: null }, { startDate: { $lte: now } }],
      $or: [{ endDate: null },   { endDate:   { $gte: now } }],
    }).sort({ priority: -1 }).lean();
    res.json({ success: true, popups: items });
  } catch (err) { next(err); }
};

// Admin CRUD
exports.getAll = async (req, res, next) => {
  try {
    const items = await MarketingPopup.find().sort({ priority: -1, createdAt: -1 }).lean();
    res.json({ success: true, popups: items });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) body.image = req.file.path;
    const item = await MarketingPopup.create(body);
    res.status(201).json({ success: true, popup: item });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) body.image = req.file.path;
    const item = await MarketingPopup.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Popup not found' });
    res.json({ success: true, popup: item });
  } catch (err) { next(err); }
};

exports.toggle = async (req, res, next) => {
  try {
    const item = await MarketingPopup.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Popup not found' });
    item.isActive = !item.isActive;
    await item.save();
    res.json({ success: true, popup: item });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await MarketingPopup.findByIdAndDelete(req.params.id);
    if (item?.image) {
      const pid = cloudinaryPublicId(item.image);
      if (pid) await cloudinary.uploader.destroy(pid).catch(() => {});
    }
    res.json({ success: true, message: 'Popup deleted' });
  } catch (err) { next(err); }
};

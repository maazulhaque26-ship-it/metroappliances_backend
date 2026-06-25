'use strict';
const Campaign  = require('../models/Campaign');
const { cloudinary, cloudinaryPublicId } = require('../config/cloudinary');

const PRODUCT_FIELDS = 'name slug images price discountPrice';

// Public — returns active, in-schedule campaigns for a given page
exports.getActiveCampaigns = async (req, res, next) => {
  try {
    const page = req.query.page || 'home';
    const now  = new Date();
    const items = await Campaign.find({
      isActive: true,
      targetPages: page,
      $or: [{ startDate: null }, { startDate: { $lte: now } }],
      $or: [{ endDate: null },   { endDate:   { $gte: now } }],
    })
      .sort({ priority: -1 })
      .populate('products', PRODUCT_FIELDS)
      .lean();
    res.json({ success: true, campaigns: items });
  } catch (err) { next(err); }
};

// Admin CRUD
exports.getAll = async (req, res, next) => {
  try {
    const items = await Campaign.find()
      .sort({ priority: -1, createdAt: -1 })
      .populate('products', 'name images price')
      .lean();
    res.json({ success: true, campaigns: items });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) body.banner = req.file.path;
    if (body.products && typeof body.products === 'string') {
      try { body.products = JSON.parse(body.products); } catch { body.products = []; }
    }
    if (body.targetPages && typeof body.targetPages === 'string') {
      try { body.targetPages = JSON.parse(body.targetPages); } catch { body.targetPages = ['home']; }
    }
    const item = await Campaign.create(body);
    res.status(201).json({ success: true, campaign: item });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) body.banner = req.file.path;
    if (body.products && typeof body.products === 'string') {
      try { body.products = JSON.parse(body.products); } catch { body.products = []; }
    }
    if (body.targetPages && typeof body.targetPages === 'string') {
      try { body.targetPages = JSON.parse(body.targetPages); } catch {}
    }
    const item = await Campaign.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, campaign: item });
  } catch (err) { next(err); }
};

exports.toggle = async (req, res, next) => {
  try {
    const item = await Campaign.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Campaign not found' });
    item.isActive = !item.isActive;
    await item.save();
    res.json({ success: true, campaign: item });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Campaign.findByIdAndDelete(req.params.id);
    if (item?.banner) {
      const pid = cloudinaryPublicId(item.banner);
      if (pid) await cloudinary.uploader.destroy(pid).catch(() => {});
    }
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (err) { next(err); }
};

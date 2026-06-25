'use strict';
const AnnouncementBar = require('../models/AnnouncementBar');

// Public — returns only live, scheduled announcements sorted by priority
exports.getLiveAnnouncements = async (req, res, next) => {
  try {
    const now = new Date();
    const items = await AnnouncementBar.find({
      isActive: true,
      $or: [{ startDate: null }, { startDate: { $lte: now } }],
      $or: [{ endDate: null },   { endDate:   { $gte: now } }],
    }).sort({ priority: -1, createdAt: -1 }).lean();
    res.json({ success: true, announcements: items });
  } catch (err) { next(err); }
};

// Admin CRUD
exports.getAll = async (req, res, next) => {
  try {
    const items = await AnnouncementBar.find().sort({ priority: -1, createdAt: -1 }).lean();
    res.json({ success: true, announcements: items });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const item = await AnnouncementBar.create(req.body);
    res.status(201).json({ success: true, announcement: item });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await AnnouncementBar.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, announcement: item });
  } catch (err) { next(err); }
};

exports.toggle = async (req, res, next) => {
  try {
    const item = await AnnouncementBar.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Announcement not found' });
    item.isActive = !item.isActive;
    await item.save();
    res.json({ success: true, announcement: item });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await AnnouncementBar.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) { next(err); }
};

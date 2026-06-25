'use strict';
const Notification = require('../models/Notification');

const PAGE_SIZE = 20;

// User — get their notifications (own + broadcast)
exports.getMyNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const query = {
      $or: [
        { user: req.user.id },
        { isBroadcast: true },
      ],
    };
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, isRead: false }),
    ]);
    res.json({ success: true, notifications, total, page, pages: Math.ceil(total / PAGE_SIZE), unreadCount });
  } catch (err) { next(err); }
};

// User — mark one read
exports.markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, $or: [{ user: req.user.id }, { isBroadcast: true }] },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

// User — mark all read
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { $or: [{ user: req.user.id }, { isBroadcast: true }], isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

// Admin — broadcast notification to all users
exports.broadcast = async (req, res, next) => {
  try {
    const { type = 'admin', title, message, link = '' } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'title and message required' });
    const notif = await Notification.create({ user: null, type, title, message, link, isBroadcast: true });
    // Emit via socket if available
    try { req.app.locals.io?.emit('notification:broadcast', { notification: notif }); } catch (_) {}
    res.status(201).json({ success: true, notification: notif });
  } catch (err) { next(err); }
};

// Admin — get all notifications
exports.getAll = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const total = await Notification.countDocuments();
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();
    res.json({ success: true, notifications, total, page, pages: Math.ceil(total / PAGE_SIZE) });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) { next(err); }
};

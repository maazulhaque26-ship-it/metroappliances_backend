'use strict';
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type:    { type: String, enum: ['order', 'offer', 'coupon', 'wishlist', 'price_drop', 'back_in_stock', 'admin', 'system'], default: 'system' },
  title:   { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  link:    { type: String, default: '' },
  isRead:  { type: Boolean, default: false },
  isBroadcast: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ isBroadcast: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

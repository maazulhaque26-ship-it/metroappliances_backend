'use strict';
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  icon:        { type: String, default: '📢', trim: true },
  bgColor:     { type: String, default: '#111111', trim: true },
  textColor:   { type: String, default: '#ffffff', trim: true },
  ctaText:     { type: String, default: '', trim: true },
  ctaLink:     { type: String, default: '', trim: true },
  startDate:   { type: Date, default: null },
  endDate:     { type: Date, default: null },
  priority:    { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
  displayOn:   { type: String, enum: ['all', 'desktop', 'mobile'], default: 'all' },
  animation:   { type: String, enum: ['none', 'slide', 'fade', 'marquee'], default: 'none' },
}, { timestamps: true });

// Only return announcements that are within their schedule
announcementSchema.methods.isLive = function () {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startDate && this.startDate > now) return false;
  if (this.endDate   && this.endDate   < now) return false;
  return true;
};

module.exports = mongoose.model('AnnouncementBar', announcementSchema);

'use strict';
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  banner:      { type: String, default: '' },
  ctaText:     { type: String, default: 'Shop Now', trim: true },
  ctaLink:     { type: String, default: '/shop', trim: true },
  bgColor:     { type: String, default: '#FF7A00' },
  textColor:   { type: String, default: '#ffffff' },
  startDate:   { type: Date, default: null },
  endDate:     { type: Date, default: null },
  priority:    { type: Number, default: 0 },
  products:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  targetPages: { type: [String], default: ['home'] },
  showOn:      { type: String, enum: ['all', 'desktop', 'mobile'], default: 'all' },
  animation:   { type: String, enum: ['none', 'fade', 'slide'], default: 'none' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);

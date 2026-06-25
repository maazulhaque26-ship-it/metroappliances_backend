'use strict';
const mongoose = require('mongoose');

const popupSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  image:       { type: String, default: '' },
  bgColor:     { type: String, default: '#ffffff' },
  type:        { type: String, enum: ['welcome', 'offer', 'newsletter', 'festival', 'exit_intent', 'delay'], default: 'offer' },
  btnText:     { type: String, default: '' },
  btnLink:     { type: String, default: '' },
  btnColor:    { type: String, default: '#FF7A00' },
  delaySeconds:{ type: Number, default: 3 },
  frequency:   { type: String, enum: ['once', 'every_visit', 'once_per_day'], default: 'once' },
  startDate:   { type: Date, default: null },
  endDate:     { type: Date, default: null },
  priority:    { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
  showOn:      { type: String, enum: ['all', 'desktop', 'mobile'], default: 'all' },
  animation:   { type: String, enum: ['fade', 'slide_up', 'zoom', 'flip'], default: 'fade' },
  showNewsletter: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('MarketingPopup', popupSchema);

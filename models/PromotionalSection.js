'use strict';
const mongoose = require('mongoose');

const promotionalSectionSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  subtitle:     { type: String, default: '', trim: true },
  sectionType:  { type: String, enum: ['trending', 'featured', 'top_deals', 'recommended', 'recently_added', 'editors_choice', 'seasonal', 'custom'], default: 'custom' },
  products:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  ctaText:      { type: String, default: 'View All', trim: true },
  ctaLink:      { type: String, default: '/shop', trim: true },
  bgColor:      { type: String, default: '' },
  displayOrder: { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
  maxProducts:  { type: Number, default: 8 },
}, { timestamps: true });

module.exports = mongoose.model('PromotionalSection', promotionalSectionSchema);

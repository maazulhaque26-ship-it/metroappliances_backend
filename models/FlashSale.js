'use strict';
const mongoose = require('mongoose');

const flashSaleProductSchema = new mongoose.Schema({
  product:        { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  salePrice:      { type: Number, required: true },
  originalPrice:  { type: Number, required: true },
  stockLimit:     { type: Number, default: 0 },
}, { _id: false });

const flashSaleSchema = new mongoose.Schema({
  title:      { type: String, required: true, trim: true },
  subtitle:   { type: String, default: '', trim: true },
  startDate:  { type: Date, required: true },
  endDate:    { type: Date, required: true },
  bgColor:    { type: String, default: '#111111' },
  textColor:  { type: String, default: '#ffffff' },
  badgeText:  { type: String, default: 'FLASH SALE', trim: true },
  products:   [flashSaleProductSchema],
  isActive:   { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

flashSaleSchema.methods.isLive = function () {
  if (!this.isActive) return false;
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
};

module.exports = mongoose.model('FlashSale', flashSaleSchema);

'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const purchaseSuggestionSchema = new Schema({
  suggestionNumber: { type: String, unique: true },
  mrpRun:       { type: Schema.Types.ObjectId, ref: 'MRPRun', required: true },
  material:     { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  materialName: { type: String, default: '' },
  materialSKU:  { type: String, default: '' },
  unit:         { type: String, default: 'pcs' },
  quantity:     { type: Number, required: true, min: 0.001 },
  estimatedUnitCost: { type: Number, default: 0, min: 0 },
  estimatedTotalCost:{ type: Number, default: 0, min: 0 },
  suggestedVendor:   { type: Schema.Types.ObjectId, ref: 'Vendor' },
  suggestedVendorName: { type: String, default: '' },
  leadTimeDays:  { type: Number, default: 0, min: 0 },
  orderDate:     { type: Date },
  requiredDate:  { type: Date },
  priority:      { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  shortage:      { type: Schema.Types.ObjectId, ref: 'MaterialShortage' },
  status:        { type: String, enum: ['pending','approved','rejected','converted','cancelled'], default: 'pending' },
  convertedPO:   { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  rejectionReason: { type: String, default: '' },
  approvedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName:{ type: String, default: '' },
  notes:         { type: String, default: '' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

purchaseSuggestionSchema.index({ mrpRun: 1, status: 1 });
purchaseSuggestionSchema.index({ material: 1, orderDate: 1 });
purchaseSuggestionSchema.index({ status: 1, priority: 1 });

purchaseSuggestionSchema.pre('validate', async function (next) {
  if (this.isNew && !this.suggestionNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('PurchaseSuggestion').countDocuments();
    this.suggestionNumber = `PS-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PurchaseSuggestion', purchaseSuggestionSchema);

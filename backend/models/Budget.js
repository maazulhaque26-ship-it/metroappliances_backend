'use strict';
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  budgetNumber:  { type: String, unique: true },
  budgetName:    { type: String, required: true, trim: true },
  budgetType:    { type: String, enum: ['annual','monthly','quarterly','department','factory','warehouse','project'], default: 'annual' },
  fiscalYear:    { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear' },
  period:        { type: String, trim: true },
  department:    { type: String, trim: true },
  factory:       { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  warehouse:     { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  currency:      { type: String, default: 'INR', uppercase: true },
  totalBudget:   { type: Number, default: 0 },
  totalActual:   { type: Number, default: 0 },
  variance:      { type: Number, default: 0 },
  variancePct:   { type: Number, default: 0 },
  status:        { type: String, enum: ['draft','submitted','approved','locked','revised'], default: 'draft' },
  approvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:    { type: Date },
  lockedAt:      { type: Date },
  revision:      { type: Number, default: 1 },
  parentBudget:  { type: mongoose.Schema.Types.ObjectId, ref: 'Budget' },
  notes:         { type: String, trim: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

budgetSchema.pre('validate', async function (next) {
  if (this.budgetNumber) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.budgetNumber = `BUD-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

budgetSchema.index({ fiscalYear: 1, budgetType: 1 });
budgetSchema.index({ status: 1, isDeleted: 1 });
budgetSchema.index({ department: 1, period: 1 });

module.exports = mongoose.model('Budget', budgetSchema);

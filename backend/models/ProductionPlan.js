'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const historySchema = new Schema({
  status:       { type: String },
  note:         { type: String, default: '' },
  changedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  changedByName:{ type: String, default: '' },
  changedAt:    { type: Date, default: Date.now },
}, { _id: false });

const planSchema = new Schema({
  planNumber:   { type: String, unique: true },
  name:         { type: String, required: true, trim: true },
  planType:     { type: String, enum: ['weekly','monthly','quarterly','annual'], required: true },
  factory:      { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  periodStart:  { type: Date, required: true },
  periodEnd:    { type: Date, required: true },
  status:       { type: String, enum: ['draft','submitted','reviewed','approved','released','cancelled'], default: 'draft' },
  version:      { type: Number, default: 1 },
  // Demand & targets
  targetOutput:      { type: Number, default: 0, min: 0 },
  demandForecast:    { type: Number, default: 0, min: 0 },
  safetyStock:       { type: Number, default: 0, min: 0 },
  forecastOverride:  { type: Number, default: null },
  forecastSource:    { type: String, enum: ['manual','sales_orders','ai_forecast'], default: 'manual' },
  // Linked production orders
  productionOrders:  [{ type: Schema.Types.ObjectId, ref: 'ProductionOrder' }],
  // Approval workflow timestamps & actors
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  submittedAt: { type: Date },
  reviewedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:  { type: Date },
  approvedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt:  { type: Date },
  releasedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  releasedAt:  { type: Date },
  cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: { type: Date },
  // History trail
  history:   [historySchema],
  notes:     { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

planSchema.index({ factory: 1, status: 1, isDeleted: 1 });
planSchema.index({ periodStart: 1, periodEnd: 1 });
planSchema.index({ planType: 1 });
planSchema.index({ createdAt: -1 });

planSchema.pre('validate', async function (next) {
  if (this.isNew && !this.planNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('ProductionPlan').countDocuments();
    this.planNumber = `PP-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ProductionPlan', planSchema);

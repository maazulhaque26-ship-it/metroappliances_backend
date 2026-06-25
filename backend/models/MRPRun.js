'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const mrpRunSchema = new Schema({
  runNumber:    { type: String, unique: true },
  runType:      { type: String, enum: ['full','net_change','regenerative'], default: 'full' },
  status:       { type: String, enum: ['pending','running','completed','failed','cancelled'], default: 'pending' },
  factory:      { type: Schema.Types.ObjectId, ref: 'Factory' },
  planningHorizon: { type: Number, default: 90, min: 1 },
  horizonStart: { type: Date, required: true },
  horizonEnd:   { type: Date, required: true },
  productionPlans:  [{ type: Schema.Types.ObjectId, ref: 'ProductionPlan' }],
  productionOrders: [{ type: Schema.Types.ObjectId, ref: 'ProductionOrder' }],
  // Results
  totalRequirements:          { type: Number, default: 0 },
  totalShortages:             { type: Number, default: 0 },
  totalReservations:          { type: Number, default: 0 },
  totalPurchaseSuggestions:   { type: Number, default: 0 },
  totalProductionSuggestions: { type: Number, default: 0 },
  // Timing
  startedAt:   { type: Date },
  completedAt: { type: Date },
  durationMs:  { type: Number, default: 0 },
  errorMessage:{ type: String, default: '' },
  // Options
  autoReserve:            { type: Boolean, default: true },
  autoCreateSuggestions:  { type: Boolean, default: true },
  createdBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  createdByName: { type: String, default: '' },
  notes:     { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

mrpRunSchema.index({ status: 1, isDeleted: 1 });
mrpRunSchema.index({ factory: 1, createdAt: -1 });
mrpRunSchema.index({ createdAt: -1 });

mrpRunSchema.pre('validate', async function (next) {
  if (this.isNew && !this.runNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MRPRun').countDocuments();
    this.runNumber = `MRPR-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MRPRun', mrpRunSchema);

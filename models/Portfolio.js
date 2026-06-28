'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const portfolioSchema = new Schema({
  portfolioCode:     { type: String, unique: true },
  name:              { type: String, required: true, trim: true },
  description:       { type: String },
  status:            { type: String, enum: ['draft','active','on_hold','closed','archived'], default: 'draft' },
  priority:          { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  category:          { type: String, enum: ['strategic','operational','transformation','compliance','innovation'], default: 'strategic' },
  owner:             { type: Schema.Types.ObjectId, ref: 'User' },
  sponsor:           { type: Schema.Types.ObjectId, ref: 'User' },
  department:        { type: Schema.Types.ObjectId, ref: 'Department' },
  startDate:         { type: Date },
  endDate:           { type: Date },
  totalBudget:       { type: Number, default: 0 },
  currency:          { type: String, default: 'INR' },
  strategicAlignment:{ type: Number, min: 0, max: 100, default: 0 },
  healthScore:       { type: Number, min: 0, max: 100, default: 0 },
  health:            { type: String, enum: ['on_track','at_risk','off_track','not_started'], default: 'not_started' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

portfolioSchema.index({ status: 1, isDeleted: 1 });
portfolioSchema.index({ owner: 1 });

portfolioSchema.pre('validate', async function (next) {
  if (!this.portfolioCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Portfolio').countDocuments();
    this.portfolioCode = `PF-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Portfolio', portfolioSchema);

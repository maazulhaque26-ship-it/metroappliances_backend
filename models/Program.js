'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const programSchema = new Schema({
  programCode:       { type: String, unique: true },
  name:              { type: String, required: true, trim: true },
  description:       { type: String },
  portfolio:         { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  status:            { type: String, enum: ['planning','active','on_hold','completed','cancelled'], default: 'planning' },
  priority:          { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  programManager:    { type: Schema.Types.ObjectId, ref: 'User' },
  startDate:         { type: Date },
  endDate:           { type: Date },
  budget:            { type: Number, default: 0 },
  currency:          { type: String, default: 'INR' },
  objective:         { type: String },
  completionPercent: { type: Number, min: 0, max: 100, default: 0 },
  health:            { type: String, enum: ['on_track','at_risk','off_track','not_started'], default: 'not_started' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

programSchema.index({ portfolio: 1, status: 1 });
programSchema.index({ isDeleted: 1 });

programSchema.pre('validate', async function (next) {
  if (!this.programCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Program').countDocuments();
    this.programCode = `PGM-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Program', programSchema);

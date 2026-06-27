'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const strategicInitiativeSchema = new Schema({
  initiativeCode:   { type: String, unique: true },
  name:             { type: String, required: true, trim: true },
  description:      { type: String },
  portfolio:        { type: Schema.Types.ObjectId, ref: 'Portfolio' },
  status:           { type: String, enum: ['proposed','approved','in_progress','achieved','cancelled'], default: 'proposed' },
  priority:         { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  owner:            { type: Schema.Types.ObjectId, ref: 'User' },
  strategicGoal:    { type: String },
  targetValue:      { type: Number, default: 0 },
  currentValue:     { type: Number, default: 0 },
  unit:             { type: String, default: '' },
  targetDate:       { type: Date },
  alignment:        { type: Number, min: 0, max: 100, default: 0 },
  progress:         { type: Number, min: 0, max: 100, default: 0 },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

strategicInitiativeSchema.index({ portfolio: 1, status: 1 });

strategicInitiativeSchema.pre('validate', async function (next) {
  if (!this.initiativeCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('StrategicInitiative').countDocuments();
    this.initiativeCode = `SI-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('StrategicInitiative', strategicInitiativeSchema);

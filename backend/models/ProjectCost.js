'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectCostSchema = new Schema({
  project:     { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  category:    { type: String, enum: ['labor','material','equipment','travel','overhead','other'], default: 'other' },
  description: { type: String, required: true },
  amount:      { type: Number, required: true },
  date:        { type: Date, required: true },
  billable:    { type: Boolean, default: false },
  vendor:      { type: String },
  invoiceRef:  { type: String },
  recordedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

projectCostSchema.index({ project: 1, category: 1 });
projectCostSchema.index({ date: 1 });

module.exports = mongoose.model('ProjectCost', projectCostSchema);

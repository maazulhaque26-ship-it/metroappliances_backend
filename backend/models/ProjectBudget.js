'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectBudgetSchema = new Schema({
  project:           { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
  totalBudget:       { type: Number, required: true },
  laborBudget:       { type: Number, default: 0 },
  materialBudget:    { type: Number, default: 0 },
  overheadBudget:    { type: Number, default: 0 },
  contingencyBudget: { type: Number, default: 0 },
  currency:          { type: String, default: 'INR' },
  approvedBy:        { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt:        { type: Date },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ProjectBudget', projectBudgetSchema);

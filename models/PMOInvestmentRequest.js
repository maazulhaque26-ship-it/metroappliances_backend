'use strict';
const mongoose = require('mongoose');

const PMOInvestmentRequestSchema = new mongoose.Schema({
  requestCode:      { type: String, unique: true },
  title:            { type: String, required: true, trim: true },
  description:      { type: String, default: '' },
  requestType:      { type: String, enum: ['capex', 'opex', 'headcount', 'technology', 'infrastructure', 'training', 'other'], default: 'capex' },
  status:           { type: String, enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'deferred', 'implemented'], default: 'draft' },
  priority:         { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  portfolio:        { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  program:          { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  project:          { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  businessCase:     { type: mongoose.Schema.Types.ObjectId, ref: 'PMOBusinessCase' },
  requestedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedDate:    { type: Date },
  requiredByDate:   { type: Date },
  approvedDate:     { type: Date },
  requestedAmount:  { type: Number, required: true, default: 0 },
  approvedAmount:   { type: Number, default: 0 },
  currency:         { type: String, default: 'INR' },
  fiscalYear:       { type: Number, default: () => new Date().getFullYear() },
  quarter:          { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'] },
  justification:    { type: String, default: '' },
  expectedRoi:      { type: Number, default: 0 },
  rejectionReason:  { type: String, default: '' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

PMOInvestmentRequestSchema.pre('validate', async function (next) {
  if (this.requestCode) return next();
  try {
    const year = new Date().getFullYear();
    const last = await mongoose.model('PMOInvestmentRequest').findOne({ requestCode: new RegExp(`^IR-${year}-`) }).sort({ requestCode: -1 }).lean();
    const seq = last ? (parseInt(last.requestCode.split('-')[2], 10) + 1) : 1;
    this.requestCode = `IR-${year}-${String(seq).padStart(5, '0')}`;
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.models.PMOInvestmentRequest || mongoose.model('PMOInvestmentRequest', PMOInvestmentRequestSchema);

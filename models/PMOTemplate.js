'use strict';
const mongoose = require('mongoose');

const PMOTemplateSchema = new mongoose.Schema({
  templateCode: { type: String, unique: true },
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  category:     { type: String, enum: ['project_charter', 'risk_register', 'status_report', 'business_case', 'lessons_learned', 'project_plan', 'communication_plan', 'change_request', 'test_plan', 'quality_plan', 'other'], default: 'other' },
  methodology:  { type: String, enum: ['waterfall', 'agile', 'hybrid', 'prince2', 'pmbok', 'lean', 'six_sigma', 'kanban', 'safe', 'other'], default: 'pmbok' },
  version:      { type: String, default: '1.0' },
  status:       { type: String, enum: ['draft', 'active', 'deprecated', 'archived'], default: 'active' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content:      { type: String, default: '' },
  sections:     [{ title: String, content: String, order: Number }],
  tags:         [{ type: String }],
  isPublic:     { type: Boolean, default: true },
  usageCount:   { type: Number, default: 0 },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

PMOTemplateSchema.pre('validate', async function (next) {
  if (this.templateCode) return next();
  try {
    const year = new Date().getFullYear();
    const last = await mongoose.model('PMOTemplate').findOne({ templateCode: new RegExp(`^TPL-${year}-`) }).sort({ templateCode: -1 }).lean();
    const seq = last ? (parseInt(last.templateCode.split('-')[2], 10) + 1) : 1;
    this.templateCode = `TPL-${year}-${String(seq).padStart(5, '0')}`;
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.models.PMOTemplate || mongoose.model('PMOTemplate', PMOTemplateSchema);

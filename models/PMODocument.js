'use strict';
const mongoose = require('mongoose');

const PMODocumentSchema = new mongoose.Schema({
  documentCode:  { type: String, unique: true },
  title:         { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  documentType:  { type: String, enum: ['charter', 'plan', 'report', 'policy', 'procedure', 'standard', 'template', 'contract', 'minutes', 'presentation', 'other'], default: 'other' },
  category:      { type: String, enum: ['governance', 'planning', 'execution', 'monitoring', 'closure', 'compliance', 'finance', 'hr', 'technical', 'other'], default: 'other' },
  status:        { type: String, enum: ['draft', 'under_review', 'approved', 'published', 'archived', 'superseded'], default: 'draft' },
  portfolio:     { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  program:       { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  project:       { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  uploadedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  version:       { type: String, default: '1.0' },
  fileUrl:       { type: String, default: '' },
  fileName:      { type: String, default: '' },
  fileSize:      { type: Number, default: 0 },
  mimeType:      { type: String, default: '' },
  tags:          [{ type: String }],
  accessLevel:   { type: String, enum: ['public', 'internal', 'restricted', 'confidential'], default: 'internal' },
  expiryDate:    { type: Date },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

PMODocumentSchema.pre('validate', async function (next) {
  if (this.documentCode) return next();
  try {
    const year = new Date().getFullYear();
    const last = await mongoose.model('PMODocument').findOne({ documentCode: new RegExp(`^DOC-${year}-`) }).sort({ documentCode: -1 }).lean();
    const seq = last ? (parseInt(last.documentCode.split('-')[2], 10) + 1) : 1;
    this.documentCode = `DOC-${year}-${String(seq).padStart(5, '0')}`;
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.models.PMODocument || mongoose.model('PMODocument', PMODocumentSchema);

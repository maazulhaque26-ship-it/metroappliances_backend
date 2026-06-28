'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectReportSchema = new Schema({
  reportCode:  { type: String, unique: true },
  project:     { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  type:        { type: String, enum: ['progress','budget','resource','risk','issue','milestone','timesheet','custom'] },
  title:       { type: String, required: true, trim: true },
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parameters:  { type: Schema.Types.Mixed },
  data:        { type: Schema.Types.Mixed },
  format:      { type: String, enum: ['json','pdf','excel'], default: 'json' },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

projectReportSchema.index({ project: 1, type: 1 });
projectReportSchema.index({ generatedBy: 1 });

projectReportSchema.pre('validate', async function (next) {
  if (!this.reportCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('ProjectReport').countDocuments();
    this.reportCode = `RPT-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ProjectReport', projectReportSchema);

'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const auditProgramSchema = new Schema({
  programNumber:  { type: String, unique: true },
  name:           { type: String, required: true },
  description:    { type: String, default: '' },
  programType:    { type: String, enum: ['internal','external','supplier','certification','regulatory','surveillance'], default: 'internal' },
  standard:       { type: String, enum: ['iso9001','iso14001','iso45001','iatf16949','as9100','custom','other'], default: 'iso9001' },
  scope:          { type: String, default: '' },
  objectives:     { type: String, default: '' },
  year:           { type: Number, required: true },
  status:         { type: String, enum: ['planning','active','completed','cancelled'], default: 'planning' },
  programManager: { type: Schema.Types.ObjectId, ref: 'User' },
  programManagerName: { type: String, default: '' },
  startDate:      { type: Date },
  endDate:        { type: Date },
  totalAuditsPlanned: { type: Number, default: 0 },
  totalAuditsCompleted: { type: Number, default: 0 },
  budget:         { type: Number, default: 0 },
  notes:          { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

auditProgramSchema.index({ year: -1, status: 1 });
auditProgramSchema.index({ programType: 1, status: 1 });

auditProgramSchema.pre('validate', async function (next) {
  if (this.isNew && !this.programNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('AuditProgram').countDocuments();
    this.programNumber = `AP-${yr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AuditProgram', auditProgramSchema);

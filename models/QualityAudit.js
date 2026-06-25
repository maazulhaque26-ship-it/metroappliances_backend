'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const qualityAuditSchema = new Schema({
  auditNumber:    { type: String, unique: true },
  auditProgram:   { type: Schema.Types.ObjectId, ref: 'AuditProgram' },
  auditType:      { type: String, enum: ['internal','external','supplier','process','product','system','certification'], required: true },
  standard:       { type: String, enum: ['iso9001','iso14001','iso45001','iatf16949','as9100','custom','other'], default: 'iso9001' },
  title:          { type: String, required: true },
  scope:          { type: String, default: '' },
  criteria:       { type: String, default: '' },
  auditArea:      { type: String, default: '' },
  factory:        { type: Schema.Types.ObjectId, ref: 'Factory' },
  factoryName:    { type: String, default: '' },
  vendor:         { type: Schema.Types.ObjectId, ref: 'Vendor' },
  vendorName:     { type: String, default: '' },
  plannedDate:    { type: Date, required: true },
  actualStartDate:{ type: Date },
  actualEndDate:  { type: Date },
  leadAuditor:    { type: Schema.Types.ObjectId, ref: 'User' },
  leadAuditorName:{ type: String, default: '' },
  auditTeam:      [{ auditorId: Schema.Types.ObjectId, auditorName: String, role: { type: String, default: 'team_member' } }],
  auditee:        { type: String, default: '' },
  status:         { type: String, enum: ['planned','in_progress','completed','cancelled','report_pending','closed'], default: 'planned' },
  totalFindings:  { type: Number, default: 0 },
  majorNCs:       { type: Number, default: 0 },
  minorNCs:       { type: Number, default: 0 },
  observations:   { type: Number, default: 0 },
  opportunities:  { type: Number, default: 0 },
  overallResult:  { type: String, enum: ['satisfactory','satisfactory_with_observations','unsatisfactory','pending'], default: 'pending' },
  summary:        { type: String, default: '' },
  reportUrl:      { type: String, default: '' },
  closureDate:    { type: Date },
  nextAuditDate:  { type: Date },
  capaRequired:   { type: Boolean, default: false },
  notes:          { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

qualityAuditSchema.index({ auditProgram: 1, status: 1 });
qualityAuditSchema.index({ auditType: 1, status: 1 });
qualityAuditSchema.index({ plannedDate: 1, status: 1 });
qualityAuditSchema.index({ factory: 1, auditType: 1 });

qualityAuditSchema.pre('validate', async function (next) {
  if (this.isNew && !this.auditNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('QualityAudit').countDocuments();
    this.auditNumber = `QA-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('QualityAudit', qualityAuditSchema);

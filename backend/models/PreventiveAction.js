'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const preventiveActionSchema = new Schema({
  paNumber:       { type: String, unique: true },
  capa:           { type: Schema.Types.ObjectId, ref: 'CAPA' },
  title:          { type: String, required: true },
  description:    { type: String, default: '' },
  riskArea:       { type: String, enum: ['process','product','equipment','supplier','environment','human_factor','other'], default: 'process' },
  riskDescription:{ type: String, default: '' },
  likelihood:     { type: String, enum: ['low','medium','high'], default: 'medium' },
  impact:         { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  riskScore:      { type: Number, default: 0 },
  actionCategory: { type: String, enum: ['training','procedure','equipment','monitoring','supplier','design_change','other'], default: 'procedure' },
  actionPlan:     { type: String, default: '' },
  assignedTo:     { type: Schema.Types.ObjectId, ref: 'User' },
  assignedToName: { type: String, default: '' },
  targetDate:     { type: Date },
  completedDate:  { type: Date },
  status:         { type: String, enum: ['open','in_progress','completed','verified','overdue'], default: 'open' },
  evidence:       { type: String, default: '' },
  documentUrls:   [{ type: String }],
  verifiedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedByName: { type: String, default: '' },
  verifiedAt:     { type: Date },
  effectiveness:  { type: String, enum: ['pending','effective','not_effective'], default: 'pending' },
  notes:          { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

preventiveActionSchema.index({ capa: 1, status: 1 });
preventiveActionSchema.index({ assignedTo: 1, status: 1 });
preventiveActionSchema.index({ riskArea: 1, status: 1 });

preventiveActionSchema.pre('validate', async function (next) {
  if (this.isNew && !this.paNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('PreventiveAction').countDocuments();
    this.paNumber = `PA-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PreventiveAction', preventiveActionSchema);

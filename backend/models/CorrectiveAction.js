'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const correctiveActionSchema = new Schema({
  actionNumber:   { type: String, unique: true },
  capa:           { type: Schema.Types.ObjectId, ref: 'CAPA', required: true },
  actionType:     { type: String, enum: ['corrective','preventive'], default: 'corrective' },
  title:          { type: String, required: true },
  description:    { type: String, default: '' },
  actionCategory: { type: String, enum: ['process_change','training','equipment','material','documentation','supplier_change','inspection','other'], default: 'process_change' },
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
  verificationNotes: { type: String, default: '' },
  effectiveness:  { type: String, enum: ['pending','effective','not_effective'], default: 'pending' },
  notes:          { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

correctiveActionSchema.index({ capa: 1, status: 1 });
correctiveActionSchema.index({ assignedTo: 1, status: 1 });
correctiveActionSchema.index({ targetDate: 1, status: 1 });

correctiveActionSchema.pre('validate', async function (next) {
  if (this.isNew && !this.actionNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('CorrectiveAction').countDocuments();
    this.actionNumber = `CA-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CorrectiveAction', correctiveActionSchema);

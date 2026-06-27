'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const milestoneSchema = new Schema({
  milestoneCode: { type: String, unique: true },
  project:       { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  phase:         { type: Schema.Types.ObjectId, ref: 'ProjectPhase' },
  name:          { type: String, required: true, trim: true },
  description:   { type: String },
  dueDate:       { type: Date },
  completedDate: { type: Date },
  status:        { type: String, enum: ['pending','at_risk','achieved','missed'], default: 'pending' },
  owner:         { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

milestoneSchema.index({ project: 1, status: 1 });

milestoneSchema.pre('validate', async function (next) {
  if (!this.milestoneCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Milestone').countDocuments();
    this.milestoneCode = `MLS-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Milestone', milestoneSchema);

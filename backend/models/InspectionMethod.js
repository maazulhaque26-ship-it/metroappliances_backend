'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const inspectionMethodSchema = new Schema({
  code:               { type: String, unique: true },
  name:               { type: String, required: true },
  methodType:         { type: String, enum: ['visual','measurement','functional','destructive','non_destructive','chemical','dimensional','other'], default: 'visual' },
  description:        { type: String, default: '' },
  instructions:       { type: String, default: '' },
  requiredEquipment:  [{ type: String }],
  acceptanceCriteria: { type: String, default: '' },
  referenceStandard:  { type: String, default: '' },
  isActive:           { type: Boolean, default: true },
  isDeleted:          { type: Boolean, default: false },
}, { timestamps: true });

inspectionMethodSchema.index({ methodType: 1, isActive: 1 });

inspectionMethodSchema.pre('validate', async function (next) {
  if (this.isNew && !this.code) {
    const count = await mongoose.model('InspectionMethod').countDocuments();
    this.code = `IM-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('InspectionMethod', inspectionMethodSchema);

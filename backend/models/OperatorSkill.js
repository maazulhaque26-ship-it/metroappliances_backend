'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const operatorSkillSchema = new Schema({
  operator:           { type: Schema.Types.ObjectId, ref: 'User', required: true },
  operatorName:       { type: String, default: '' },
  skillName:          { type: String, required: true },
  skillCategory:      { type: String, enum: ['machining','welding','assembly','quality','testing','maintenance','safety','other'], default: 'assembly' },
  proficiencyLevel:   { type: Number, required: true, min: 1, max: 5 },
  certificationDate:  { type: Date },
  expiryDate:         { type: Date },
  certificationBody:  { type: String, default: '' },
  certificationNumber:{ type: String, default: '' },
  isActive:           { type: Boolean, default: true },
  verifiedBy:         { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedByName:     { type: String, default: '' },
  notes:              { type: String, default: '' },
  isDeleted:          { type: Boolean, default: false },
}, { timestamps: true });

operatorSkillSchema.index({ operator: 1, skillCategory: 1 });
operatorSkillSchema.index({ skillName: 1, proficiencyLevel: -1 });
operatorSkillSchema.index({ isActive: 1 });

module.exports = mongoose.model('OperatorSkill', operatorSkillSchema);

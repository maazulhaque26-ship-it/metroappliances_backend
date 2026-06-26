'use strict';
const mongoose = require('mongoose');

const SalaryStructureSchema = new mongoose.Schema({
  structureCode:   { type: String, unique: true },
  name:            { type: String, required: true, trim: true },
  description:     { type: String, default: '' },
  isDefault:       { type: Boolean, default: false },
  applicableFrom:  { type: Date },
  components:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'SalaryComponent' }],
  isActive:        { type: Boolean, default: true },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

SalaryStructureSchema.index({ isActive: 1, isDeleted: 1 });

SalaryStructureSchema.pre('validate', async function (next) {
  if (this.structureCode) return next();
  const count = await mongoose.model('SalaryStructure').countDocuments();
  this.structureCode = `SS-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('SalaryStructure', SalaryStructureSchema);

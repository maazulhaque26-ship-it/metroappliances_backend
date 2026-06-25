'use strict';
const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
  designationCode: { type: String, unique: true },
  title:           { type: String, required: true, trim: true },
  level:           { type: Number, default: 1 },
  grade:           { type: String, trim: true },
  department:      { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  minSalary:       { type: Number, default: 0 },
  maxSalary:       { type: Number, default: 0 },
  description:     { type: String, default: '' },
  isActive:        { type: Boolean, default: true },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

designationSchema.pre('validate', async function (next) {
  if (this.designationCode) return next();
  const count = await this.constructor.countDocuments();
  this.designationCode = `DESG-${String(count + 1).padStart(4, '0')}`;
  next();
});

designationSchema.index({ title: 1, isDeleted: 1 });
designationSchema.index({ department: 1 });
designationSchema.index({ level: 1 });

module.exports = mongoose.model('Designation', designationSchema);

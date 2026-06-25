'use strict';
const mongoose = require('mongoose');

const employeePromotionSchema = new mongoose.Schema({
  promotionNumber:    { type: String, unique: true },
  employee:           { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  effectiveDate:      { type: Date, required: true },
  fromDesignation:    { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  toDesignation:      { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  fromDepartment:     { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  toDepartment:       { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  fromCtc:            { type: Number, default: 0 },
  toCtc:              { type: Number, default: 0 },
  fromBasic:          { type: Number, default: 0 },
  toBasic:            { type: Number, default: 0 },
  incrementPct:       { type: Number, default: 0 },
  promotionType:      { type: String, enum: ['merit','time_bound','spot','lateral'], default: 'merit' },
  reason:             { type: String, default: '', trim: true },
  status:             { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  approvedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:         { type: Date },
  notes:              { type: String, default: '' },
  isDeleted:          { type: Boolean, default: false },
}, { timestamps: true });

employeePromotionSchema.pre('validate', async function (next) {
  if (this.promotionNumber) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.promotionNumber = `PRO-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

employeePromotionSchema.index({ employee: 1, effectiveDate: -1 });
employeePromotionSchema.index({ status: 1 });

module.exports = mongoose.model('EmployeePromotion', employeePromotionSchema);

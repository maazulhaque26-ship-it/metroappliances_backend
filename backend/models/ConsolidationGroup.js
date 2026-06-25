'use strict';
const mongoose = require('mongoose');

const consolidationGroupSchema = new mongoose.Schema({
  groupCode:    { type: String, unique: true },
  groupName:    { type: String, required: true, trim: true },
  currency:     { type: String, default: 'INR', uppercase: true },
  description:  { type: String, trim: true },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

consolidationGroupSchema.pre('validate', async function (next) {
  if (this.groupCode) return next();
  const count = await this.constructor.countDocuments();
  this.groupCode = `CG-${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('ConsolidationGroup', consolidationGroupSchema);

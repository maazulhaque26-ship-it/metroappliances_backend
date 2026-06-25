'use strict';
const mongoose = require('mongoose');

const hrSettingSchema = new mongoose.Schema({
  key:         { type: String, required: true, unique: true, trim: true },
  value:       { type: mongoose.Schema.Types.Mixed },
  category:    { type: String, enum: ['general','probation','leaves','attendance','payroll','exit','documents','notifications'], default: 'general' },
  description: { type: String, default: '' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

hrSettingSchema.index({ category: 1 });

module.exports = mongoose.model('HRSetting', hrSettingSchema);

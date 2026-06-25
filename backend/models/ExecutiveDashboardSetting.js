'use strict';
const mongoose = require('mongoose');

const executiveDashboardSettingSchema = new mongoose.Schema({
  settingKey:    { type: String, required: true, unique: true, trim: true },
  label:         { type: String, trim: true },
  value:         { type: mongoose.Schema.Types.Mixed },
  category:      { type: String, enum: ['kpi','chart','alert','display','refresh','threshold'], default: 'display' },
  description:   { type: String, trim: true },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

executiveDashboardSettingSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('ExecutiveDashboardSetting', executiveDashboardSettingSchema);

'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectSettingSchema = new Schema({
  key:         { type: String, required: true, unique: true, trim: true },
  value:       { type: Schema.Types.Mixed },
  description: { type: String },
  category:    { type: String },
  updatedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

projectSettingSchema.index({ category: 1 });

module.exports = mongoose.model('ProjectSetting', projectSettingSchema);

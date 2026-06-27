'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectTemplateSchema = new Schema({
  templateCode:    { type: String, unique: true },
  name:            { type: String, required: true, trim: true },
  description:     { type: String },
  category:        { type: String },
  defaultDuration: { type: Number },
  phases: [{
    name:     { type: String },
    order:    { type: Number },
    duration: { type: Number },
  }],
  defaultRoles: [{ type: String }],
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

projectTemplateSchema.index({ isActive: 1 });

projectTemplateSchema.pre('validate', async function (next) {
  if (!this.templateCode) {
    const count = await mongoose.model('ProjectTemplate').countDocuments();
    this.templateCode = `TMP-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ProjectTemplate', projectTemplateSchema);

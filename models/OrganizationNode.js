'use strict';
const mongoose = require('mongoose');

const organizationNodeSchema = new mongoose.Schema({
  nodeType:    { type: String, enum: ['company','business_unit','department','team','position'], required: true },
  name:        { type: String, required: true, trim: true },
  code:        { type: String, trim: true },
  parent:      { type: mongoose.Schema.Types.ObjectId, ref: 'OrganizationNode' },
  level:       { type: Number, default: 0 },
  path:        { type: String, default: '' },
  headEmployee:{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  headCount:   { type: Number, default: 0 },
  department:  { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  businessUnit:{ type: mongoose.Schema.Types.ObjectId, ref: 'BusinessUnit' },
  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
}, { timestamps: true });

organizationNodeSchema.index({ parent: 1 });
organizationNodeSchema.index({ nodeType: 1 });
organizationNodeSchema.index({ level: 1 });

module.exports = mongoose.model('OrganizationNode', organizationNodeSchema);

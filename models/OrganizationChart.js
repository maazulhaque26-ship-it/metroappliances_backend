'use strict';
const mongoose = require('mongoose');

const organizationChartSchema = new mongoose.Schema({
  chartName:   { type: String, required: true, trim: true },
  chartVersion:{ type: String, default: '1.0' },
  description: { type: String, default: '' },
  effectiveDate:{ type: Date, required: true },
  nodes:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrganizationNode' }],
  status:      { type: String, enum: ['draft','active','archived'], default: 'draft' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

organizationChartSchema.index({ status: 1 });
organizationChartSchema.index({ effectiveDate: -1 });

module.exports = mongoose.model('OrganizationChart', organizationChartSchema);

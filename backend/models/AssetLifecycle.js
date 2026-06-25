'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const assetLifecycleSchema = new Schema({
  asset:         { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetNumber:   { type: String, default: '' },
  eventType:     { type: String, enum: ['commissioned','transferred','upgraded','repaired','refurbished','disposed','decommissioned','written_off','returned','lost','found','status_change','location_change'], required: true },
  eventDate:     { type: Date, required: true },
  description:   { type: String, default: '' },
  fromLocation:  { type: Schema.Types.ObjectId, ref: 'AssetLocation' },
  fromLocationName: { type: String, default: '' },
  toLocation:    { type: Schema.Types.ObjectId, ref: 'AssetLocation' },
  toLocationName:{ type: String, default: '' },
  fromStatus:    { type: String, default: '' },
  toStatus:      { type: String, default: '' },
  fromDepartment:{ type: String, default: '' },
  toDepartment:  { type: String, default: '' },
  cost:          { type: Number, default: 0 },
  performedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String, default: '' },
  approvedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName:{ type: String, default: '' },
  referenceDoc:  { type: String, default: '' },
  notes:         { type: String, default: '' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

assetLifecycleSchema.index({ asset: 1, eventDate: -1 });
assetLifecycleSchema.index({ eventType: 1 });
assetLifecycleSchema.index({ eventDate: -1 });

module.exports = mongoose.model('AssetLifecycle', assetLifecycleSchema);

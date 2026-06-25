'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const assetLocationSchema = new Schema({
  code:          { type: String, unique: true },
  name:          { type: String, required: true },
  description:   { type: String, default: '' },
  locationType:  { type: String, enum: ['site','building','floor','room','area','zone','rack','other'], default: 'area' },
  factory:       { type: Schema.Types.ObjectId, ref: 'Factory' },
  factoryName:   { type: String, default: '' },
  parentLocation:{ type: Schema.Types.ObjectId, ref: 'AssetLocation' },
  address:       { type: String, default: '' },
  gpsLat:        { type: Number },
  gpsLng:        { type: Number },
  costCenter:    { type: String, default: '' },
  manager:       { type: Schema.Types.ObjectId, ref: 'User' },
  managerName:   { type: String, default: '' },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

assetLocationSchema.index({ factory: 1, locationType: 1 });
assetLocationSchema.index({ parentLocation: 1 });

assetLocationSchema.pre('validate', async function (next) {
  if (this.isNew && !this.code) {
    const count = await mongoose.model('AssetLocation').countDocuments();
    this.code = `LOC-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AssetLocation', assetLocationSchema);

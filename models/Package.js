const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  packageNumber:   { type: String, unique: true },
  dispatch:        { type: mongoose.Schema.Types.ObjectId, ref: 'Dispatch' },
  warehouse:       { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },

  // Physical dimensions
  length:          { type: Number }, // cm
  width:           { type: Number }, // cm
  height:          { type: Number }, // cm
  weight:          { type: Number }, // kg
  volumetricWeight:{ type: Number }, // auto-calculated
  packingMaterial: { type: String, enum: ['standard_box','heavy_duty_box','bubble_wrap','foam','custom'], default: 'standard_box' },

  // Label info
  labelGenerated:  { type: Boolean, default: false },
  labelUrl:        { type: String },

  // Status
  status:          { type: String, enum: ['packing','packed','shipped','delivered'], default: 'packing' },
  packedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseUser' },
  packedByName:    { type: String },
  packedAt:        { type: Date },

  notes:           { type: String },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

packageSchema.pre('save', async function (next) {
  if (!this.packageNumber) {
    const d   = new Date();
    const pad = n => String(n).padStart(2, '0');
    const ds  = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const count = await mongoose.model('Package').countDocuments({ packageNumber: { $regex: `^PKG-${ds}` } });
    this.packageNumber = `PKG-${ds}-${String(count + 1).padStart(4, '0')}`;
  }
  if (this.length && this.width && this.height) {
    this.volumetricWeight = (this.length * this.width * this.height) / 5000;
  }
  next();
});

module.exports = mongoose.model('Package', packageSchema);

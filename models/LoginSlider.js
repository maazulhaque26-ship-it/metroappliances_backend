const mongoose = require('mongoose');

const loginSliderSchema = new mongoose.Schema({
  image:        { type: String, required: true },
  publicId:     { type: String, default: '' },
  title:        { type: String, default: '' },
  subtitle:     { type: String, default: '' },
  displayOrder: { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('LoginSlider', loginSliderSchema);

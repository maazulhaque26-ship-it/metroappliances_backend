const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  eyebrow: { type: String, default: '' },
  title1: { type: String, required: true },
  title2: { type: String, default: '' },
  subtitle: { type: String, required: true },
  cta: { type: String, required: true },
  ctaPath: { type: String, required: true },
  badge: { type: String, default: '' },
  image: { type: String, required: true },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);

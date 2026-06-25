const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
  image:        { type: String, required: true },
  displayOrder: { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('GalleryImage', galleryImageSchema);

const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, required: true, trim: true },
  image:        { type: String, default: '' },
  displayOrder: { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Achievement', achievementSchema);

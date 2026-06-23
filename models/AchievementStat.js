const mongoose = require('mongoose');

const achievementStatSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  count:        { type: Number, required: true, default: 0 },
  suffix:       { type: String, default: '+', trim: true },
  displayOrder: { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('AchievementStat', achievementStatSchema);

const mongoose = require('mongoose');

const treasurySettingSchema = new mongoose.Schema({
  key:         { type: String, required: true, unique: true, trim: true },
  value:       { type: mongoose.Schema.Types.Mixed },
  description: { type: String, trim: true },
  category:    { type: String, enum: ['general','banking','cash','investments','fx','reporting'], default: 'general' },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

treasurySettingSchema.index({ category: 1 });

module.exports = mongoose.model('TreasurySetting', treasurySettingSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const arSettingSchema = new Schema({
  key:         { type: String, required: true, unique: true, trim: true },
  value:       { type: Schema.Types.Mixed },
  description: { type: String, trim: true },
  category:    { type: String, enum: ['invoice','receipt','collection','aging','credit','general'], default: 'general' },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

arSettingSchema.index({ category: 1 });

module.exports = mongoose.model('ARSetting', arSettingSchema);

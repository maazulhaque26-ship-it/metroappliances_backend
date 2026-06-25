'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const downtimeReasonSchema = new Schema({
  code:          { type: String, unique: true },
  name:          { type: String, required: true },
  category:      { type: String, enum: ['breakdown','maintenance','power','material','operator','tool','cleaning','calibration','setup','unknown'], required: true },
  description:   { type: String, default: '' },
  isMaintenance: { type: Boolean, default: false },
  isPlanned:     { type: Boolean, default: false },
  avgResolutionMins: { type: Number, default: 0, min: 0 },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

downtimeReasonSchema.index({ category: 1, isActive: 1 });

downtimeReasonSchema.pre('validate', async function (next) {
  if (this.isNew && !this.code) {
    const count = await mongoose.model('DowntimeReason').countDocuments();
    this.code = `DTR-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('DowntimeReason', downtimeReasonSchema);

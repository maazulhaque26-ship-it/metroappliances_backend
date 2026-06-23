const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentTermSchema = new Schema({
  termCode:     { type: String, unique: true, required: true, uppercase: true, trim: true },
  name:         { type: String, required: true, trim: true },
  netDays:      { type: Number, default: 0, min: 0 },
  discountDays: { type: Number, default: 0 },
  discountPct:  { type: Number, default: 0, min: 0, max: 100 },
  description:  { type: String, trim: true },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

paymentTermSchema.index({ termCode: 1, isDeleted: 1 });
paymentTermSchema.index({ isActive: 1 });

module.exports = mongoose.model('PaymentTerm', paymentTermSchema);

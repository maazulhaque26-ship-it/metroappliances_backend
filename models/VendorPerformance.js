const mongoose = require('mongoose');
const { Schema } = mongoose;

const vendorPerformanceSchema = new Schema({
  vendor:               { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  period:               { type: String, required: true }, // YYYY-MM
  totalOrders:          { type: Number, default: 0 },
  totalOrderValue:      { type: Number, default: 0 },
  onTimeDeliveries:     { type: Number, default: 0 },
  lateDeliveries:       { type: Number, default: 0 },
  qualityIssues:        { type: Number, default: 0 },
  returnedItems:        { type: Number, default: 0 },
  cancelledOrders:      { type: Number, default: 0 },
  averageLeadTime:      Number, // days
  onTimeDeliveryRate:   Number, // %
  qualityScore:         Number, // %
  overallScore:         Number, // composite
  totalSpend:           Number,
  isDeleted:            { type: Boolean, default: false },
}, { timestamps: true });

vendorPerformanceSchema.index({ vendor: 1, period: -1 });
vendorPerformanceSchema.index({ vendor: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('VendorPerformance', vendorPerformanceSchema);

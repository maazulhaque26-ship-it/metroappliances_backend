const mongoose = require('mongoose');
const { Schema } = mongoose;

const vendorSchema = new Schema({
  vendorCode:      { type: String, unique: true, sparse: true },
  companyName:     { type: String, required: true, trim: true },
  displayName:     { type: String, trim: true },
  vendorType:      { type: String, enum: ['manufacturer', 'distributor', 'trader', 'service_provider', 'importer', 'other'], default: 'distributor' },
  gstNumber:       { type: String, trim: true, uppercase: true },
  panNumber:       { type: String, trim: true, uppercase: true },
  msmeNumber:      { type: String, trim: true },
  cinNumber:       { type: String, trim: true, uppercase: true },
  email:           { type: String, trim: true, lowercase: true },
  phone:           { type: String, trim: true },
  mobile:          { type: String, trim: true },
  website:         { type: String, trim: true },
  paymentTerms:    { type: String, enum: ['advance', 'net7', 'net15', 'net30', 'net45', 'net60', 'net90'], default: 'net30' },
  creditDays:      { type: Number, default: 30 },
  currency:        { type: String, default: 'INR' },
  // Performance — maintained by vendorController.updatePerformanceMetrics()
  overallRating:        { type: Number, default: 0, min: 0, max: 5 },
  onTimeDeliveryRate:   { type: Number, default: 0 }, // %
  qualityScore:         { type: Number, default: 0 }, // %
  totalOrders:          { type: Number, default: 0 },
  totalSpend:           { type: Number, default: 0 },
  averageLeadTime:      { type: Number, default: 0 }, // days
  status:               { type: String, enum: ['active', 'inactive', 'blacklisted', 'pending_approval'], default: 'pending_approval' },
  approvedBy:           { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt:           Date,
  blacklistedReason:    String,
  notes:                String,
  isDeleted:            { type: Boolean, default: false },
}, { timestamps: true });

vendorSchema.index({ companyName: 1, isDeleted: 1 });
vendorSchema.index({ status: 1, isDeleted: 1 });
vendorSchema.index({ vendorCode: 1 });
vendorSchema.index({ gstNumber: 1 });
vendorSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Vendor', vendorSchema);

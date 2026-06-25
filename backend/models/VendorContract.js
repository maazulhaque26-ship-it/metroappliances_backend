const mongoose = require('mongoose');
const { Schema } = mongoose;

const vendorContractSchema = new Schema({
  vendor:          { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  contractNumber:  { type: String, unique: true, sparse: true },
  title:           { type: String, required: true, trim: true },
  contractType:    { type: String, enum: ['annual', 'project', 'blanket', 'spot', 'rate_contract'], default: 'annual' },
  startDate:       { type: Date, required: true },
  endDate:         Date,
  totalValue:      Number,
  paymentTerms:    String,
  deliveryTerms:   String,
  penaltyClause:   String,
  status:          { type: String, enum: ['draft', 'active', 'expired', 'terminated', 'renewed'], default: 'draft' },
  signedBy:        { type: Schema.Types.ObjectId, ref: 'User' },
  signedAt:        Date,
  terminatedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  terminatedAt:    Date,
  terminationReason: String,
  fileUrl:         String,
  renewedFrom:     { type: Schema.Types.ObjectId, ref: 'VendorContract' },
  notes:           String,
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

vendorContractSchema.index({ vendor: 1, isDeleted: 1 });
vendorContractSchema.index({ status: 1, endDate: 1 });

module.exports = mongoose.model('VendorContract', vendorContractSchema);

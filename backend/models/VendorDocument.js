const mongoose = require('mongoose');
const { Schema } = mongoose;

const vendorDocumentSchema = new Schema({
  vendor:         { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  documentType:   { type: String, enum: ['gst_certificate', 'pan_card', 'msme_certificate', 'cin_document', 'incorporation_certificate', 'address_proof', 'bank_statement', 'cancelled_cheque', 'trade_license', 'other'], required: true },
  documentNumber: { type: String, trim: true },
  fileName:       String,
  fileUrl:        String,
  expiryDate:     Date,
  status:         { type: String, enum: ['pending', 'verified', 'rejected', 'expired'], default: 'pending' },
  verifiedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt:     Date,
  rejectionReason: String,
  notes:          String,
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

vendorDocumentSchema.index({ vendor: 1, isDeleted: 1 });
vendorDocumentSchema.index({ vendor: 1, documentType: 1 });
vendorDocumentSchema.index({ status: 1 });

module.exports = mongoose.model('VendorDocument', vendorDocumentSchema);

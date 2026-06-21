const mongoose = require('mongoose');
const { Schema } = mongoose;

const rfqItemSchema = new Schema({
  product:        { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:    { type: String, required: true },
  productCode:    String,
  quantity:       { type: Number, required: true, min: 1 },
  unit:           { type: String, default: 'pcs' },
  targetPrice:    Number,
  specifications: String,
}, { _id: true });

const quotationItemSchema = new Schema({
  product:     { type: Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  unitPrice:   { type: Number, required: true },
  quantity:    Number,
  totalAmount: Number,
  leadTime:    Number, // days
  notes:       String,
}, { _id: false });

const vendorQuotationSchema = new Schema({
  vendor:       { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  vendorName:   String,
  status:       { type: String, enum: ['invited', 'viewed', 'responded', 'declined', 'selected'], default: 'invited' },
  items:        [quotationItemSchema],
  totalAmount:  Number,
  leadTime:     Number, // days
  paymentTerms: String,
  deliveryTerms: String,
  validUntil:   Date,
  notes:        String,
  attachments:  [String],
  respondedAt:  Date,
}, { _id: true });

const rfqSchema = new Schema({
  rfqNumber:            { type: String, unique: true },
  title:                { type: String, required: true, trim: true },
  purchaseRequisition:  { type: Schema.Types.ObjectId, ref: 'PurchaseRequisition' },
  items:                [rfqItemSchema],
  vendors:              [vendorQuotationSchema],
  submissionDeadline:   Date,
  deliveryDate:         Date,
  deliveryWarehouse:    { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  terms:                String,
  status:               { type: String, enum: ['draft', 'published', 'closed', 'awarded', 'cancelled'], default: 'draft' },
  selectedVendor:       { type: Schema.Types.ObjectId, ref: 'Vendor' },
  createdBy:            { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdByName:        String,
  publishedAt:          Date,
  closedAt:             Date,
  awardedAt:            Date,
  notes:                String,
  isDeleted:            { type: Boolean, default: false },
}, { timestamps: true });

rfqSchema.index({ status: 1, isDeleted: 1 });
rfqSchema.index({ rfqNumber: 1 });
rfqSchema.index({ purchaseRequisition: 1 });
rfqSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RFQ', rfqSchema);

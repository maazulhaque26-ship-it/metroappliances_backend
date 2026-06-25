const mongoose = require('mongoose');
const { Schema } = mongoose;

const pad = (value, length = 4) => String(value).padStart(length, '0');
const dateStamp = () => {
  const currentDate = new Date();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  return `${currentDate.getFullYear()}${month}${day}`;
};

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
rfqSchema.index({ purchaseRequisition: 1 });
rfqSchema.index({ createdAt: -1 });

rfqSchema.pre('save', async function (next) {
  if (!this.rfqNumber) {
    const prefix = `RFQ-${dateStamp()}-`;
    const count = await this.constructor.countDocuments({ rfqNumber: { $regex: `^${prefix}` } });
    this.rfqNumber = `${prefix}${pad(count + 1)}`;
  }
  next();
});

module.exports = mongoose.model('RFQ', rfqSchema);

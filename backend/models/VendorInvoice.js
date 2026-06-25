const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// Vendor Invoice — vendor's own invoice document (source for VendorBill creation)
const vendorInvoiceSchema = new Schema({
  invoiceNumber:   { type: String, unique: true },  // Our internal ref
  vendorInvoiceNo: { type: String, required: true, trim: true },  // Vendor's own number
  vendor:          { type: ObjectId, ref: 'Vendor', required: true },
  vendorName:      { type: String, trim: true },
  vendorGST:       { type: String, trim: true },
  invoiceDate:     { type: Date, required: true },
  receivedDate:    { type: Date, default: Date.now },
  dueDate:         { type: Date },
  purchaseOrder:   { type: ObjectId, ref: 'PurchaseOrder' },
  grn:             { type: ObjectId, ref: 'GRN' },
  items: [{
    description:   { type: String },
    quantity:      { type: Number, default: 0 },
    unit:          { type: String },
    unitPrice:     { type: Number, default: 0 },
    taxRate:       { type: Number, default: 0 },
    taxAmount:     { type: Number, default: 0 },
    lineTotal:     { type: Number, default: 0 },
    hsnCode:       { type: String },
  }],
  subtotal:        { type: Number, default: 0 },
  gstTotal:        { type: Number, default: 0 },
  totalAmount:     { type: Number, required: true, min: 0 },
  currency:        { type: String, default: 'INR' },
  attachments:     [{ fileName: String, fileUrl: String, uploadedAt: { type: Date, default: Date.now } }],
  status:          { type: String, enum: ['received','verified','converted','rejected','duplicate'], default: 'received' },
  vendorBill:      { type: ObjectId, ref: 'VendorBill' },  // Set when converted
  convertedAt:     { type: Date },
  convertedBy:     { type: ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  notes:           { type: String },
  createdBy:       { type: ObjectId, ref: 'User' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

vendorInvoiceSchema.index({ vendor: 1, invoiceDate: -1 });
vendorInvoiceSchema.index({ status: 1, isDeleted: 1 });
vendorInvoiceSchema.index({ vendorInvoiceNo: 1, vendor: 1 });
vendorInvoiceSchema.index({ purchaseOrder: 1 });

vendorInvoiceSchema.pre('validate', async function (next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const prefix = `VI-${year}-`;
    const count = await this.constructor.countDocuments({ invoiceNumber: { $regex: `^VI-${year}-` } });
    this.invoiceNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('VendorInvoice', vendorInvoiceSchema);

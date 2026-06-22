const mongoose = require('mongoose');

const challanItemSchema = new mongoose.Schema({
  srNo:          { type: Number },
  description:   { type: String, required: true },
  hsnCode:       { type: String },
  quantity:      { type: Number, required: true },
  unit:          { type: String, default: 'Nos' },
  unitPrice:     { type: Number, default: 0 },
  amount:        { type: Number, default: 0 },
  taxRate:       { type: Number, default: 0 },
  taxAmount:     { type: Number, default: 0 },
  totalAmount:   { type: Number, default: 0 },
}, { _id: false });

const deliveryChallanSchema = new mongoose.Schema({
  challanNumber:   { type: String, unique: true },
  challanDate:     { type: Date, default: Date.now },
  dispatch:        { type: mongoose.Schema.Types.ObjectId, ref: 'Dispatch' },
  shipment:        { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },

  // Supplier/Consignor (our company)
  supplierGSTIN:   { type: String },
  supplierName:    { type: String },
  supplierAddress: { type: String },
  supplierPhone:   { type: String },

  // Consignee
  consigneeName:   { type: String, required: true },
  consigneeGSTIN:  { type: String },
  consigneeAddress:{ type: String },
  consigneePhone:  { type: String },

  // Dispatch info
  dispatchThrough: { type: String }, // courier name
  vehicleNo:       { type: String },
  destination:     { type: String },

  // Items
  items:           [challanItemSchema],

  // Totals
  subtotal:        { type: Number, default: 0 },
  totalTax:        { type: Number, default: 0 },
  totalAmount:     { type: Number, default: 0 },
  amountInWords:   { type: String },

  // Purpose
  purpose:         { type: String, enum: ['sale','job_work','transfer','return','exhibition','other'], default: 'sale' },
  remarks:         { type: String },

  status:          { type: String, enum: ['draft','generated','delivered'], default: 'draft' },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

deliveryChallanSchema.pre('save', async function (next) {
  if (!this.challanNumber) {
    const d   = new Date();
    const pad = n => String(n).padStart(2, '0');
    const ds  = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const count = await mongoose.model('DeliveryChallan').countDocuments({ challanNumber: { $regex: `^DC-${ds}` } });
    this.challanNumber = `DC-${ds}-${String(count + 1).padStart(4, '0')}`;
  }
  // Auto-number items
  if (this.items?.length) {
    this.items.forEach((item, i) => { item.srNo = i + 1; });
  }
  next();
});

deliveryChallanSchema.index({ dispatch: 1 });
deliveryChallanSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DeliveryChallan', deliveryChallanSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const pad = (value, length = 4) => String(value).padStart(length, '0');
const dateStamp = () => {
  const currentDate = new Date();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  return `${currentDate.getFullYear()}${month}${day}`;
};

const buildApprovalChain = () => [
  { step: 1, role: 'purchase_manager', status: 'pending' },
  { step: 2, role: 'finance', status: 'pending' },
  { step: 3, role: 'admin', status: 'pending' },
];

const poItemSchema = new Schema({
  product:              { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:          { type: String, required: true },
  productCode:          String,
  quantity:             { type: Number, required: true, min: 1 },
  receivedQty:          { type: Number, default: 0 },
  unit:                 { type: String, default: 'pcs' },
  unitPrice:            { type: Number, required: true },
  taxRate:              { type: Number, default: 0 },
  taxAmount:            { type: Number, default: 0 },
  discount:             { type: Number, default: 0 },
  totalAmount:          { type: Number, required: true },
  warehouse:            { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  storageLocation:      { type: Schema.Types.ObjectId, ref: 'StorageLocation' },
  expectedDeliveryDate: Date,
  notes:                String,
}, { _id: true });

const poApprovalStepSchema = new Schema({
  step:         { type: Number, required: true },
  role:         { type: String, enum: ['purchase_manager', 'finance', 'admin'], required: true },
  approver:     { type: Schema.Types.ObjectId, ref: 'User' },
  approverName: String,
  status:       { type: String, enum: ['pending', 'approved', 'rejected', 'skipped'], default: 'pending' },
  comments:     String,
  actedAt:      Date,
}, { _id: false });

const purchaseOrderSchema = new Schema({
  poNumber:              { type: String, unique: true },
  vendor:                { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  vendorName:            String,
  rfq:                   { type: Schema.Types.ObjectId, ref: 'RFQ' },
  purchaseRequisition:   { type: Schema.Types.ObjectId, ref: 'PurchaseRequisition' },
  items:                 [poItemSchema],
  subtotal:              { type: Number, default: 0 },
  taxAmount:             { type: Number, default: 0 },
  discount:              { type: Number, default: 0 },
  totalAmount:           { type: Number, default: 0 },
  currency:              { type: String, default: 'INR' },
  paymentTerms:          String,
  deliveryTerms:         String,
  deliveryWarehouse:     { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  expectedDeliveryDate:  Date,
  actualDeliveryDate:    Date,
  status:                { type: String, enum: ['draft', 'pending_approval', 'approved', 'released', 'sent', 'acknowledged', 'supplier_accepted', 'supplier_rejected', 'partially_delivered', 'completed', 'cancelled'], default: 'draft' },
  currentApprovalStep:   { type: Number, default: 0 },
  approvalSteps:         [poApprovalStepSchema],
  createdBy:             { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdByName:         String,
  approvedBy:            { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt:            Date,
  releasedAt:            Date,
  sentAt:                Date,
  acknowledgedAt:        Date,
  supplierNotes:         String,
  grn:                   { type: Schema.Types.ObjectId, ref: 'GRN' },
  cancelReason:          String,
  isDeleted:             { type: Boolean, default: false },
}, { timestamps: true });

purchaseOrderSchema.index({ vendor: 1, isDeleted: 1 });
purchaseOrderSchema.index({ status: 1, isDeleted: 1 });
purchaseOrderSchema.index({ vendor: 1, status: 1, createdAt: -1 });
purchaseOrderSchema.index({ createdAt: -1 });

purchaseOrderSchema.pre('save', async function (next) {
  if (!this.poNumber) {
    const prefix = `PO-${dateStamp()}-`;
    const count = await this.constructor.countDocuments({ poNumber: { $regex: `^${prefix}` } });
    this.poNumber = `${prefix}${pad(count + 1)}`;
  }

  if (!this.approvalSteps?.length) {
    this.approvalSteps = buildApprovalChain();
  }

  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);

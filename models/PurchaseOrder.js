const mongoose = require('mongoose');
const { Schema } = mongoose;

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
purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ vendor: 1, status: 1, createdAt: -1 });
purchaseOrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);

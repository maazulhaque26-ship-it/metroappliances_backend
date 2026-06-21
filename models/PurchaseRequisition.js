const mongoose = require('mongoose');
const { Schema } = mongoose;

const prItemSchema = new Schema({
  product:         { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:     { type: String, required: true },
  productCode:     String,
  quantity:        { type: Number, required: true, min: 1 },
  unit:            { type: String, default: 'pcs' },
  estimatedCost:   { type: Number, default: 0 },
  totalEstimated:  { type: Number, default: 0 },
  preferredVendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  warehouse:       { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  notes:           String,
}, { _id: true });

const approvalStepSchema = new Schema({
  step:         { type: Number, required: true },
  role:         { type: String, enum: ['purchase_manager', 'finance', 'admin'], required: true },
  approver:     { type: Schema.Types.ObjectId, ref: 'User' },
  approverName: String,
  status:       { type: String, enum: ['pending', 'approved', 'rejected', 'skipped'], default: 'pending' },
  comments:     String,
  actedAt:      Date,
}, { _id: false });

const purchaseRequisitionSchema = new Schema({
  prNumber:            { type: String, unique: true },
  title:               { type: String, required: true, trim: true },
  requestedBy:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
  requestedByName:     String,
  department:          String,
  items:               [prItemSchema],
  totalEstimatedCost:  { type: Number, default: 0 },
  priority:            { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  requiredByDate:      Date,
  justification:       String,
  status:              { type: String, enum: ['draft', 'submitted', 'manager_review', 'finance_review', 'approved', 'rejected', 'converted', 'cancelled'], default: 'draft' },
  currentApprovalStep: { type: Number, default: 0 },
  approvalSteps:       [approvalStepSchema],
  purchaseOrder:       { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  rejectionReason:     String,
  notes:               String,
  isDeleted:           { type: Boolean, default: false },
}, { timestamps: true });

purchaseRequisitionSchema.index({ status: 1, isDeleted: 1 });
purchaseRequisitionSchema.index({ requestedBy: 1, isDeleted: 1 });
purchaseRequisitionSchema.index({ prNumber: 1 });
purchaseRequisitionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PurchaseRequisition', purchaseRequisitionSchema);

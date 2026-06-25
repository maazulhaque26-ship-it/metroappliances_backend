const mongoose = require('mongoose');
const { Schema } = mongoose;

const SERVICE_STATUSES = [
  'open',               // complaint raised
  'verified',           // details verified by admin/call center
  'warranty_check',     // warranty being validated
  'assigned',           // technician assigned
  'accepted',           // technician accepted job
  'travelling',         // technician en route
  'reached',            // technician on site
  'diagnosis',          // diagnosing the issue
  'repair',             // repair in progress
  'testing',            // post-repair testing
  'awaiting_confirmation', // waiting for customer sign-off
  'completed',          // job done
  'closed',             // ticket closed after feedback
  'escalated',          // escalated to senior/management
  'cancelled',          // cancelled by customer or admin
  'reopened',           // reopened after closure
];

const attachmentSchema = new Schema({
  url:         { type: String, required: true },
  type:        { type: String, enum: ['image', 'video', 'document', 'invoice'], default: 'image' },
  filename:    { type: String },
  uploadedBy:  { type: String, enum: ['customer', 'technician', 'admin'], default: 'customer' },
  uploadedAt:  { type: Date, default: Date.now },
}, { _id: true });

const historySchema = new Schema({
  status:     { type: String },
  note:       { type: String },
  changedBy:  { type: Schema.Types.ObjectId },
  changedByModel: { type: String, enum: ['User', 'Technician', 'Admin'] },
  changedAt:  { type: Date, default: Date.now },
}, { _id: true });

const commentSchema = new Schema({
  text:       { type: String, required: true },
  author:     { type: Schema.Types.ObjectId },
  authorModel:{ type: String, enum: ['User', 'Technician', 'Admin'] },
  authorName: { type: String },
  isInternal: { type: Boolean, default: false },
}, { timestamps: true });

const partsUsedSchema = new Schema({
  sparePartId: { type: Schema.Types.ObjectId, ref: 'SparePart' },
  partNumber:  { type: String },
  name:        { type: String },
  quantity:    { type: Number, default: 1 },
  unitPrice:   { type: Number, default: 0 },
}, { _id: false });

const serviceRequestSchema = new Schema({
  ticketNumber: { type: String, unique: true },

  customer:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product:      { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:  { type: String },
  serialNumber: { type: String, trim: true },
  invoiceNumber:{ type: String, trim: true },
  orderRef:     { type: Schema.Types.ObjectId, ref: 'Order' },

  category:     { type: String, required: true },
  description:  { type: String, required: true },
  priority:     { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status:       { type: String, enum: SERVICE_STATUSES, default: 'open' },

  assignedTechnician: { type: Schema.Types.ObjectId, ref: 'Technician' },
  scheduledAt:        { type: Date },

  serviceAddress: {
    line1:    { type: String },
    line2:    { type: String },
    city:     { type: String },
    state:    { type: String },
    pincode:  { type: String },
    phone:    { type: String },
  },

  warrantyId:   { type: Schema.Types.ObjectId, ref: 'WarrantyCard' },
  amcId:        { type: Schema.Types.ObjectId, ref: 'AMCContract' },
  isUnderWarranty: { type: Boolean, default: false },
  isUnderAMC:      { type: Boolean, default: false },

  sla: {
    responseHours:    { type: Number, default: 24 },
    resolutionHours:  { type: Number, default: 72 },
    respondBy:        { type: Date },
    resolveBy:        { type: Date },
    isBreached:       { type: Boolean, default: false },
  },

  escalation: {
    isEscalated:  { type: Boolean, default: false },
    escalatedAt:  { type: Date },
    reason:       { type: String },
    escalatedTo:  { type: Schema.Types.ObjectId, ref: 'User' },
    level:        { type: Number, default: 0 },
  },

  diagnosis:    { type: String },
  resolution:   { type: String },
  partsUsed:    [partsUsedSchema],
  laborCharge:  { type: Number, default: 0 },
  totalCharge:  { type: Number, default: 0 },

  customerSignature: { type: String },
  customerRating:    { type: Number, min: 1, max: 5 },
  customerFeedback:  { type: String },
  closedAt:          { type: Date },

  attachments:  [attachmentSchema],
  history:      [historySchema],
  comments:     [commentSchema],

  technicianPhotos: [{ type: String }],

  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate ticket number
serviceRequestSchema.pre('save', async function (next) {
  if (this.isNew && !this.ticketNumber) {
    const count = await mongoose.model('ServiceRequest').countDocuments();
    const year = new Date().getFullYear();
    this.ticketNumber = `SR-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

serviceRequestSchema.index({ customer: 1, createdAt: -1 });
serviceRequestSchema.index({ status: 1, priority: 1 });
serviceRequestSchema.index({ assignedTechnician: 1, status: 1 });
serviceRequestSchema.index({ createdAt: -1 });
serviceRequestSchema.index({ 'sla.resolveBy': 1, status: 1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);

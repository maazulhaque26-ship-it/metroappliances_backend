'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const INSTALLATION_STATUSES = [
  'pending',
  'confirmed',
  'assigned',
  'travelling',
  'arrived',
  'in_progress',
  'demo_in_progress',
  'completed',
  'cancelled',
  'rescheduled',
];

const checklistItemSchema = new Schema({
  item:        { type: String, required: true },
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date },
  note:        { type: String },
}, { _id: true });

const engineerPhotoSchema = new Schema({
  url:        { type: String, required: true },
  caption:    { type: String },
  type:       { type: String, enum: ['before', 'after', 'general'], default: 'general' },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const historySchema = new Schema({
  status:     { type: String },
  note:       { type: String },
  changedBy:  { type: Schema.Types.ObjectId },
  changedByModel: { type: String, enum: ['User', 'InstallationEngineer', 'Admin'] },
  changedAt:  { type: Date, default: Date.now },
}, { _id: true });

const installationRequestSchema = new Schema({
  requestNumber:  { type: String, unique: true },

  customer:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product:        { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:    { type: String, required: true },
  registrationId: { type: Schema.Types.ObjectId, ref: 'ProductRegistration' },
  serialNumber:   { type: String },
  category:       { type: String, required: true },

  serviceType: {
    type: String,
    enum: ['installation', 'demo', 'inspection', 'repair_followup'],
    default: 'installation',
  },
  status:   { type: String, enum: INSTALLATION_STATUSES, default: 'pending' },
  priority: { type: String, enum: ['normal', 'urgent', 'vip'], default: 'normal' },

  installationAddress: {
    line1:    { type: String },
    city:     { type: String, required: true },
    state:    { type: String, required: true },
    pincode:  { type: String, required: true },
    phone:    { type: String },
    landmark: { type: String },
  },
  preferredDate: { type: Date, required: true },
  preferredSlot: { type: String, enum: ['morning', 'afternoon', 'evening'], default: 'morning' },
  specialInstructions: { type: String },
  locationPhotos: [String],

  assignedEngineer: { type: Schema.Types.ObjectId, ref: 'InstallationEngineer' },
  dispatchScore:    { type: Number },
  scheduledAt:      { type: Date },
  startedAt:        { type: Date },
  completedAt:      { type: Date },

  checklist:       [checklistItemSchema],
  engineerPhotos:  [engineerPhotoSchema],
  customerSignature: { type: String },

  demoNotes:     { type: String },
  demoVideoUrl:  { type: String },
  demoCompleted: { type: Boolean, default: false },

  warrantyActivated: { type: Boolean, default: false },
  warrantyId:        { type: Schema.Types.ObjectId, ref: 'WarrantyCard' },

  customerRating:   { type: Number, min: 1, max: 5 },
  customerFeedback: { type: String },
  totalDuration:    { type: Number },

  history:   [historySchema],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate request number IR-YYYY-NNNNN
installationRequestSchema.pre('save', async function (next) {
  if (this.requestNumber) return next();
  const year   = new Date().getFullYear();
  const prefix = `IR-${year}-`;
  const last   = await this.constructor.findOne(
    { requestNumber: { $regex: `^${prefix}` } },
    {},
    { sort: { requestNumber: -1 } }
  );
  const seq = last ? parseInt(last.requestNumber.split('-')[2]) + 1 : 1;
  this.requestNumber = `${prefix}${String(seq).padStart(5, '0')}`;
  next();
});

// Default 10-item checklist for new installation requests
installationRequestSchema.pre('save', function (next) {
  if (this.isNew && this.checklist.length === 0 && this.serviceType === 'installation') {
    this.checklist = [
      'Product unpacked and inspected',
      'All accessories verified',
      'Power connection tested',
      'Water/drainage connection (if applicable)',
      'Gas connection (if applicable)',
      'Wall mounting / positioning done',
      'Level and alignment verified',
      'Safety check completed',
      'Product demo given to customer',
      'Warranty activation confirmed',
    ].map(item => ({ item, completed: false }));
  }
  next();
});

installationRequestSchema.index({ customer: 1, isDeleted: 1 });
installationRequestSchema.index({ assignedEngineer: 1, status: 1 });
installationRequestSchema.index({ preferredDate: 1 });
installationRequestSchema.index({ status: 1 });

module.exports = mongoose.model('InstallationRequest', installationRequestSchema);

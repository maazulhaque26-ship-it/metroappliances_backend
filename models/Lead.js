const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  text:      { type: String, required: true },
  addedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'SalesAgent' },
  addedAt:   { type: Date, default: Date.now },
}, { _id: true });

const leadSchema = new mongoose.Schema({
  leadNumber: { type: String, unique: true },

  // Contact info (prospect, may not be a Dealer yet)
  businessName:   { type: String, required: true, trim: true },
  contactPerson:  { type: String, trim: true },
  phone:          { type: String, trim: true },
  email:          { type: String, trim: true, lowercase: true },
  city:           { type: String },
  state:          { type: String },
  pincode:        { type: String },
  address:        { type: String },
  gstin:          { type: String },

  // If lead converts to a dealer
  convertedDealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' },

  // Assignment
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesAgent', required: true },
  territory:     { type: mongoose.Schema.Types.ObjectId, ref: 'Territory' },

  // Pipeline stage
  stage: {
    type: String,
    enum: ['prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
    default: 'prospect',
  },
  lostReason: { type: String },

  // Potential value
  estimatedValue: { type: Number, default: 0 },
  currency:       { type: String, default: 'INR' },

  // Interest in products/categories
  interestedIn:   [{ type: String }],

  // Source
  source: {
    type: String,
    enum: ['cold_call', 'referral', 'walk_in', 'online', 'exhibition', 'agent_visit', 'other'],
    default: 'cold_call',
  },

  // Priority
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },

  // Follow-up
  nextFollowUpDate: { type: Date },
  lastContactDate:  { type: Date },

  // Notes & documents
  notes:     [noteSchema],
  documents: [{
    name: String,
    url:  String,
    uploadedAt: { type: Date, default: Date.now },
  }],

  // Stage history
  stageHistory: [{
    stage:    String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesAgent' },
    note:     String,
  }],

  isActive:  { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

leadSchema.pre('save', async function (next) {
  if (this.isNew && !this.leadNumber) {
    const now   = new Date();
    const ym    = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await mongoose.model('Lead').countDocuments();
    this.leadNumber = `LD-${ym}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Sprint 9F: Indexes for common query patterns
leadSchema.index({ assignedAgent: 1, isDeleted: 1 });
leadSchema.index({ territory:     1, isDeleted: 1 });
leadSchema.index({ stage:         1, isDeleted: 1 });
leadSchema.index({ createdAt:    -1 });
leadSchema.index({ nextFollowUpDate: 1, isDeleted: 1 });
leadSchema.index({ 'stage': 1, 'assignedAgent': 1, isDeleted: 1 });

module.exports = mongoose.model('Lead', leadSchema);

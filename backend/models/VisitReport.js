const mongoose = require('mongoose');

const visitReportSchema = new mongoose.Schema({
  visitNumber: { type: String, unique: true },

  agent:  { type: mongoose.Schema.Types.ObjectId, ref: 'SalesAgent', required: true },
  dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  lead:   { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },

  // Check-in / Check-out
  checkInTime:  { type: Date },
  checkOutTime: { type: Date },
  durationMinutes: { type: Number },

  // GPS placeholder
  checkInLocation:  { lat: Number, lng: Number, address: String },
  checkOutLocation: { lat: Number, lng: Number, address: String },

  // Visit details
  purpose:       { type: String, enum: ['sales_call', 'collection', 'support', 'relationship', 'order_delivery', 'other'], default: 'sales_call' },
  personMet:     { type: String },
  visitNotes:    { type: String },
  outcome:       { type: String, enum: ['positive', 'neutral', 'negative', 'no_contact'], default: 'neutral' },
  outcomeNotes:  { type: String },

  // Follow-up planning
  nextVisitDate: { type: Date },
  nextVisitPurpose: { type: String },

  // Orders discussed / placed
  ordersDiscussed:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'DealerOrder' }],
  estimatedOrderValue: { type: Number, default: 0 },

  // Photos
  photos: [{
    url:  String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now },
  }],

  // Status
  status: { type: String, enum: ['planned', 'checked_in', 'completed', 'cancelled'], default: 'planned' },

  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

visitReportSchema.pre('save', async function (next) {
  if (this.isNew && !this.visitNumber) {
    const now   = new Date();
    const ym    = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await mongoose.model('VisitReport').countDocuments();
    this.visitNumber = `VR-${ym}-${String(count + 1).padStart(5, '0')}`;
  }
  if (this.checkInTime && this.checkOutTime) {
    this.durationMinutes = Math.round((this.checkOutTime - this.checkInTime) / 60000);
  }
  next();
});

// Sprint 9F: Indexes
visitReportSchema.index({ agent:  1, createdAt: -1 });
visitReportSchema.index({ dealer: 1, createdAt: -1 });
visitReportSchema.index({ lead:   1 });
visitReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('VisitReport', visitReportSchema);

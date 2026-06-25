const mongoose = require('mongoose');

const territorySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, unique: true, uppercase: true, trim: true },
  description: { type: String },

  // Geographic coverage
  states:    [{ type: String }],
  cities:    [{ type: String }],
  districts: [{ type: String }],
  pincodes:  [{ type: String }],

  // Assigned agents (one primary, multiple secondary)
  primaryAgent:    { type: mongoose.Schema.Types.ObjectId, ref: 'SalesAgent' },
  assignedAgents:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'SalesAgent' }],

  // Assigned dealers in this territory
  assignedDealers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' }],

  isActive:  { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  notes:     { type: String },
}, { timestamps: true });

// Auto-generate code: TER-YYYYMM-XXXXX
territorySchema.pre('save', async function (next) {
  if (this.isNew && !this.code) {
    const now   = new Date();
    const ym    = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await mongoose.model('Territory').countDocuments();
    this.code = `TER-${ym}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Sprint 9F: Indexes
territorySchema.index({ isActive: 1, isDeleted: 1 });
territorySchema.index({ primaryAgent: 1 });

module.exports = mongoose.model('Territory', territorySchema);

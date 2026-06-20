const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const salesAgentSchema = new mongoose.Schema({
  agentCode: {
    type:   String,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:    { type: String, required: true, trim: true },
  password: { type: String, required: true, select: false },

  // Territory & hierarchy
  territory:   { type: mongoose.Schema.Types.ObjectId, ref: 'Territory' },
  manager:     { type: mongoose.Schema.Types.ObjectId, ref: 'SalesAgent' },
  reportingTo: { type: String, trim: true },

  // Permissions (granular)
  permissions: {
    canCreateLeads:   { type: Boolean, default: true },
    canEditLeads:     { type: Boolean, default: true },
    canViewAllLeads:  { type: Boolean, default: false },
    canCreateVisits:  { type: Boolean, default: true },
    canManageTasks:   { type: Boolean, default: true },
  },

  // Status
  status:    { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  isActive:  { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },

  // Profile
  photo:       { type: String },
  address:     { type: String },
  city:        { type: String },
  state:       { type: String },
  pincode:     { type: String },
  joiningDate: { type: Date, default: Date.now },
  notes:       { type: String },

  // Performance snapshot (updated periodically)
  totalLeads:   { type: Number, default: 0 },
  wonLeads:     { type: Number, default: 0 },
  totalVisits:  { type: Number, default: 0 },
  totalDealers: { type: Number, default: 0 },

  // Reset token
  resetPasswordToken:   { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

// Auto-generate agentCode: SA-YYYYMM-XXXXX
salesAgentSchema.pre('save', async function (next) {
  if (this.isNew && !this.agentCode) {
    const now    = new Date();
    const ym     = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count  = await mongoose.model('SalesAgent').countDocuments();
    this.agentCode = `SA-${ym}-${String(count + 1).padStart(5, '0')}`;
  }
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

salesAgentSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Sprint 9F: Indexes
salesAgentSchema.index({ status:    1, isDeleted: 1 });
salesAgentSchema.index({ territory: 1, isDeleted: 1 });
salesAgentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SalesAgent', salesAgentSchema);

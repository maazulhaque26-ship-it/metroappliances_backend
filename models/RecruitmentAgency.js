const mongoose = require('mongoose');
const { Schema } = mongoose;

const recruitmentAgencySchema = new Schema(
  {
    agencyCode: { type: String, unique: true },
    name: { type: String, required: true },
    contactPerson: { type: String },
    email: { type: String },
    phone: { type: String },
    website: { type: String },
    specialization: [{ type: String }],
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    commissionRate: { type: Number },
    contractStartDate: { type: Date },
    contractEndDate: { type: Date },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    rating: { type: Number, min: 1, max: 5 },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

recruitmentAgencySchema.index({ status: 1, isDeleted: 1 });

recruitmentAgencySchema.pre('validate', async function (next) {
  if (!this.agencyCode) {
    const count = await mongoose.model('RecruitmentAgency').countDocuments();
    this.agencyCode = `AGY-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('RecruitmentAgency', recruitmentAgencySchema);

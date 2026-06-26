const mongoose = require('mongoose');
const { Schema } = mongoose;

const recruitmentSettingSchema = new Schema(
  {
    singleton: { type: String, default: 'default', unique: true },
    defaultPipeline: { type: Schema.Types.ObjectId, ref: 'RecruitmentPipeline' },
    bgvVendor: { type: String },
    offerValidityDays: { type: Number, default: 7 },
    slaScreeningDays: { type: Number, default: 3 },
    slaInterviewDays: { type: Number, default: 7 },
    slaOfferDays: { type: Number, default: 2 },
    autoRejectDays: { type: Number, default: 30 },
    emailNotifications: { type: Boolean, default: true },
    interviewReminderHours: { type: Number, default: 24 },
    requireBGV: { type: Boolean, default: true },
    requireOnboarding: { type: Boolean, default: true },
    offerApprovalLevels: { type: Number, default: 1 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecruitmentSetting', recruitmentSettingSchema);

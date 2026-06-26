const mongoose = require('mongoose');
const { Schema } = mongoose;

const employeeSelfServiceSettingSchema = new Schema({
  singleton: { type: String, default: 'default', unique: true },
  allowLeaveApplication: { type: Boolean, default: true },
  allowProfileUpdate: { type: Boolean, default: true },
  allowDocumentUpload: { type: Boolean, default: true },
  allowFeedbackSubmission: { type: Boolean, default: true },
  payslipAccessMonths: { type: Number, default: 12 },
  announcementCategories: [{ type: String }],
  recognitionPointsEnabled: { type: Boolean, default: true },
  goalsVisibleToEmployee: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

employeeSelfServiceSettingSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('EmployeeSelfServiceSetting', employeeSelfServiceSettingSchema);

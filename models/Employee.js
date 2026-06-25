'use strict';
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeCode:    { type: String, unique: true },
  // Personal
  firstName:       { type: String, required: true, trim: true },
  lastName:        { type: String, required: true, trim: true },
  middleName:      { type: String, default: '', trim: true },
  displayName:     { type: String, trim: true },
  dateOfBirth:     { type: Date },
  gender:          { type: String, enum: ['male','female','other','prefer_not_to_say'], default: 'prefer_not_to_say' },
  maritalStatus:   { type: String, enum: ['single','married','divorced','widowed','other'], default: 'single' },
  bloodGroup:      { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown'], default: 'unknown' },
  nationality:     { type: String, default: 'Indian', trim: true },
  religion:        { type: String, default: '', trim: true },
  // Contact
  personalEmail:   { type: String, trim: true, lowercase: true },
  workEmail:       { type: String, trim: true, lowercase: true },
  phone:           { type: String, trim: true },
  mobile:          { type: String, required: true, trim: true },
  // Address
  currentAddress:  { type: String, default: '', trim: true },
  permanentAddress:{ type: String, default: '', trim: true },
  city:            { type: String, default: '', trim: true },
  state:           { type: String, default: '', trim: true },
  country:         { type: String, default: 'India', trim: true },
  pincode:         { type: String, default: '', trim: true },
  // Organization
  department:      { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  designation:     { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  businessUnit:    { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessUnit' },
  costCenter:      { type: mongoose.Schema.Types.ObjectId, ref: 'CostCenter' },
  location:        { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  reportingManager:{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  // Employment
  employmentType:  { type: String, enum: ['full_time','part_time','contract','intern','consultant','temporary'], default: 'full_time' },
  joiningDate:     { type: Date, required: true },
  confirmationDate:{ type: Date },
  probationEndDate:{ type: Date },
  exitDate:        { type: Date },
  exitReason:      { type: String, default: '' },
  // Status
  status:          { type: String, enum: ['active','inactive','probation','on_notice','terminated','resigned','retired','absconded','on_leave'], default: 'probation' },
  // Identifiers
  panNumber:       { type: String, trim: true, uppercase: true },
  aadharNumber:    { type: String, trim: true },
  passportNumber:  { type: String, trim: true, uppercase: true },
  pfAccountNumber: { type: String, trim: true },
  uanNumber:       { type: String, trim: true },
  esiNumber:       { type: String, trim: true },
  // Compensation
  ctc:             { type: Number, default: 0 },
  basicSalary:     { type: Number, default: 0 },
  payrollCycle:    { type: String, enum: ['monthly','weekly','fortnightly'], default: 'monthly' },
  paymentMode:     { type: String, enum: ['bank_transfer','cash','cheque'], default: 'bank_transfer' },
  // Photo
  photo:           { type: String, default: '' },
  // Education (embedded array)
  education: [{
    degree:        String,
    institution:   String,
    year:          Number,
    grade:         String,
  }],
  // Meta
  notes:           { type: String, default: '' },
  tags:            [{ type: String }],
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

employeeSchema.pre('validate', async function (next) {
  if (this.employeeCode) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.employeeCode = `EMP-${year}-${String(count + 1).padStart(5, '0')}`;
  if (!this.displayName) this.displayName = `${this.firstName} ${this.lastName}`.trim();
  next();
});

employeeSchema.index({ employeeCode: 1 });
employeeSchema.index({ status: 1, isDeleted: 1 });
employeeSchema.index({ department: 1, status: 1 });
employeeSchema.index({ reportingManager: 1 });
employeeSchema.index({ joiningDate: -1 });
employeeSchema.index({ workEmail: 1 });
employeeSchema.index({ mobile: 1 });

module.exports = mongoose.model('Employee', employeeSchema);

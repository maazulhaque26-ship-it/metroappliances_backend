const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const certificationSchema = new Schema({
  name:       { type: String, required: true },
  issuer:     { type: String },
  issuedAt:   { type: Date },
  expiresAt:  { type: Date },
  certNumber: { type: String },
}, { _id: false });

const workingHoursSchema = new Schema({
  day:   { type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], required: true },
  start: { type: String, default: '09:00' },
  end:   { type: String, default: '18:00' },
  isOff: { type: Boolean, default: false },
}, { _id: false });

const technicianSchema = new Schema({
  employeeId:     { type: String, required: true, unique: true, trim: true },
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:          { type: String, required: true },
  password:       { type: String, required: true, select: false },

  skills:         [{ type: String, trim: true }],
  experienceYears:{ type: Number, default: 0 },
  certifications: [certificationSchema],

  territory: {
    cities:    [{ type: String }],
    pincodes:  [{ type: String }],
    stateCode: { type: String },
  },

  workingHours:   [workingHoursSchema],

  availability: {
    isAvailable:     { type: Boolean, default: true },
    nextAvailableAt: { type: Date },
    reason:          { type: String },
  },

  gpsLocation: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    updatedAt:   { type: Date },
  },

  currentWorkload: { type: Number, default: 0 },
  maxWorkload:     { type: Number, default: 5 },

  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count:   { type: Number, default: 0 },
    total:   { type: Number, default: 0 },
  },

  status:    { type: String, enum: ['active', 'inactive', 'on_leave', 'suspended'], default: 'active' },
  avatar:    { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

technicianSchema.index({ gpsLocation: '2dsphere' });
technicianSchema.index({ status: 1, 'availability.isAvailable': 1 });
technicianSchema.index({ skills: 1 });
technicianSchema.index({ 'territory.cities': 1 });
technicianSchema.index({ 'territory.pincodes': 1 });

technicianSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

technicianSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('Technician', technicianSchema);

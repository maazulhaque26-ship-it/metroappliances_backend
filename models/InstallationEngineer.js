'use strict';
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { Schema } = mongoose;

const installationEngineerSchema = new Schema({
  employeeId:  { type: String, unique: true, sparse: true },
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:       { type: String, required: true },
  password:    { type: String, required: true, select: false, minlength: 6 },
  avatar:      { type: String },

  skills:         { type: [String], default: [] },
  certifications: { type: [String], default: [] },

  territory: {
    cities:   { type: [String], default: [] },
    pincodes: { type: [String], default: [] },
  },

  isAvailable:     { type: Boolean, default: true },
  currentWorkload: { type: Number, default: 0 },
  maxWorkload:     { type: Number, default: 6 },
  totalInstallations: { type: Number, default: 0 },

  rating: {
    average: { type: Number, default: 0 },
    count:   { type: Number, default: 0 },
  },

  gpsLocation: {
    lat: { type: Number },
    lng: { type: Number },
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'suspended'],
    default: 'active',
  },

  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

installationEngineerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

installationEngineerSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('InstallationEngineer', installationEngineerSchema);

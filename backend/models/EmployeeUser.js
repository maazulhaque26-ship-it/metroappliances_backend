const mongoose = require('mongoose');
const { Schema } = mongoose;

const employeeUserSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', unique: true, required: true },
  email: { type: String, unique: true, lowercase: true, required: true },
  passwordHash: { type: String },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

employeeUserSchema.index({ isActive: 1, isDeleted: 1 });

module.exports = mongoose.model('EmployeeUser', employeeUserSchema);

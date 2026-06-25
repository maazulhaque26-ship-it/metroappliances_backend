const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { Schema } = mongoose;

const supplierUserSchema = new Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, select: false },
  phone:     { type: String, trim: true },
  vendor:    { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  role:      { type: String, enum: ['admin', 'manager', 'viewer'], default: 'manager' },
  status:    { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  lastLogin: Date,
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

supplierUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

supplierUserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

supplierUserSchema.index({ vendor: 1, isDeleted: 1 });
supplierUserSchema.index({ email: 1 });
supplierUserSchema.index({ status: 1 });

module.exports = mongoose.model('SupplierUser', supplierUserSchema);

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const WAREHOUSE_ROLES = ['warehouse_manager', 'supervisor', 'picker', 'packer', 'loader', 'auditor'];

const warehouseUserSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:       { type: String, trim: true },
  password:    { type: String, required: true, minlength: 6, select: false },
  role:        { type: String, enum: WAREHOUSE_ROLES, default: 'picker' },
  warehouse:   { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  employeeId:  { type: String, trim: true },
  status:      { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  lastLogin:   { type: Date },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

warehouseUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

warehouseUserSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

warehouseUserSchema.index({ warehouse: 1, isDeleted: 1 });
warehouseUserSchema.index({ role: 1, isDeleted: 1 });
warehouseUserSchema.index({ status: 1, isDeleted: 1 });
warehouseUserSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WarehouseUser', warehouseUserSchema);

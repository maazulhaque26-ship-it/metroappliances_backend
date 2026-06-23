const mongoose = require('mongoose');

const bankBranchSchema = new mongoose.Schema({
  bank:         { type: mongoose.Schema.Types.ObjectId, ref: 'Bank', required: true },
  branchName:   { type: String, required: true, trim: true },
  branchCode:   { type: String, trim: true },
  ifscCode:     { type: String, trim: true, uppercase: true },
  micrCode:     { type: String, trim: true },
  address:      { type: String, trim: true },
  city:         { type: String, trim: true },
  state:        { type: String, trim: true },
  pinCode:      { type: String, trim: true },
  phone:        { type: String, trim: true },
  email:        { type: String, trim: true, lowercase: true },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

bankBranchSchema.index({ bank: 1, isDeleted: 1 });
bankBranchSchema.index({ ifscCode: 1 });

module.exports = mongoose.model('BankBranch', bankBranchSchema);

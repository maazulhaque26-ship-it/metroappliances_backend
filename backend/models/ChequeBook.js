const mongoose = require('mongoose');

const chequeBookSchema = new mongoose.Schema({
  chequeBookNumber: { type: String, unique: true },
  bankAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  fromChequeNo:     { type: String, required: true, trim: true },
  toChequeNo:       { type: String, required: true, trim: true },
  totalLeaves:      { type: Number, default: 0 },
  usedLeaves:       { type: Number, default: 0 },
  availableLeaves:  { type: Number, default: 0 },
  issuedDate:       { type: Date },
  status:           { type: String, enum: ['active','exhausted','cancelled','lost'], default: 'active' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

chequeBookSchema.pre('validate', async function (next) {
  if (this.chequeBookNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.chequeBookNumber = `CB-${year}-${String(count + 1).padStart(4, '0')}`;
  next();
});

chequeBookSchema.index({ bankAccount: 1, status: 1 });

module.exports = mongoose.model('ChequeBook', chequeBookSchema);

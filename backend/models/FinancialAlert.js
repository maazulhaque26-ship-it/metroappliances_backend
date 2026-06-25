'use strict';
const mongoose = require('mongoose');

const financialAlertSchema = new mongoose.Schema({
  alertCode:        { type: String, unique: true },
  alertType:        { type: String, enum: ['low_cash','budget_overrun','revenue_drop','margin_drop','overdue_receivables','overdue_payables','tax_due','compliance_due','kpi_breach','custom'], required: true },
  severity:         { type: String, enum: ['critical','high','medium','low','info'], default: 'medium' },
  title:            { type: String, required: true, trim: true },
  message:          { type: String, required: true, trim: true },
  entityType:       { type: String, trim: true },
  entityId:         { type: mongoose.Schema.Types.ObjectId },
  threshold:        { type: Number },
  actualValue:      { type: Number },
  currency:         { type: String, default: 'INR', uppercase: true },
  status:           { type: String, enum: ['active','acknowledged','resolved','dismissed'], default: 'active' },
  acknowledgedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt:   { type: Date },
  resolvedAt:       { type: Date },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

financialAlertSchema.pre('validate', async function (next) {
  if (this.alertCode) return next();
  const count = await this.constructor.countDocuments();
  this.alertCode = `FALERT-${String(count + 1).padStart(6, '0')}`;
  next();
});

financialAlertSchema.index({ alertType: 1, status: 1 });
financialAlertSchema.index({ severity: 1, status: 1 });
financialAlertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FinancialAlert', financialAlertSchema);

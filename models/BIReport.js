const mongoose = require('mongoose');
const { Schema } = mongoose;

const biReportSchema = new Schema({
  reportCode:  { type: String, unique: true },
  name:        { type: String, required: true, trim: true },
  reportType:  { type: String, enum: ['board_pack','management_summary','department_scorecard','kpi_report','trend_report','operational','financial','custom'], default: 'custom' },
  description: String,
  modules:     [String],
  period:      String,
  periodType:  { type: String, enum: ['monthly','quarterly','annual','custom'], default: 'monthly' },
  schedule: {
    enabled:    { type: Boolean, default: false },
    frequency:  { type: String, enum: ['daily','weekly','monthly','quarterly'] },
    dayOfMonth: { type: Number, min: 1, max: 31 },
    emailTo:    [String],
    nextRun:    Date,
  },
  lastGenerated:  Date,
  generatedCount: { type: Number, default: 0 },
  owner:          { type: Schema.Types.ObjectId, ref: 'User' },
  isActive:       { type: Boolean, default: true },
  isPublic:       { type: Boolean, default: false },
  config:         Schema.Types.Mixed,
}, { timestamps: true });

biReportSchema.index({ reportType: 1, isActive: 1 });

biReportSchema.pre('validate', async function (next) {
  if (!this.reportCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('BIReport').countDocuments({ reportCode: new RegExp(`^BIR-${y}-`) });
    this.reportCode = `BIR-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('BIReport', biReportSchema);

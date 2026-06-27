const mongoose = require('mongoose');
const { Schema } = mongoose;

const biAlertSchema = new Schema({
  alertCode:       { type: String, unique: true },
  name:            { type: String, required: true, trim: true },
  kpiName:         { type: String, required: true },
  condition:       { type: String, enum: ['above','below','equals','change_pct_up','change_pct_down'], required: true },
  threshold:       { type: Number, required: true },
  comparisonPeriod:{ type: String, default: 'current' },
  severity:        { type: String, enum: ['info','warning','critical'], default: 'warning' },
  notifyVia:       [{ type: String, enum: ['email','socket','notification'] }],
  emailTo:         [String],
  message:         String,
  isActive:        { type: Boolean, default: true },
  lastTriggered:   Date,
  lastValue:       Number,
  triggerCount:    { type: Number, default: 0 },
  owner:           { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

biAlertSchema.index({ kpiName: 1, isActive: 1 });

biAlertSchema.pre('validate', async function (next) {
  if (!this.alertCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('BIAlert').countDocuments({ alertCode: new RegExp(`^BIA-${y}-`) });
    this.alertCode = `BIA-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('BIAlert', biAlertSchema);

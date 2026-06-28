const mongoose = require('mongoose');
const { Schema } = mongoose;

const actionStepSchema = new Schema({
  type:       { type: String, required: true },
  config:     Schema.Types.Mixed,
  order:      { type: Number, default: 0 },
  onFailure:  { type: String, enum: ['stop','continue','retry'], default: 'stop' },
}, { _id: false });

const automationRuleSchema = new Schema({
  ruleCode:    { type: String, unique: true },
  name:        { type: String, required: true, trim: true },
  description: String,
  trigger:     { type: String, enum: ['schedule','event','condition','manual','webhook'], required: true },
  schedule:    String,
  eventType:   String,
  conditions:  Schema.Types.Mixed,
  actions:     [actionStepSchema],
  isActive:    { type: Boolean, default: true },
  module:      String,
  category:    { type: String, enum: ['approval','reminder','notification','escalation','replenishment','maintenance','reporting','custom'], default: 'custom' },
  priority:    { type: String, enum: ['low','medium','high'], default: 'medium' },
  lastRunAt:   Date,
  nextRunAt:   Date,
  runCount:    { type: Number, default: 0 },
  successCount:{ type: Number, default: 0 },
  failureCount:{ type: Number, default: 0 },
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  templateId:  { type: Schema.Types.ObjectId, ref: 'AutomationTemplate' },
}, { timestamps: true });

automationRuleSchema.index({ trigger: 1, isActive: 1 });
automationRuleSchema.index({ category: 1 });

automationRuleSchema.pre('validate', async function (next) {
  if (!this.ruleCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('AutomationRule').countDocuments({ ruleCode: new RegExp(`^AUR-${y}-`) });
    this.ruleCode = `AUR-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AutomationRule', automationRuleSchema);

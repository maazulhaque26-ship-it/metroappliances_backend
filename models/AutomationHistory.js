const mongoose = require('mongoose');
const { Schema } = mongoose;

const automationHistorySchema = new Schema({
  automHistCode: { type: String, unique: true },
  ruleId:        { type: Schema.Types.ObjectId, ref: 'AutomationRule', required: true },
  executionId:   { type: Schema.Types.ObjectId, ref: 'AutomationExecution' },
  event:         { type: String, enum: ['rule_created','rule_updated','rule_activated','rule_deactivated','execution_started','execution_completed','execution_failed','action_completed','action_failed','rule_deleted'], required: true },
  details:       Schema.Types.Mixed,
  performedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  timestamp:     { type: Date, default: Date.now },
}, { timestamps: true });

automationHistorySchema.index({ ruleId: 1, timestamp: -1 });
automationHistorySchema.index({ event: 1 });

automationHistorySchema.pre('validate', async function (next) {
  if (!this.automHistCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('AutomationHistory').countDocuments({ automHistCode: new RegExp(`^AHX-${y}-`) });
    this.automHistCode = `AHX-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AutomationHistory', automationHistorySchema);

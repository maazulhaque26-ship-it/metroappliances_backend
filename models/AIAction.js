const mongoose = require('mongoose');
const { Schema } = mongoose;

const aiActionSchema = new Schema({
  actionCode:  { type: String, unique: true },
  type:        { type: String, enum: ['create_po','replenish_stock','schedule_maintenance','send_reminder','create_alert','escalate','approve','notify','export','custom'], required: true },
  title:       String,
  module:      String,
  status:      { type: String, enum: ['pending','executing','completed','failed','reverted'], default: 'pending' },
  input:       Schema.Types.Mixed,
  result:      Schema.Types.Mixed,
  error:       String,
  executedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  triggeredBy: { type: String, enum: ['user','automation','copilot','schedule'], default: 'copilot' },
  ruleId:      { type: Schema.Types.ObjectId, ref: 'AutomationRule' },
  suggestionId:{ type: Schema.Types.ObjectId, ref: 'AISuggestion' },
  isReversible:{ type: Boolean, default: false },
  executedAt:  Date,
}, { timestamps: true });

aiActionSchema.index({ type: 1, status: 1 });
aiActionSchema.index({ executedAt: -1 });

aiActionSchema.pre('validate', async function (next) {
  if (!this.actionCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('AIAction').countDocuments({ actionCode: new RegExp(`^ACT-${y}-`) });
    this.actionCode = `ACT-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AIAction', aiActionSchema);

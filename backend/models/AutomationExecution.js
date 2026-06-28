const mongoose = require('mongoose');
const { Schema } = mongoose;

const automationExecutionSchema = new Schema({
  execCode:    { type: String, unique: true },
  ruleId:      { type: Schema.Types.ObjectId, ref: 'AutomationRule', required: true },
  status:      { type: String, enum: ['pending','running','completed','failed','skipped','cancelled'], default: 'pending' },
  trigger:     { type: String, enum: ['schedule','event','manual','test'], default: 'manual' },
  input:       Schema.Types.Mixed,
  result:      Schema.Types.Mixed,
  error:       String,
  actionsCompleted: { type: Number, default: 0 },
  actionsFailed:    { type: Number, default: 0 },
  startedAt:   Date,
  completedAt: Date,
  duration:    Number,
  triggeredBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

automationExecutionSchema.index({ ruleId: 1, createdAt: -1 });
automationExecutionSchema.index({ status: 1 });

automationExecutionSchema.pre('validate', async function (next) {
  if (!this.execCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('AutomationExecution').countDocuments({ execCode: new RegExp(`^AEX-${y}-`) });
    this.execCode = `AEX-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AutomationExecution', automationExecutionSchema);

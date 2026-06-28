const mongoose = require('mongoose');
const { Schema } = mongoose;

const aiSuggestionSchema = new Schema({
  suggestionCode: { type: String, unique: true },
  type:     { type: String, enum: ['purchase','replenishment','production_plan','budget_alert','project_risk','maintenance_schedule','customer_followup','vendor_reminder','hr_reminder','finance_alert'], required: true },
  title:    { type: String, required: true },
  description: String,
  module:   String,
  priority: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status:   { type: String, enum: ['pending','accepted','dismissed','applied'], default: 'pending' },
  actionData: Schema.Types.Mixed,
  estimatedImpact: Schema.Types.Mixed,
  confidence: { type: Number, default: 75, min: 0, max: 100 },
  source:   { type: String, enum: ['copilot','anomaly','forecast','rule','manual'], default: 'copilot' },
  expiresAt: Date,
  appliedAt: Date,
  appliedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

aiSuggestionSchema.index({ type: 1, status: 1 });
aiSuggestionSchema.index({ priority: 1, status: 1 });

aiSuggestionSchema.pre('validate', async function (next) {
  if (!this.suggestionCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('AISuggestion').countDocuments({ suggestionCode: new RegExp(`^SGG-${y}-`) });
    this.suggestionCode = `SGG-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AISuggestion', aiSuggestionSchema);

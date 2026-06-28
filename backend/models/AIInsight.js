const mongoose = require('mongoose');
const { Schema } = mongoose;

const aiInsightSchema = new Schema({
  insightCode: { type: String, unique: true },
  type:        { type: String, enum: ['daily_briefing','dept_summary','kpi_digest','monthly_summary','risk_summary','opportunity_summary','anomaly_report','custom'], required: true },
  title:       { type: String, required: true },
  content:     { type: String, required: true },
  summary:     String,
  period:      String,
  module:      String,
  department:  String,
  priority:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  metrics:     Schema.Types.Mixed,
  highlights:  [String],
  risks:       [String],
  opportunities: [String],
  recommendations: [String],
  isRead:      { type: Boolean, default: false },
  readAt:      Date,
  generatedAt: { type: Date, default: Date.now },
  validUntil:  Date,
}, { timestamps: true });

aiInsightSchema.index({ type: 1, generatedAt: -1 });
aiInsightSchema.index({ isRead: 1, priority: 1 });

aiInsightSchema.pre('validate', async function (next) {
  if (!this.insightCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('AIInsight').countDocuments({ insightCode: new RegExp(`^INS-${y}-`) });
    this.insightCode = `INS-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AIInsight', aiInsightSchema);

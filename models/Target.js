const mongoose = require('mongoose');
const { Schema } = mongoose;

const targetSchema = new Schema({
  period:   { type: String, enum: ['monthly', 'quarterly', 'yearly'], required: true },
  year:     { type: Number, required: true },
  month:    { type: Number, min: 1, max: 12 },   // only for monthly
  quarter:  { type: Number, min: 1, max: 4 },    // only for quarterly

  targetType: { type: String, enum: ['overall', 'agent', 'territory'], default: 'overall' },
  agent:      { type: Schema.Types.ObjectId, ref: 'SalesAgent' },
  territory:  { type: Schema.Types.ObjectId, ref: 'Territory' },

  targetRevenue:     { type: Number, default: 0 },
  targetB2BRevenue:  { type: Number, default: 0 },
  targetLeads:       { type: Number, default: 0 },
  targetConversions: { type: Number, default: 0 },
  targetVisits:      { type: Number, default: 0 },

  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Target', targetSchema);

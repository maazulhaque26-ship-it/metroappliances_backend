const mongoose = require('mongoose');
const { Schema } = mongoose;

const goalProgressSchema = new Schema({
  goal: { type: Schema.Types.ObjectId, ref: 'Goal', required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  progressPercent: { type: Number, required: true, min: 0, max: 100 },
  notes: { type: String },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

goalProgressSchema.index({ goal: 1 });

module.exports = mongoose.model('GoalProgress', goalProgressSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const goalCategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  color: { type: String, default: '#6366F1' },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

goalCategorySchema.index({ isActive: 1, isDeleted: 1 });

module.exports = mongoose.model('GoalCategory', goalCategorySchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const aiPromptSchema = new Schema({
  promptCode:  { type: String, unique: true },
  category:    { type: String, enum: ['sales','finance','inventory','production','hr','maintenance','projects','general','executive'], default: 'general' },
  title:       { type: String, required: true, trim: true },
  promptText:  { type: String, required: true },
  description: String,
  module:      String,
  tags:        [String],
  isActive:    { type: Boolean, default: true },
  isBuiltIn:   { type: Boolean, default: false },
  useCount:    { type: Number, default: 0 },
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

aiPromptSchema.index({ category: 1, isActive: 1 });
aiPromptSchema.index({ useCount: -1 });

aiPromptSchema.pre('validate', async function (next) {
  if (!this.promptCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('AIPrompt').countDocuments({ promptCode: new RegExp(`^PRM-${y}-`) });
    this.promptCode = `PRM-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AIPrompt', aiPromptSchema);

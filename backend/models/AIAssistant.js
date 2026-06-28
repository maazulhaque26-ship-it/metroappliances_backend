const mongoose = require('mongoose');
const { Schema } = mongoose;

const aiAssistantSchema = new Schema({
  assistantCode: { type: String, unique: true },
  name:          { type: String, required: true, trim: true },
  description:   String,
  type:          { type: String, enum: ['erp','finance','hr','operations','executive','general'], default: 'general' },
  persona:       String,
  systemPrompt:  String,
  capabilities:  [String],
  isActive:      { type: Boolean, default: true },
  isDefault:     { type: Boolean, default: false },
  config:        Schema.Types.Mixed,
  createdBy:     { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

aiAssistantSchema.index({ type: 1, isActive: 1 });

aiAssistantSchema.pre('validate', async function (next) {
  if (!this.assistantCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('AIAssistant').countDocuments({ assistantCode: new RegExp(`^AST-${y}-`) });
    this.assistantCode = `AST-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AIAssistant', aiAssistantSchema);

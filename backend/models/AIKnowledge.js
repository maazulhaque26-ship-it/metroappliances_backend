const mongoose = require('mongoose');
const { Schema } = mongoose;

const aiKnowledgeSchema = new Schema({
  knowledgeCode: { type: String, unique: true },
  category:   { type: String, enum: ['faq','process','policy','metric','formula','troubleshoot','how_to','general'], default: 'general' },
  question:   { type: String, required: true, trim: true },
  answer:     { type: String, required: true },
  summary:    String,
  module:     String,
  tags:       [String],
  keywords:   [String],
  isVerified: { type: Boolean, default: false },
  isActive:   { type: Boolean, default: true },
  useCount:   { type: Number, default: 0 },
  helpfulness:{ type: Number, default: 0, min: -100, max: 100 },
  createdBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

aiKnowledgeSchema.index({ category: 1, isActive: 1 });
aiKnowledgeSchema.index({ module: 1 });
aiKnowledgeSchema.index({ useCount: -1 });

aiKnowledgeSchema.pre('validate', async function (next) {
  if (!this.knowledgeCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('AIKnowledge').countDocuments({ knowledgeCode: new RegExp(`^KNW-${y}-`) });
    this.knowledgeCode = `KNW-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AIKnowledge', aiKnowledgeSchema);

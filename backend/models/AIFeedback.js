const mongoose = require('mongoose');
const { Schema } = mongoose;

const aiFeedbackSchema = new Schema({
  feedbackCode:   { type: String, unique: true },
  conversationId: { type: Schema.Types.ObjectId, ref: 'AIConversation' },
  insightId:      { type: Schema.Types.ObjectId, ref: 'AIInsight' },
  knowledgeId:    { type: Schema.Types.ObjectId, ref: 'AIKnowledge' },
  rating:         { type: Number, required: true, min: 1, max: 5 },
  thumbs:         { type: String, enum: ['up','down'] },
  comment:        String,
  category:       { type: String, enum: ['accuracy','helpfulness','speed','relevance','other'], default: 'helpfulness' },
  userId:         { type: Schema.Types.ObjectId, ref: 'User' },
  isReviewed:     { type: Boolean, default: false },
}, { timestamps: true });

aiFeedbackSchema.index({ conversationId: 1 });
aiFeedbackSchema.index({ rating: 1 });

aiFeedbackSchema.pre('validate', async function (next) {
  if (!this.feedbackCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('AIFeedback').countDocuments({ feedbackCode: new RegExp(`^FBK-${y}-`) });
    this.feedbackCode = `FBK-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AIFeedback', aiFeedbackSchema);

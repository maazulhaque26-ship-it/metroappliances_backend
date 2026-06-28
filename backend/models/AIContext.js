const mongoose = require('mongoose');
const { Schema } = mongoose;

const aiContextSchema = new Schema({
  contextCode:    { type: String, unique: true },
  conversationId: { type: Schema.Types.ObjectId, ref: 'AIConversation' },
  userId:         { type: Schema.Types.ObjectId, ref: 'User' },
  module:         String,
  intent:         String,
  entities:       Schema.Types.Mixed,
  confidence:     { type: Number, default: 0, min: 0, max: 100 },
  resolvedData:   Schema.Types.Mixed,
  isActive:       { type: Boolean, default: true },
  expiresAt:      Date,
}, { timestamps: true });

aiContextSchema.index({ conversationId: 1 });
aiContextSchema.index({ userId: 1, isActive: 1 });

aiContextSchema.pre('validate', async function (next) {
  if (!this.contextCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('AIContext').countDocuments({ contextCode: new RegExp(`^CTX-${y}-`) });
    this.contextCode = `CTX-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AIContext', aiContextSchema);

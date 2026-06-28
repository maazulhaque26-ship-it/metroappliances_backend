const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
  role:      { type: String, enum: ['user','assistant','system'], required: true },
  content:   { type: String, required: true },
  intent:    String,
  module:    String,
  data:      Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const aiConversationSchema = new Schema({
  convCode:   { type: String, unique: true },
  userId:     { type: Schema.Types.ObjectId, ref: 'User' },
  userType:   { type: String, enum: ['admin','employee','dealer','agent'], default: 'admin' },
  title:      { type: String, default: 'New Conversation' },
  messages:   [messageSchema],
  status:     { type: String, enum: ['active','archived','deleted'], default: 'active' },
  context:    Schema.Types.Mixed,
  assistantId:{ type: Schema.Types.ObjectId, ref: 'AIAssistant' },
  lastActivity: { type: Date, default: Date.now },
}, { timestamps: true });

aiConversationSchema.index({ userId: 1, status: 1 });
aiConversationSchema.index({ lastActivity: -1 });

aiConversationSchema.pre('validate', async function (next) {
  if (!this.convCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('AIConversation').countDocuments({ convCode: new RegExp(`^CNV-${y}-`) });
    this.convCode = `CNV-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AIConversation', aiConversationSchema);

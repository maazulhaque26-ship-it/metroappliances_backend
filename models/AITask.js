const mongoose = require('mongoose');
const { Schema } = mongoose;

const aiTaskSchema = new Schema({
  taskCode:    { type: String, unique: true },
  type:        { type: String, enum: ['query','report','forecast','anomaly_scan','recommendation','briefing','export','automation'], required: true },
  title:       String,
  status:      { type: String, enum: ['pending','running','completed','failed','cancelled'], default: 'pending' },
  priority:    { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
  input:       Schema.Types.Mixed,
  output:      Schema.Types.Mixed,
  error:       String,
  userId:      { type: Schema.Types.ObjectId, ref: 'User' },
  conversationId: { type: Schema.Types.ObjectId, ref: 'AIConversation' },
  startedAt:   Date,
  completedAt: Date,
  progress:    { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });

aiTaskSchema.index({ status: 1, createdAt: -1 });
aiTaskSchema.index({ userId: 1, status: 1 });

aiTaskSchema.pre('validate', async function (next) {
  if (!this.taskCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('AITask').countDocuments({ taskCode: new RegExp(`^TSK-${y}-`) });
    this.taskCode = `TSK-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AITask', aiTaskSchema);

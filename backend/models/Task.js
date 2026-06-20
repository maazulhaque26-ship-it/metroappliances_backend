const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskNumber: { type: String, unique: true },

  agent:      { type: mongoose.Schema.Types.ObjectId, ref: 'SalesAgent', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesAgent' },

  title:       { type: String, required: true, trim: true },
  description: { type: String },
  type:        { type: String, enum: ['daily', 'weekly', 'one_time', 'follow_up', 'collection', 'other'], default: 'daily' },
  priority:    { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },

  // Linked entities
  lead:   { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' },

  dueDate:    { type: Date },
  dueTime:    { type: String },

  // Reminders
  reminders: [{
    remindAt: Date,
    sent:     { type: Boolean, default: false },
  }],

  // Completion
  status:      { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'], default: 'pending' },
  completedAt: { type: Date },
  completionNote: { type: String },

  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

taskSchema.pre('save', async function (next) {
  if (this.isNew && !this.taskNumber) {
    const now   = new Date();
    const ym    = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await mongoose.model('Task').countDocuments();
    this.taskNumber = `TSK-${ym}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Sprint 9F: Indexes
taskSchema.index({ agent: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const actionItemSchema = new Schema({
  item: { type: String },
  dueDate: { type: Date },
  completed: { type: Boolean, default: false },
}, { _id: false });

const oneOnOneMeetingSchema = new Schema({
  meetingNumber: { type: String, unique: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 30 },
  agenda: { type: String },
  notes: { type: String },
  actionItems: [actionItemSchema],
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled',
  },
  nextMeetingDate: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

oneOnOneMeetingSchema.pre('validate', async function (next) {
  if (!this.meetingNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('OneOnOneMeeting').countDocuments();
    this.meetingNumber = `OOM-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

oneOnOneMeetingSchema.index({ employee: 1, isDeleted: 1 });

module.exports = mongoose.model('OneOnOneMeeting', oneOnOneMeetingSchema);

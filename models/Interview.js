const mongoose = require('mongoose');
const { Schema } = mongoose;

const interviewerSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    email: { type: String },
    role: {
      type: String,
      enum: ['primary', 'panel', 'observer'],
      default: 'primary',
    },
  },
  { _id: false }
);

const interviewSchema = new Schema(
  {
    interviewNumber: { type: String, unique: true },
    application: { type: Schema.Types.ObjectId, ref: 'JobApplication', required: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    job: { type: Schema.Types.ObjectId, ref: 'JobOpening', required: true },
    round: { type: Number, default: 1 },
    type: {
      type: String,
      enum: ['screening', 'technical', 'hr', 'final', 'culture_fit', 'assignment', 'other'],
      default: 'screening',
    },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 60 },
    mode: {
      type: String,
      enum: ['in_person', 'video', 'phone'],
      default: 'video',
    },
    location: { type: String },
    meetLink: { type: String },
    interviewers: [interviewerSchema],
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'],
      default: 'scheduled',
    },
    result: {
      type: String,
      enum: ['hire', 'reject', 'hold', 'next_round', 'pending'],
      default: 'pending',
    },
    notes: { type: String },
    rescheduledFrom: { type: Schema.Types.ObjectId, ref: 'Interview' },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelReason: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

interviewSchema.index({ scheduledAt: 1, isDeleted: 1 });
interviewSchema.index({ application: 1 });
// interviewNumber already has unique: true at field level — no separate index needed.

interviewSchema.pre('validate', async function (next) {
  if (!this.interviewNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Interview').countDocuments();
    this.interviewNumber = `INT-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Interview', interviewSchema);

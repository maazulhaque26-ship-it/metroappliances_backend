const mongoose = require('mongoose');
const { Schema } = mongoose;

const panelMemberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    email: { type: String },
    role: {
      type: String,
      enum: ['lead', 'member', 'observer'],
      default: 'member',
    },
    expertise: [{ type: String }],
  },
  { _id: false }
);

const interviewPanelSchema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'JobOpening', required: true },
    name: { type: String },
    members: [panelMemberSchema],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

interviewPanelSchema.index({ job: 1, isDeleted: 1 });

module.exports = mongoose.model('InterviewPanel', interviewPanelSchema);

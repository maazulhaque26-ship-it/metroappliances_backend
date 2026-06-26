const mongoose = require('mongoose');
const { Schema } = mongoose;

const recruitmentStageSchema = new Schema(
  {
    name: { type: String, required: true },
    order: { type: Number, required: true },
    stageType: {
      type: String,
      enum: ['screening', 'interview', 'assessment', 'offer', 'onboarding', 'other'],
      default: 'other',
    },
    color: { type: String, default: '#6366F1' },
    actions: [{ type: String }],
    isTerminal: { type: Boolean, default: false },
    pipeline: { type: Schema.Types.ObjectId, ref: 'RecruitmentPipeline' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

recruitmentStageSchema.index({ pipeline: 1, order: 1 });

module.exports = mongoose.model('RecruitmentStage', recruitmentStageSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const recruitmentPipelineSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    stages: [{ type: Schema.Types.ObjectId, ref: 'RecruitmentStage' }],
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecruitmentPipeline', recruitmentPipelineSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const talentPoolSchema = new Schema(
  {
    poolCode: { type: String, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    skillTags: [{ type: String }],
    candidates: [{ type: Schema.Types.ObjectId, ref: 'Candidate' }],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

talentPoolSchema.index({ isActive: 1, isDeleted: 1 });

talentPoolSchema.pre('validate', async function (next) {
  if (!this.poolCode) {
    const count = await mongoose.model('TalentPool').countDocuments();
    this.poolCode = `TLP-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('TalentPool', talentPoolSchema);

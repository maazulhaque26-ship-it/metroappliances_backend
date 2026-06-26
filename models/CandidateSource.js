const mongoose = require('mongoose');
const { Schema } = mongoose;

const candidateSourceSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: [
        'job_portal',
        'referral',
        'walk_in',
        'agency',
        'social_media',
        'campus',
        'internal',
        'direct',
        'other',
      ],
      default: 'other',
    },
    description: { type: String },
    costPerHire: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CandidateSource', candidateSourceSchema);

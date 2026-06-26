const mongoose = require('mongoose');
const { Schema } = mongoose;

const candidateDocumentSchema = new Schema(
  {
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    docType: {
      type: String,
      enum: [
        'resume',
        'cover_letter',
        'certificate',
        'id_proof',
        'address_proof',
        'photograph',
        'portfolio',
        'nda',
        'other',
      ],
      default: 'resume',
    },
    fileName: { type: String },
    fileUrl: { type: String },
    fileSize: { type: Number },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

candidateDocumentSchema.index({ candidate: 1, isDeleted: 1 });

module.exports = mongoose.model('CandidateDocument', candidateDocumentSchema);

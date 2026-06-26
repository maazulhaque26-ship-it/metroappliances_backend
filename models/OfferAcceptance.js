const mongoose = require('mongoose');
const { Schema } = mongoose;

const offerAcceptanceSchema = new Schema(
  {
    offerLetter: { type: Schema.Types.ObjectId, ref: 'OfferLetter', required: true, unique: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    decision: {
      type: String,
      enum: ['accepted', 'rejected', 'countered'],
      required: true,
    },
    joiningDate: { type: Date },
    counterCTC: { type: Number },
    reason: { type: String },
    acceptedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Note: offerLetter already has unique: true at field level — no separate index needed.

module.exports = mongoose.model('OfferAcceptance', offerAcceptanceSchema);

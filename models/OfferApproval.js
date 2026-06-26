const mongoose = require('mongoose');
const { Schema } = mongoose;

const offerApprovalSchema = new Schema(
  {
    offerLetter: { type: Schema.Types.ObjectId, ref: 'OfferLetter', required: true },
    level: { type: Number, required: true },
    approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    comments: { type: String },
    actionAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

offerApprovalSchema.index({ offerLetter: 1, level: 1 });

module.exports = mongoose.model('OfferApproval', offerApprovalSchema);

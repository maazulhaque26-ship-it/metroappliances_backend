const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  agent:     { type: mongoose.Schema.Types.ObjectId, ref: 'SalesAgent', required: true },
  dealer:    { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  territory: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory' },

  status: {
    type: String,
    enum: ['active', 'inactive', 'transferred'],
    default: 'active',
  },

  assignedAt:    { type: Date, default: Date.now },
  assignedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'SalesAgent' },
  transferredAt: { type: Date },
  transferredTo: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesAgent' },
  transferNote:  { type: String },

  notes: { type: String },
}, { timestamps: true });

// One active assignment per dealer at a time
assignmentSchema.index({ dealer: 1, status: 1 });
assignmentSchema.index({ agent: 1, status: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);

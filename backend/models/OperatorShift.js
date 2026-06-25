'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const operatorShiftSchema = new Schema({
  assignmentNumber: { type: String, unique: true },
  operator:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  operatorName:   { type: String, default: '' },
  shift:          { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
  factory:        { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  workCenter:     { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
  machine:        { type: Schema.Types.ObjectId, ref: 'Machine' },
  date:           { type: Date, required: true },
  startTime:      { type: Date },
  endTime:        { type: Date },
  assignedWorkOrders: [{ type: Schema.Types.ObjectId, ref: 'WorkOrder' }],
  status:         { type: String, enum: ['scheduled','active','completed','absent','cancelled'], default: 'scheduled' },
  notes:          { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

operatorShiftSchema.index({ operator: 1, date: -1 });
operatorShiftSchema.index({ factory: 1, date: -1 });
operatorShiftSchema.index({ shift: 1, date: -1 });

operatorShiftSchema.pre('validate', async function (next) {
  if (this.isNew && !this.assignmentNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('OperatorShift').countDocuments();
    this.assignmentNumber = `OSH-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('OperatorShift', operatorShiftSchema);

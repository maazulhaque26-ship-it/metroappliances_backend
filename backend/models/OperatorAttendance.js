'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const operatorAttendanceSchema = new Schema({
  attendanceNumber: { type: String, unique: true },
  operator:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  operatorName:   { type: String, default: '' },
  factory:        { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  shift:          { type: Schema.Types.ObjectId, ref: 'Shift' },
  date:           { type: Date, required: true },
  clockIn:        { type: Date },
  clockOut:       { type: Date },
  totalHours:     { type: Number, default: 0, min: 0 },
  overtimeHours:  { type: Number, default: 0, min: 0 },
  status:         { type: String, enum: ['present','absent','late','half_day','holiday','leave'], default: 'present' },
  notes:          { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

operatorAttendanceSchema.index({ operator: 1, date: -1 });
operatorAttendanceSchema.index({ factory: 1, date: -1 });
operatorAttendanceSchema.index({ status: 1, date: -1 });

operatorAttendanceSchema.pre('validate', async function (next) {
  if (this.isNew && !this.attendanceNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('OperatorAttendance').countDocuments();
    this.attendanceNumber = `OAT-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('OperatorAttendance', operatorAttendanceSchema);

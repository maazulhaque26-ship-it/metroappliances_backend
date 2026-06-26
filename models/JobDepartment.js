const mongoose = require('mongoose');
const { Schema } = mongoose;

const jobDepartmentSchema = new Schema(
  {
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, unique: true },
    annualHiringTarget: { type: Number, default: 0 },
    currentHeadcount: { type: Number, default: 0 },
    approvedHeadcount: { type: Number, default: 0 },
    hiringBudget: { type: Number, default: 0 },
    hiringManager: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobDepartment', jobDepartmentSchema);

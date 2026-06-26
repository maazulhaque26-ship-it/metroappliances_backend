const mongoose = require('mongoose');
const { Schema } = mongoose;

const recruitmentReportSchema = new Schema(
  {
    name: { type: String, required: true },
    reportType: {
      type: String,
      enum: [
        'open_positions',
        'hiring_funnel',
        'source_effectiveness',
        'time_to_hire',
        'offer_acceptance',
        'recruiter_performance',
        'department_hiring',
      ],
    },
    filters: { type: Schema.Types.Mixed },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecruitmentReport', recruitmentReportSchema);

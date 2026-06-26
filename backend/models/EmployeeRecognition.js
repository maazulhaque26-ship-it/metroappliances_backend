const mongoose = require('mongoose');
const { Schema } = mongoose;

const employeeRecognitionSchema = new Schema({
  recognitionNumber: { type: String, unique: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  giver: { type: Schema.Types.ObjectId, ref: 'Employee' },
  givenBy: { type: Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: [
      'spot_award',
      'monthly_star',
      'innovation',
      'teamwork',
      'customer_excellence',
      'years_of_service',
      'other',
    ],
    default: 'spot_award',
  },
  title: { type: String, required: true },
  description: { type: String },
  points: { type: Number, default: 0 },
  badgeUrl: { type: String },
  isPublic: { type: Boolean, default: true },
  cycle: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

employeeRecognitionSchema.pre('validate', async function (next) {
  if (!this.recognitionNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('EmployeeRecognition').countDocuments();
    this.recognitionNumber = `RCG-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

employeeRecognitionSchema.index({ recipient: 1, isDeleted: 1 });

module.exports = mongoose.model('EmployeeRecognition', employeeRecognitionSchema);

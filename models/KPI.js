const mongoose = require('mongoose');
const { Schema } = mongoose;

const kpiSchema = new Schema({
  kpiCode: { type: String, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  unit: { type: String },
  targetValue: { type: Number },
  kpiType: { type: String, enum: ['quantitative', 'qualitative'], default: 'quantitative' },
  frequency: { type: String, enum: ['monthly', 'quarterly', 'annual'], default: 'quarterly' },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  designation: { type: Schema.Types.ObjectId, ref: 'Designation' },
  weightage: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

kpiSchema.pre('validate', async function (next) {
  if (!this.kpiCode) {
    const count = await mongoose.model('KPI').countDocuments();
    this.kpiCode = `KPI-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

kpiSchema.index({ department: 1, isDeleted: 1 });

module.exports = mongoose.model('KPI', kpiSchema);

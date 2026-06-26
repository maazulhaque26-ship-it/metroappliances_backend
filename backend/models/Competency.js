const mongoose = require('mongoose');
const { Schema } = mongoose;

const competencyLevelSchema = new Schema({
  level: { type: Number },
  title: { type: String },
  description: { type: String },
  indicators: [{ type: String }],
}, { _id: false });

const competencySchema = new Schema({
  code: { type: String, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  competencyType: {
    type: String,
    enum: ['technical', 'behavioral', 'leadership', 'functional'],
    default: 'behavioral',
  },
  levels: [competencyLevelSchema],
  applicableTo: { type: String, enum: ['all', 'department', 'designation'], default: 'all' },
  departments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
  designations: [{ type: Schema.Types.ObjectId, ref: 'Designation' }],
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

competencySchema.pre('validate', async function (next) {
  if (!this.code) {
    const count = await mongoose.model('Competency').countDocuments();
    this.code = `CM-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

competencySchema.index({ competencyType: 1, isDeleted: 1 });

module.exports = mongoose.model('Competency', competencySchema);

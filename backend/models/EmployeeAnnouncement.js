const mongoose = require('mongoose');
const { Schema } = mongoose;

const employeeAnnouncementSchema = new Schema({
  announcementNumber: { type: String, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  targetAudience: {
    type: String,
    enum: ['all', 'department', 'designation', 'individual'],
    default: 'all',
  },
  targetDepartments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
  targetDesignations: [{ type: Schema.Types.ObjectId, ref: 'Designation' }],
  targetEmployees: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  publishAt: { type: Date },
  expiresAt: { type: Date },
  isPublished: { type: Boolean, default: false },
  publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  attachmentUrl: { type: String },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

employeeAnnouncementSchema.pre('validate', async function (next) {
  if (!this.announcementNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('EmployeeAnnouncement').countDocuments();
    this.announcementNumber = `ANN-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

employeeAnnouncementSchema.index({ isPublished: 1, isDeleted: 1 });

module.exports = mongoose.model('EmployeeAnnouncement', employeeAnnouncementSchema);

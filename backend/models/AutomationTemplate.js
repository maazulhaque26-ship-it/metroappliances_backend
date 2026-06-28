const mongoose = require('mongoose');
const { Schema } = mongoose;

const automationTemplateSchema = new Schema({
  templateCode: { type: String, unique: true },
  name:         { type: String, required: true, trim: true },
  description:  { type: String, required: true },
  category:     { type: String, enum: ['approval','reminder','notification','escalation','replenishment','maintenance','reporting','custom'], default: 'custom' },
  trigger:      { type: String, enum: ['schedule','event','condition','manual'], default: 'manual' },
  actionTemplate: Schema.Types.Mixed,
  conditionTemplate: Schema.Types.Mixed,
  defaultSchedule: String,
  isBuiltIn:    { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  useCount:     { type: Number, default: 0 },
  tags:         [String],
  icon:         String,
  module:       String,
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

automationTemplateSchema.index({ category: 1, isActive: 1 });
automationTemplateSchema.index({ isBuiltIn: 1 });

automationTemplateSchema.pre('validate', async function (next) {
  if (!this.templateCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('AutomationTemplate').countDocuments({ templateCode: new RegExp(`^ATM-${y}-`) });
    this.templateCode = `ATM-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AutomationTemplate', automationTemplateSchema);

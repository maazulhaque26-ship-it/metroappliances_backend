const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const collectionRuleSchema = new Schema({
  ruleName:       { type: String, required: true, trim: true },
  description:    { type: String, trim: true },
  trigger:        { type: String, enum: ['overdue_days','amount_threshold','risk_rating','no_payment_days','credit_utilization'], required: true },
  triggerValue:   { type: Number, default: 0 },
  triggerRating:  { type: String, enum: ['low','medium','high','blocked'] },
  reminderLevel:  { type: Number, enum: [1, 2, 3], default: 1 },
  action:         { type: String, enum: ['send_reminder','assign_collection_officer','escalate','legal_notice','block_credit','auto_write_off_flag'], required: true },
  reminderType:   { type: String, enum: ['email','sms','whatsapp','letter','legal'], default: 'email' },
  template:       { type: String, trim: true },
  assignTo:       { type: ObjectId, ref: 'User' },
  escalateTo:     { type: ObjectId, ref: 'User' },
  priority:       { type: Number, default: 1 },
  isActive:       { type: Boolean, default: true },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

collectionRuleSchema.index({ isActive: 1 });
collectionRuleSchema.index({ trigger: 1 });

module.exports = mongoose.model('CollectionRule', collectionRuleSchema);

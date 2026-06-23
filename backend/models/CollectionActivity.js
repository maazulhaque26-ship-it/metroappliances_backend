const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const collectionActivitySchema = new Schema({
  activityNumber:   { type: String, unique: true },
  customer:         { type: ObjectId, ref: 'User', required: true },
  customerName:     { type: String, trim: true },
  customerInvoice:  { type: ObjectId, ref: 'CustomerInvoice' },
  activityType:     { type: String, enum: ['call','email','visit','letter','legal_notice','escalation','field_collection','whatsapp','sms'], default: 'call' },
  activityDate:     { type: Date, required: true, default: Date.now },
  performedBy:      { type: ObjectId, ref: 'User', required: true },
  performedByName:  { type: String, trim: true },
  notes:            { type: String, required: true },
  outcome:          { type: String, enum: ['contacted','not_reachable','promise_to_pay','partial_payment','disputed','escalated','legal','resolved','no_answer'], default: 'contacted' },
  amountDue:        { type: Number, default: 0 },
  nextFollowUpDate: { type: Date },
  nextFollowUpAction: { type: String, trim: true },
  promiseToPay:     { type: ObjectId, ref: 'PromiseToPay' },
  status:           { type: String, enum: ['pending','completed','cancelled'], default: 'completed' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

collectionActivitySchema.index({ customer: 1, isDeleted: 1 });
collectionActivitySchema.index({ activityDate: -1 });
collectionActivitySchema.index({ performedBy: 1 });
collectionActivitySchema.index({ customerInvoice: 1 });

collectionActivitySchema.pre('validate', async function (next) {
  if (!this.activityNumber) {
    const yr = new Date().getFullYear();
    const prefix = `CACT-${yr}-`;
    const count = await this.constructor.countDocuments({ activityNumber: { $regex: `^${prefix}` } });
    this.activityNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CollectionActivity', collectionActivitySchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const collectionReminderSchema = new Schema({
  reminderNumber:  { type: String, unique: true },
  customer:        { type: ObjectId, ref: 'User', required: true },
  customerName:    { type: String, trim: true },
  customerEmail:   { type: String, trim: true },
  reminderLevel:   { type: Number, enum: [1, 2, 3], default: 1 },
  reminderType:    { type: String, enum: ['email','sms','whatsapp','letter','legal'], default: 'email' },
  reminderDate:    { type: Date, required: true, default: Date.now },
  dueAmount:       { type: Number, required: true, min: 0 },
  invoices:        [{ type: ObjectId, ref: 'CustomerInvoice' }],
  messageTemplate: { type: String, trim: true },
  status:          { type: String, enum: ['pending','sent','delivered','failed','responded'], default: 'pending' },
  sentAt:          { type: Date },
  respondedAt:     { type: Date },
  responseNotes:   { type: String, trim: true },
  sentBy:          { type: ObjectId, ref: 'User' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

collectionReminderSchema.index({ customer: 1, isDeleted: 1 });
collectionReminderSchema.index({ reminderDate: -1 });
collectionReminderSchema.index({ status: 1 });

collectionReminderSchema.pre('validate', async function (next) {
  if (!this.reminderNumber) {
    const yr = new Date().getFullYear();
    const prefix = `CREM-${yr}-`;
    const count = await this.constructor.countDocuments({ reminderNumber: { $regex: `^${prefix}` } });
    this.reminderNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CollectionReminder', collectionReminderSchema);

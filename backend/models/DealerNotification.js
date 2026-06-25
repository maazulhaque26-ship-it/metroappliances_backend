const mongoose = require('mongoose');

const dealerNotificationSchema = new mongoose.Schema({
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    default: null, // null = broadcast to all dealers
  },

  isBroadcast: { type: Boolean, default: false },

  type: {
    type: String,
    enum: ['order', 'pricing', 'approval', 'kyc', 'announcement', 'admin', 'system'],
    default: 'system',
  },

  title:   { type: String, required: [true, 'Title is required'], maxlength: 200 },
  message: { type: String, required: [true, 'Message is required'], maxlength: 1000 },
  link:    { type: String, default: '' },

  isRead: { type: Boolean, default: false },
  readAt: { type: Date,    default: null },
}, { timestamps: true });

dealerNotificationSchema.index({ dealer: 1, isRead: 1, createdAt: -1 });
dealerNotificationSchema.index({ isBroadcast: 1 });

module.exports = mongoose.model('DealerNotification', dealerNotificationSchema);

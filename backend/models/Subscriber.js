const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  isActive: { type: Boolean, default: true },
  source:   { type: String, default: 'footer' },
}, { timestamps: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);
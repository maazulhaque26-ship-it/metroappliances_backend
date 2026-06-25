'use strict';
const mongoose = require('mongoose');

// Architecture only — no payment logic yet
const referralConfigSchema = new mongoose.Schema({
  isEnabled:          { type: Boolean, default: false },
  referrerReward:     { type: Number, default: 100 },
  refereeReward:      { type: Number, default: 50 },
  rewardType:         { type: String, enum: ['points', 'coupon', 'wallet'], default: 'coupon' },
  minOrderForReward:  { type: Number, default: 500 },
  expiryDays:         { type: Number, default: 30 },
  maxReferrals:       { type: Number, default: 0 },
  termsText:          { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ReferralConfig', referralConfigSchema);

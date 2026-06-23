'use strict';
const mongoose = require('mongoose');

// Architecture only — no business logic yet
const levelSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  minPoints:  { type: Number, required: true },
  maxPoints:  { type: Number, default: null },
  badge:      { type: String, default: '' },
  color:      { type: String, default: '#FF7A00' },
  perks:      { type: [String], default: [] },
}, { _id: false });

const badgeSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  icon:        { type: String, default: '' },
  trigger:     { type: String, default: '' },
}, { _id: false });

const rewardsConfigSchema = new mongoose.Schema({
  isEnabled:          { type: Boolean, default: false },
  pointsPerRupee:     { type: Number, default: 1 },
  rupeePerPoint:      { type: Number, default: 0.1 },
  minRedeemPoints:    { type: Number, default: 100 },
  maxRedeemPercent:   { type: Number, default: 20 },
  expiryDays:         { type: Number, default: 365 },
  levels:             { type: [levelSchema], default: [] },
  badges:             { type: [badgeSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('RewardsConfig', rewardsConfigSchema);

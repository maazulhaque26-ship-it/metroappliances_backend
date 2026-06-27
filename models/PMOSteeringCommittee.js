'use strict';
const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  date:    { type: Date, required: true },
  agenda:  { type: String, default: '' },
  minutes: { type: String, default: '' },
  status:  { type: String, enum: ['scheduled', 'completed', 'cancelled', 'postponed'], default: 'scheduled' },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { _id: true, timestamps: true });

const PMOSteeringCommitteeSchema = new mongoose.Schema({
  committeeCode: { type: String, unique: true },
  name:          { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  portfolio:     { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  program:       { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  chair:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  secretary:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members:       [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, title: { type: String, default: '' } }],
  status:        { type: String, enum: ['active', 'inactive', 'dissolved'], default: 'active' },
  mandate:       { type: String, default: '' },
  meetings:      [meetingSchema],
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

PMOSteeringCommitteeSchema.pre('validate', async function (next) {
  if (this.committeeCode) return next();
  try {
    const year = new Date().getFullYear();
    const last = await mongoose.model('PMOSteeringCommittee').findOne({ committeeCode: new RegExp(`^SC-${year}-`) }).sort({ committeeCode: -1 }).lean();
    const seq = last ? (parseInt(last.committeeCode.split('-')[2], 10) + 1) : 1;
    this.committeeCode = `SC-${year}-${String(seq).padStart(5, '0')}`;
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.models.PMOSteeringCommittee || mongoose.model('PMOSteeringCommittee', PMOSteeringCommitteeSchema);

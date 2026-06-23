const mongoose = require('mongoose');

const homepageOfferSchema = new mongoose.Schema({
  title:            { type: String, required: true, trim: true },
  badge:            { type: String, default: 'LIMITED TIME OFFER' },
  salePrice:        { type: Number, required: true, min: 0 },
  originalPrice:    { type: Number, required: true, min: 0 },
  image:             { type: String, required: true },
  countdownEndDate: { type: Date, required: true },
  buttonText:       { type: String, default: 'Secure Deal' },
  buttonLink:       { type: String, required: true },
  displayOrder:     { type: Number, default: 0 },
  isActive:         { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('HomepageOffer', homepageOfferSchema);

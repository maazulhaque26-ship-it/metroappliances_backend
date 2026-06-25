const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  city:     { type: String, required: true },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  text:     { type: String, required: true },
  image:    { type: String, default: '' }, // profile picture path
  status:   { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);

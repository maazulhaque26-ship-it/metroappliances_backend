const Testimonial = require('../models/Testimonial');
const path = require('path');

// Public: Get approved testimonials
exports.getApprovedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching testimonials', error: err.message });
  }
};

// Public: Submit a new testimonial
exports.submitTestimonial = async (req, res) => {
  try {
    const { name, city, rating, text } = req.body;
    let image = '';
    
    if (req.file) {
      image = req.file.path;
    }

    const testimonial = await Testimonial.create({
      name, city, rating, text, image, status: 'approved'
    });

    res.status(201).json({ message: 'Testimonial submitted successfully.', testimonial });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting testimonial', error: err.message });
  }
};

// Admin: Get all testimonials
exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching testimonials', error: err.message });
  }
};

// Admin: Update testimonial status
exports.updateTestimonialStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
    res.json({ message: 'Status updated', testimonial });
  } catch (err) {
    res.status(500).json({ message: 'Error updating status', error: err.message });
  }
};

// Admin: Delete testimonial
exports.deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
    res.json({ message: 'Testimonial deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting testimonial', error: err.message });
  }
};

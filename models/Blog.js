const mongoose = require('mongoose');
const slugify  = require('slugify');

const blogSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  slug:        { type: String, unique: true },
  description: { type: String, required: true, trim: true },
  excerpt:     { type: String, default: '' },
  content:     { type: String, default: '' },
  image:       { type: String, default: '' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

blogSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);

const Blog    = require('../models/Blog');
const slugify = require('slugify');
const { cloudinary, cloudinaryPublicId } = require('../config/cloudinary');

function makeSlug(title) {
  return slugify(title, { lower: true, strict: true }) + '-' + Date.now();
}

exports.getBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, blogs });
  } catch (err) { next(err); }
};

exports.getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isActive: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found' });
    res.json({ success: true, blog });
  } catch (err) { next(err); }
};

exports.getAdminBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({ success: true, blogs });
  } catch (err) { next(err); }
};

exports.createBlog = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (!data.slug && data.title) data.slug = makeSlug(data.title);
    if (req.file) data.image = req.file.path;
    const blog = await Blog.create(data);
    res.status(201).json({ success: true, blog });
  } catch (err) { next(err); }
};

exports.updateBlog = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;
    const blog = await Blog.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found' });
    res.json({ success: true, blog });
  } catch (err) { next(err); }
};

exports.toggleBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found' });
    blog.isActive = !blog.isActive;
    await blog.save();
    res.json({ success: true, blog });
  } catch (err) { next(err); }
};

exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found' });
    const pid = cloudinaryPublicId(blog.image);
    if (pid) cloudinary.uploader.destroy(pid).catch(() => {});
    await blog.deleteOne();
    res.json({ success: true, message: 'Blog post deleted' });
  } catch (err) { next(err); }
};

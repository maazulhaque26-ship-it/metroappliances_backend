const LoginSlider = require('../models/LoginSlider');
const { cloudinary, cloudinaryPublicId } = require('../config/cloudinary');

const MAX_SLIDES = 4;

exports.getLoginSlides = async (req, res, next) => {
  try {
    const slides = await LoginSlider.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, slides });
  } catch (err) { next(err); }
};

exports.getAdminLoginSlides = async (req, res, next) => {
  try {
    const slides = await LoginSlider.find().sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, slides });
  } catch (err) { next(err); }
};

exports.createLoginSlide = async (req, res, next) => {
  try {
    const count = await LoginSlider.countDocuments();
    if (count >= MAX_SLIDES) {
      return res.status(400).json({ success: false, message: `Maximum ${MAX_SLIDES} slides allowed` });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'Image is required' });
    const data = { ...req.body, image: req.file.path, displayOrder: count };
    const slide = await LoginSlider.create(data);
    res.status(201).json({ success: true, slide });
  } catch (err) { next(err); }
};

exports.updateLoginSlide = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      const existing = await LoginSlider.findById(req.params.id);
      if (existing) {
        const pid = cloudinaryPublicId(existing.image);
        if (pid) cloudinary.uploader.destroy(pid).catch(() => {});
      }
      data.image = req.file.path;
    }
    const slide = await LoginSlider.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
    res.json({ success: true, slide });
  } catch (err) { next(err); }
};

exports.toggleLoginSlide = async (req, res, next) => {
  try {
    const slide = await LoginSlider.findById(req.params.id);
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
    slide.isActive = !slide.isActive;
    await slide.save();
    res.json({ success: true, slide });
  } catch (err) { next(err); }
};

exports.reorderLoginSlides = async (req, res, next) => {
  try {
    const { order } = req.body;
    await Promise.all(order.map(({ id, displayOrder }) =>
      LoginSlider.findByIdAndUpdate(id, { displayOrder })
    ));
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.deleteLoginSlide = async (req, res, next) => {
  try {
    const slide = await LoginSlider.findById(req.params.id);
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
    const pid = cloudinaryPublicId(slide.image);
    if (pid) cloudinary.uploader.destroy(pid).catch(() => {});
    await slide.deleteOne();
    res.json({ success: true, message: 'Slide deleted' });
  } catch (err) { next(err); }
};

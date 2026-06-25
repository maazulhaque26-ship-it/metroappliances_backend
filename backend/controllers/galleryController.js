const GalleryImage = require('../models/GalleryImage');
const { cloudinary, cloudinaryPublicId } = require('../config/cloudinary');

exports.getGallery = async (req, res, next) => {
  try {
    const images = await GalleryImage.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, images });
  } catch (err) { next(err); }
};

exports.getAdminGallery = async (req, res, next) => {
  try {
    const images = await GalleryImage.find().sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, images });
  } catch (err) { next(err); }
};

exports.createGalleryImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image is required' });
    const data  = { ...req.body, image: `/uploads/${req.file.filename}` };
    const image = await GalleryImage.create(data);
    res.status(201).json({ success: true, image });
  } catch (err) { next(err); }
};

exports.updateGalleryImage = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;
    const image = await GalleryImage.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!image) return res.status(404).json({ success: false, message: 'Gallery image not found' });
    res.json({ success: true, image });
  } catch (err) { next(err); }
};

exports.toggleGalleryImage = async (req, res, next) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    if (!image) return res.status(404).json({ success: false, message: 'Gallery image not found' });
    image.isActive = !image.isActive;
    await image.save();
    res.json({ success: true, image });
  } catch (err) { next(err); }
};

exports.deleteGalleryImage = async (req, res, next) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    if (!image) return res.status(404).json({ success: false, message: 'Gallery image not found' });
    const pid = cloudinaryPublicId(image.image);
    if (pid) cloudinary.uploader.destroy(pid).catch(() => {});
    await image.deleteOne();
    res.json({ success: true, message: 'Gallery image deleted' });
  } catch (err) { next(err); }
};

exports.reorderGallery = async (req, res, next) => {
  try {
    const { order } = req.body; // [{ id, displayOrder }]
    await Promise.all(order.map(({ id, displayOrder }) =>
      GalleryImage.findByIdAndUpdate(id, { displayOrder })
    ));
    res.json({ success: true });
  } catch (err) { next(err); }
};

const Banner = require('../models/Banner');
const { cloudinary, cloudinaryPublicId } = require('../config/cloudinary');

exports.getBanners = async (req, res, next) => {
  try {
    const filter = (!req.user || req.user.role === 'user') ? { isActive: true } : {};
    const banners = await Banner.find(filter).sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, banners });
  } catch (err) { next(err); }
};

exports.createBanner = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;
    const banner = await Banner.create(data);
    res.status(201).json({ success: true, banner });
  } catch (err) { next(err); }
};

exports.updateBanner = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;
    const banner = await Banner.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, banner });
  } catch (err) { next(err); }
};

exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    const pid = cloudinaryPublicId(banner.image);
    if (pid) cloudinary.uploader.destroy(pid).catch(() => {});
    await banner.deleteOne();
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) { next(err); }
};

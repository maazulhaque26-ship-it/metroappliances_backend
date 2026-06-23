const Achievement = require('../models/Achievement');
const { cloudinary, cloudinaryPublicId } = require('../config/cloudinary');

exports.getAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, achievements });
  } catch (err) { next(err); }
};

exports.getAdminAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find().sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, achievements });
  } catch (err) { next(err); }
};

exports.createAchievement = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;
    const achievement = await Achievement.create(data);
    res.status(201).json({ success: true, achievement });
  } catch (err) { next(err); }
};

exports.updateAchievement = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;
    const achievement = await Achievement.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!achievement) return res.status(404).json({ success: false, message: 'Achievement not found' });
    res.json({ success: true, achievement });
  } catch (err) { next(err); }
};

exports.toggleAchievement = async (req, res, next) => {
  try {
    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) return res.status(404).json({ success: false, message: 'Achievement not found' });
    achievement.isActive = !achievement.isActive;
    await achievement.save();
    res.json({ success: true, achievement });
  } catch (err) { next(err); }
};

exports.deleteAchievement = async (req, res, next) => {
  try {
    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) return res.status(404).json({ success: false, message: 'Achievement not found' });
    const pid = cloudinaryPublicId(achievement.image);
    if (pid) cloudinary.uploader.destroy(pid).catch(() => {});
    await achievement.deleteOne();
    res.json({ success: true, message: 'Achievement deleted' });
  } catch (err) { next(err); }
};

exports.reorderAchievements = async (req, res, next) => {
  try {
    const { order } = req.body; // [{ id, displayOrder }]
    await Promise.all(order.map(({ id, displayOrder }) =>
      Achievement.findByIdAndUpdate(id, { displayOrder })
    ));
    res.json({ success: true });
  } catch (err) { next(err); }
};

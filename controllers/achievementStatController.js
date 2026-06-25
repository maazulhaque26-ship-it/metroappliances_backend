const AchievementStat = require('../models/AchievementStat');

exports.getAchievementStats = async (req, res) => {
  try {
    const stats = await AchievementStat.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAdminAchievementStats = async (req, res) => {
  try {
    const stats = await AchievementStat.find().sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAchievementStat = async (req, res) => {
  try {
    const { title, count, suffix, displayOrder, isActive } = req.body;
    const stat = await AchievementStat.create({
      title,
      count: Number(count) || 0,
      suffix: suffix || '+',
      displayOrder: Number(displayOrder) || 0,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
    });
    res.status(201).json({ success: true, stat });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateAchievementStat = async (req, res) => {
  try {
    const { title, count, suffix, displayOrder, isActive } = req.body;
    const update = {};
    if (title !== undefined)        update.title        = title;
    if (count !== undefined)        update.count        = Number(count);
    if (suffix !== undefined)       update.suffix       = suffix;
    if (displayOrder !== undefined) update.displayOrder = Number(displayOrder);
    if (isActive !== undefined)     update.isActive     = isActive === 'true' || isActive === true;

    const stat = await AchievementStat.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!stat) return res.status(404).json({ success: false, message: 'Stat not found' });
    res.json({ success: true, stat });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.toggleAchievementStat = async (req, res) => {
  try {
    const stat = await AchievementStat.findById(req.params.id);
    if (!stat) return res.status(404).json({ success: false, message: 'Stat not found' });
    stat.isActive = !stat.isActive;
    await stat.save();
    res.json({ success: true, stat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAchievementStat = async (req, res) => {
  try {
    const stat = await AchievementStat.findByIdAndDelete(req.params.id);
    if (!stat) return res.status(404).json({ success: false, message: 'Stat not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reorderAchievementStats = async (req, res) => {
  try {
    const { order } = req.body; // [{ id, displayOrder }]
    await Promise.all(order.map(({ id, displayOrder }) =>
      AchievementStat.findByIdAndUpdate(id, { displayOrder })
    ));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

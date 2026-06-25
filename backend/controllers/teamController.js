const TeamMember = require('../models/TeamMember');
const { cloudinary, cloudinaryPublicId } = require('../config/cloudinary');

exports.getPublicTeamMembers = async (req, res, next) => {
  try {
    const team = await TeamMember.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, team });
  } catch (err) { next(err); }
};

exports.getAdminTeamMembers = async (req, res, next) => {
  try {
    const team = await TeamMember.find().sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, team });
  } catch (err) { next(err); }
};

exports.createTeamMember = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.photo = req.file.path;
    const member = await TeamMember.create(data);
    res.status(201).json({ success: true, member });
  } catch (err) { next(err); }
};

exports.updateTeamMember = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.photo = req.file.path;
    const member = await TeamMember.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, member });
  } catch (err) { next(err); }
};

exports.deleteTeamMember = async (req, res, next) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    const pid = cloudinaryPublicId(member.photo);
    if (pid) cloudinary.uploader.destroy(pid).catch(() => {});
    await member.deleteOne();
    res.json({ success: true, message: 'Member deleted' });
  } catch (err) { next(err); }
};

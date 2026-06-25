const HomepageOffer = require('../models/HomepageOffer');
const { cloudinary, cloudinaryPublicId } = require('../config/cloudinary');

const MAX_ACTIVE_OFFERS = 5;

exports.getOffers = async (req, res, next) => {
  try {
    const filter = (!req.user || req.user.role === 'user') ? { isActive: true } : {};
    const offers = await HomepageOffer.find(filter).sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, offers });
  } catch (err) { next(err); }
};

exports.createOffer = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;

    if (data.isActive === undefined || data.isActive === 'true' || data.isActive === true) {
      const activeCount = await HomepageOffer.countDocuments({ isActive: true });
      if (activeCount >= MAX_ACTIVE_OFFERS) {
        return res.status(400).json({ success: false, message: `Maximum ${MAX_ACTIVE_OFFERS} active offers allowed. Disable another offer first.` });
      }
    }

    const offer = await HomepageOffer.create(data);
    res.status(201).json({ success: true, offer });
  } catch (err) { next(err); }
};

exports.updateOffer = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;

    const wantsActive = data.isActive === undefined || data.isActive === 'true' || data.isActive === true;
    if (wantsActive) {
      const activeCount = await HomepageOffer.countDocuments({ isActive: true, _id: { $ne: req.params.id } });
      if (activeCount >= MAX_ACTIVE_OFFERS) {
        return res.status(400).json({ success: false, message: `Maximum ${MAX_ACTIVE_OFFERS} active offers allowed. Disable another offer first.` });
      }
    }

    const offer = await HomepageOffer.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, offer });
  } catch (err) { next(err); }
};

exports.deleteOffer = async (req, res, next) => {
  try {
    const offer = await HomepageOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    const pid = cloudinaryPublicId(offer.image);
    if (pid) cloudinary.uploader.destroy(pid).catch(() => {});
    await offer.deleteOne();
    res.json({ success: true, message: 'Offer deleted' });
  } catch (err) { next(err); }
};

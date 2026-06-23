const Banner = require('../models/Banner');
const HomepageOffer = require('../models/HomepageOffer');

// Single combined fetch for the homepage — avoids separate /banners + /homepage-offers round trips
exports.getHomepageContent = async (req, res, next) => {
  try {
    const filter = (!req.user || req.user.role === 'user') ? { isActive: true } : {};
    const [banners, offers] = await Promise.all([
      Banner.find(filter).sort({ displayOrder: 1, createdAt: 1 }),
      HomepageOffer.find(filter).sort({ displayOrder: 1, createdAt: 1 }),
    ]);
    res.json({ success: true, banners, offers });
  } catch (err) { next(err); }
};

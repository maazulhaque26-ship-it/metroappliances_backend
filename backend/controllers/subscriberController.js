const Subscriber = require('../models/Subscriber');
const { sendWelcomeNewsletter } = require('../utils/mailer');

// @desc  Subscribe email (public)
// @route POST /api/newsletter/subscribe
exports.subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      if (existing.isActive)
        return res.status(400).json({ success: false, message: 'This email is already subscribed!' });
      // Re-activate unsubscribed email
      existing.isActive = true;
      await existing.save();
      // Send welcome-back email (fire-and-forget)
      sendWelcomeNewsletter(email).catch(err =>
        console.error('[Newsletter] Welcome-back email failed:', err.message)
      );
      return res.json({ success: true, message: 'Welcome back! You have been re-subscribed.' });
    }

    await Subscriber.create({ email });

    // Send welcome email (fire-and-forget — never blocks the response)
    sendWelcomeNewsletter(email).catch(err =>
      console.error('[Newsletter] Welcome email failed:', err.message)
    );

    res.status(201).json({ success: true, message: 'Subscribed successfully! 🎉' });
  } catch (err) { next(err); }
};

// @desc  Get all subscribers (admin)
// @route GET /api/admin/subscribers
exports.getSubscribers = async (req, res, next) => {
  try {
    const page   = Number(req.query.page)   || 1;
    const limit  = Number(req.query.limit)  || 20;
    const search = req.query.search || '';
    const skip   = (page - 1) * limit;

    const query = search
      ? { email: { $regex: search, $options: 'i' } }
      : {};

    const [subscribers, total] = await Promise.all([
      Subscriber.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Subscriber.countDocuments(query),
    ]);

    const activeCount = await Subscriber.countDocuments({ isActive: true });

    res.json({
      success: true,
      subscribers,
      total,
      activeCount,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (err) { next(err); }
};

// @desc  Delete subscriber (admin)
// @route DELETE /api/admin/subscribers/:id
exports.deleteSubscriber = async (req, res, next) => {
  try {
    await Subscriber.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Subscriber removed' });
  } catch (err) { next(err); }
};

// @desc  Export all subscriber emails as CSV (admin)
// @route GET /api/admin/subscribers/export
exports.exportSubscribers = async (req, res, next) => {
  try {
    const subscribers = await Subscriber.find({ isActive: true }).sort({ createdAt: -1 });
    const csv = [
      'Email,Subscribed On,Status',
      ...subscribers.map(s =>
        `${s.email},${new Date(s.createdAt).toLocaleDateString('en-IN')},${s.isActive ? 'Active' : 'Unsubscribed'}`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
    res.send(csv);
  } catch (err) { next(err); }
};
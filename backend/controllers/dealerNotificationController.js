const DealerNotification = require('../models/DealerNotification');

// GET /api/dealer/notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const dealerId = req.dealer._id;

    const filter = { $or: [{ dealer: dealerId }, { isBroadcast: true }] };
    const skip   = (Number(page) - 1) * Number(limit);
    const total  = await DealerNotification.countDocuments(filter);

    const notifications = await DealerNotification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      notifications,
      pagination: {
        page: Number(page), limit: Number(limit), total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Get dealer notifications error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/dealer/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const dealerId = req.dealer._id;
    const count = await DealerNotification.countDocuments({
      $or: [{ dealer: dealerId }, { isBroadcast: true }],
      isRead: false,
    });
    res.json({ success: true, count });
  } catch (err) {
    console.error('Dealer unread count error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/dealer/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    const dealerId = req.dealer._id;
    const notif    = await DealerNotification.findOne({
      _id: req.params.id,
      $or: [{ dealer: dealerId }, { isBroadcast: true }],
    });

    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });

    notif.isRead = true;
    notif.readAt = new Date();
    await notif.save();

    res.json({ success: true, notification: notif });
  } catch (err) {
    console.error('Mark dealer notification read error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/dealer/notifications/mark-all-read
exports.markAllRead = async (req, res) => {
  try {
    const dealerId = req.dealer._id;
    await DealerNotification.updateMany(
      {
        $or: [{ dealer: dealerId }, { isBroadcast: true }],
        isRead: false,
      },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all dealer notifications read error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-notifications/broadcast  — admin sends to all dealers
exports.broadcastToDealer = async (req, res) => {
  try {
    const { dealerId, isBroadcast, type, title, message, link } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const notif = await DealerNotification.create({
      dealer:      isBroadcast ? null : (dealerId || null),
      isBroadcast: !!isBroadcast,
      type:        type || 'announcement',
      title,
      message,
      link: link || '',
    });

    res.status(201).json({ success: true, notification: notif });
  } catch (err) {
    console.error('Broadcast dealer notification error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

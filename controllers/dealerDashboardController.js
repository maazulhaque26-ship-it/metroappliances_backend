const DealerOrder        = require('../models/DealerOrder');
const DealerCart         = require('../models/DealerCart');
const DealerNotification = require('../models/DealerNotification');

// GET /api/dealer/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const dealerId = req.dealer._id;
    const now      = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todayOrders,
      pendingOrders,
      monthOrders,
      outstandingOrders,
      cart,
      unreadCount,
      recentOrders,
      recentNotifications,
    ] = await Promise.all([
      DealerOrder.countDocuments({ dealer: dealerId, createdAt: { $gte: todayStart } }),
      DealerOrder.countDocuments({ dealer: dealerId, status: { $in: ['pending', 'confirmed', 'processing'] } }),
      DealerOrder.countDocuments({ dealer: dealerId, createdAt: { $gte: monthStart } }),
      DealerOrder.countDocuments({ dealer: dealerId, status: { $nin: ['delivered', 'cancelled'] } }),
      DealerCart.findOne({ dealer: dealerId }),
      DealerNotification.countDocuments({
        $or: [{ dealer: dealerId }, { isBroadcast: true }],
        isRead: false,
      }),
      DealerOrder.find({ dealer: dealerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber status totalAmount createdAt items'),
      DealerNotification.find({
        $or: [{ dealer: dealerId }, { isBroadcast: true }],
      })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Monthly revenue
    const monthRevenue = await DealerOrder.aggregate([
      {
        $match: {
          dealer:    dealerId,
          createdAt: { $gte: monthStart },
          status:    { $nin: ['cancelled'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          todayOrders,
          pendingOrders,
          monthOrders,
          outstandingOrders,
          monthRevenue: monthRevenue[0]?.total || 0,
          cartItems:    cart?.items?.length || 0,
          unreadNotifications: unreadCount,
        },
        recentOrders,
        recentNotifications,
        dealer: {
          dealerCode:   req.dealer.dealerCode,
          businessName: req.dealer.businessName,
          status:       req.dealer.status,
          kycStatus:    req.dealer.kycStatus,
          memberSince:  req.dealer.createdAt,
        },
      },
    });
  } catch (err) {
    console.error('Dealer dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

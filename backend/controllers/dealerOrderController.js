const DealerOrder        = require('../models/DealerOrder');
const DealerCart         = require('../models/DealerCart');
const DealerNotification = require('../models/DealerNotification');
const Product            = require('../models/Product');

// ── Dealer routes ──────────────────────────────────────────────────────────

// POST /api/dealer/orders  — place order from cart
exports.createOrder = async (req, res) => {
  try {
    const { dealerNote } = req.body;
    const dealer = req.dealer;

    const cart = await DealerCart.findOne({ dealer: dealer._id })
      .populate('items.product', 'name sku images isActive stock');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Validate all items are still available
    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.product?.name || 'Unknown'}" is no longer available`,
        });
      }
    }

    const subtotal    = cart.items.reduce((s, i) => s + i.quantity * i.dealerPrice, 0);
    const taxAmount   = 0;   // GST logic can be added later
    const shippingCost = 0;
    const totalAmount = subtotal + taxAmount + shippingCost;

    const orderItems = cart.items.map(i => ({
      product:      i.product._id,
      name:         i.product.name,
      sku:          i.product.sku || '',
      image:        i.product.images?.[0]?.url || '',
      quantity:     i.quantity,
      dealerPrice:  i.dealerPrice,
      mrp:          i.mrp,
      moq:          i.moq,
      caseQuantity: i.caseQuantity,
      lineTotal:    i.quantity * i.dealerPrice,
    }));

    const shippingAddress = {
      addressLine1: dealer.addressLine1 || '',
      addressLine2: dealer.addressLine2 || '',
      city:         dealer.city         || '',
      district:     dealer.district     || '',
      state:        dealer.state        || '',
      pincode:      dealer.pincode      || '',
    };

    const requiresApproval = totalAmount > 100000; // orders > 1 lakh need admin approval

    const order = await DealerOrder.create({
      dealer: dealer._id,
      items:  orderItems,
      subtotal,
      taxAmount,
      shippingCost,
      totalAmount,
      shippingAddress,
      requiresApproval,
      isApproved: !requiresApproval,
      status:     requiresApproval ? 'pending' : 'confirmed',
      dealerNote: dealerNote || '',
    });

    // Clear the cart
    await DealerCart.findOneAndUpdate({ dealer: dealer._id }, { items: [] });

    // Create notification
    await DealerNotification.create({
      dealer:  dealer._id,
      type:    'order',
      title:   'Order Placed Successfully',
      message: `Your order ${order.orderNumber} for ₹${totalAmount.toLocaleString('en-IN')} has been ${requiresApproval ? 'placed and is awaiting approval' : 'confirmed'}.`,
      link:    `/dealer/orders/${order._id}`,
    });

    res.status(201).json({ success: true, message: 'Order placed successfully', order });
  } catch (err) {
    console.error('Create dealer order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/dealer/orders
exports.getMyOrders = async (req, res) => {
  try {
    const {
      page   = 1,
      limit  = 10,
      status,
      search,
      from,
      to,
    } = req.query;

    const filter = { dealer: req.dealer._id };
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }
    if (search) {
      filter.orderNumber = { $regex: search, $options: 'i' };
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await DealerOrder.countDocuments(filter);

    const orders = await DealerOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('orderNumber status totalAmount items createdAt requiresApproval isApproved trackingNumber');

    res.json({
      success: true,
      orders,
      pagination: {
        page:       Number(page),
        limit:      Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Get dealer orders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/dealer/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await DealerOrder.findOne({
      _id:    req.params.id,
      dealer: req.dealer._id,
    }).populate('items.product', 'name slug sku images');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, order });
  } catch (err) {
    console.error('Get dealer order detail error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/dealer/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await DealerOrder.findOne({ _id: req.params.id, dealer: req.dealer._id });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    order.status      = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason || '';
    await order.save();

    res.json({ success: true, message: 'Order cancelled', order });
  } catch (err) {
    console.error('Cancel dealer order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Admin routes ───────────────────────────────────────────────────────────

// GET /api/admin/dealer-orders
exports.getAllDealerOrders = async (req, res) => {
  try {
    const {
      page   = 1,
      limit  = 20,
      status,
      search,
      dealer,
      from,
      to,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (dealer) filter.dealer = dealer;
    if (search) filter.orderNumber = { $regex: search, $options: 'i' };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await DealerOrder.countDocuments(filter);

    const orders = await DealerOrder.find(filter)
      .populate('dealer', 'dealerCode businessName ownerName email phone')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      orders,
      pagination: {
        page: Number(page), limit: Number(limit), total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Admin get dealer orders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/dealer-orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, trackingUrl, adminNotes } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await DealerOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (trackingUrl)    order.trackingUrl    = trackingUrl;
    if (adminNotes)     order.adminNotes     = adminNotes;
    if (status === 'shipped'   && !order.shippedAt)   order.shippedAt   = new Date();
    if (status === 'delivered' && !order.deliveredAt) order.deliveredAt = new Date();
    if (status === 'cancelled' && !order.cancelledAt) order.cancelledAt = new Date();

    await order.save();

    // Notify dealer
    await DealerNotification.create({
      dealer:  order.dealer,
      type:    'order',
      title:   `Order ${order.orderNumber} — ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your order ${order.orderNumber} status has been updated to "${status}".${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`,
      link:    `/dealer/orders/${order._id}`,
    });

    res.json({ success: true, message: 'Order status updated', order });
  } catch (err) {
    console.error('Admin update dealer order status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-orders/:id/approve
exports.approveDealerOrder = async (req, res) => {
  try {
    const order = await DealerOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!order.requiresApproval) {
      return res.status(400).json({ success: false, message: 'Order does not require approval' });
    }

    order.isApproved  = true;
    order.approvedBy  = req.user._id;
    order.approvedAt  = new Date();
    order.status      = 'confirmed';
    await order.save();

    await DealerNotification.create({
      dealer:  order.dealer,
      type:    'order',
      title:   'Order Approved',
      message: `Your order ${order.orderNumber} has been approved and is now confirmed.`,
      link:    `/dealer/orders/${order._id}`,
    });

    res.json({ success: true, message: 'Order approved', order });
  } catch (err) {
    console.error('Admin approve dealer order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-orders/bulk-approve
exports.bulkApproveDealerOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'orderIds array required' });
    }

    const result = await DealerOrder.updateMany(
      { _id: { $in: orderIds }, requiresApproval: true, isApproved: false },
      {
        $set: {
          isApproved: true,
          approvedBy: req.user._id,
          approvedAt: new Date(),
          status:     'confirmed',
        },
      }
    );

    res.json({ success: true, message: `${result.modifiedCount} orders approved` });
  } catch (err) {
    console.error('Bulk approve dealer orders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

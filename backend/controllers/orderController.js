const Order   = require('../models/Order');
const { sendCustomerReceipt, sendAdminNotification } = require('../utils/mailer');
const Product = require('../models/Product');
const { Cart, Coupon } = require('../models/index');

// @desc   Create new order
// @route  POST /api/orders
// @access Private
exports.createOrder = async (req, res, next) => {
  try {
    const {
      items, shippingAddress, paymentMethod,
      stripePaymentIntentId, couponCode, couponDiscount,
      itemsPrice, shippingPrice, taxPrice, totalPrice,
    } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ success: false, message: 'No order items' });

    // Validate stock and build order items
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product)
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });

      let price, imageSrc, variantName = '', variantSku = '';

      if (item.variantId && product.variants && product.variants.length > 0) {
        const variant = product.variants.id(item.variantId);
        if (!variant)
          return res.status(404).json({ success: false, message: `Variant not found for ${product.name}` });
        if (variant.stock < item.quantity)
          return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name} (${variant.name})` });
        price       = item.price || (variant.discountPrice > 0 ? variant.discountPrice : variant.price);
        imageSrc    = variant.images?.[0]?.url || product.images?.[0]?.url || '';
        variantName = variant.name;
        variantSku  = variant.sku || '';
      } else {
        if (product.stock < item.quantity)
          return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
        price    = item.price || (product.discountPrice > 0 ? product.discountPrice : product.price);
        imageSrc = product.images?.[0]?.url || '';
      }

      orderItems.push({
        product:     product._id,
        name:        product.name,
        image:       imageSrc,
        price,
        quantity:    item.quantity,
        variantId:   item.variantId   || '',
        variantName,
        variantSku,
      });
    }

    // Deduct stock — per-variant or product-level
    for (const item of items) {
      if (item.variantId) {
        await Product.findOneAndUpdate(
          { _id: item.product, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stock': -item.quantity } }
        );
      } else {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
    }

    // Increment coupon usage
    if (couponCode)
      await Coupon.findOneAndUpdate({ code: couponCode.toUpperCase() }, { $inc: { usageCount: 1 } });

    const paymentStatus = (paymentMethod === 'Stripe' && stripePaymentIntentId) ? 'Paid' : 'Pending';

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      stripePaymentIntentId: stripePaymentIntentId || '',
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      couponCode:     couponCode || '',
      couponDiscount: couponDiscount || 0,
      status: 'Pending',
      // FIX: explicitly set updatedAt so it's never "Invalid Date"
      statusHistory: [{ status: 'Pending', note: 'Order placed successfully', updatedAt: new Date() }],
    });

    await Cart.findOneAndUpdate({ user: req.user.id }, { $set: { items: [] } });

    // ── Send emails (non-blocking — server won't wait or crash) ──
    const emailData = {
      customerName:    req.user.name,
      customerEmail:   req.user.email,
      orderId:         order._id.toString(),
      orderNumber:     order.orderNumber,
      items:           orderItems,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      paymentStatus,
      paymentMethod,
      shippingAddress,
    };

    // Fire-and-forget — don't await, don't block the response
    sendCustomerReceipt(emailData).catch(err =>
      console.error('[Order] Customer receipt failed:', err.message)
    );
    sendAdminNotification(emailData).catch(err =>
      console.error('[Order] Admin notification failed:', err.message)
    );

    // Emit socket event for live dashboard update
    try { req.app.locals.io?.emit('order:created', { orderId: order._id, total: totalPrice }); } catch (_) {}

    res.status(201).json({ success: true, order });
  } catch (err) { next(err); }
};

// @desc   Get my orders
// @route  GET /api/orders/my-orders
// @access Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user.id })
        .populate('items.product', 'name images slug') // fallback source if the order-time image snapshot 404s
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // FIX: lean() returns plain JS objects — faster, no stale getters
      Order.countDocuments({ user: req.user.id }),
    ]);

    res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// @desc   Get single order
// @route  GET /api/orders/:id
// @access Private
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images slug')
      .lean();

    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    res.json({ success: true, order });
  } catch (err) { next(err); }
};

// @desc   Cancel order
// @route  PUT /api/orders/:id/cancel
// @access Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (!['Pending', 'Processing'].includes(order.status))
      return res.status(400).json({ success: false, message: 'Cannot cancel this order' });

    for (const item of order.items) {
      if (item.variantId) {
        await Product.findOneAndUpdate(
          { _id: item.product, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stock': item.quantity } }
        );
      } else {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    order.status = 'Cancelled';
    // FIX: explicit updatedAt
    order.statusHistory.push({ status: 'Cancelled', note: req.body.reason || 'Cancelled by customer', updatedAt: new Date() });
    await order.save();

    res.json({ success: true, order });
  } catch (err) { next(err); }
};

// @desc   Get all orders (admin)
// @route  GET /api/admin/orders
// @access Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.orderNumber = { $regex: req.query.search.replace(/^#/, ''), $options: 'i' };
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .populate('items.product', 'name images slug')
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// @desc   Update order status (admin)
// @route  PUT /api/admin/orders/:id/status
// @access Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    // FIX: accept BOTH 'status' and 'orderStatus' field names
    // Admin frontend sends 'orderStatus', but this also supports 'status'
    const newStatus = req.body.status || req.body.orderStatus;
    const { note, trackingId } = req.body;

    if (!newStatus)
      return res.status(400).json({ success: false, message: 'Status is required' });

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(newStatus))
      return res.status(400).json({ success: false, message: `Invalid status: ${newStatus}` });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = newStatus;
    if (trackingId) order.trackingId = trackingId;

    if (newStatus === 'Delivered') {
      order.deliveredAt   = new Date();
      order.paymentStatus = 'Paid';
    }

    // FIX: explicitly set updatedAt to prevent "Invalid Date" in status history
    order.statusHistory.push({
      status:    newStatus,
      note:      note || '',
      trackingId: trackingId || '',
      updatedAt: new Date(), // ← explicit, not relying on Mongoose default
    });

    await order.save();

    try { req.app.locals.io?.emit('order:statusChanged', { orderId: order._id, status: newStatus }); } catch (_) {}

    res.json({ success: true, order });
  } catch (err) { next(err); }
};

// @desc   Admin dashboard stats
// @route  GET /api/admin/stats
// @access Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const User    = require('../models/User');

    const [totalOrders, totalRevenue, totalProducts, totalUsers, recentOrders, monthlySales] =
      await Promise.all([
        Order.countDocuments(),
        Order.aggregate([
          { $match: { status: { $ne: 'Cancelled' } } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]),
        Product.countDocuments({ isActive: true }),
        User.countDocuments({ role: 'user' }),
        Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email').lean(),
        Order.aggregate([
          {
            $match: {
              status:    { $ne: 'Cancelled' },
              createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)) },
            },
          },
          {
            $group: {
              _id:     { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
              revenue: { $sum: '$totalPrice' },
              count:   { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),
      ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalProducts,
        totalUsers,
        recentOrders,
        monthlySales,
      },
    });
  } catch (err) { next(err); }
};
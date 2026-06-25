const Product  = require('../models/Product');
const { cloudinary, cloudinaryPublicId } = require('../config/cloudinary');
const Category = require('../models/Category');
const User     = require('../models/User');
const Review   = require('../models/Review');
const Settings = require('../models/Settings');
const { Cart, Wishlist, Coupon } = require('../models/index');

function emitSocket(req, event, data) {
  try { req.app.locals.io?.emit(event, data); } catch (_) {}
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
const CART_POPULATE = 'name images price discountPrice stock isActive slug variants';

exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product', CART_POPULATE);
    if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, variantId } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive)
      return res.status(404).json({ success: false, message: 'Product not found' });

    let price, stockAvailable, variantName = '', variantSku = '', variantImage = '';

    if (variantId && product.variants && product.variants.length > 0) {
      const variant = product.variants.id(variantId);
      if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });
      price          = variant.discountPrice > 0 ? variant.discountPrice : variant.price;
      stockAvailable = variant.stock;
      variantName    = variant.name;
      variantSku     = variant.sku || '';
      variantImage   = variant.images?.[0]?.url || product.images?.[0]?.url || '';
    } else {
      price          = product.discountPrice > 0 ? product.discountPrice : product.price;
      stockAvailable = product.stock;
    }

    if (stockAvailable < quantity)
      return res.status(400).json({ success: false, message: 'Insufficient stock' });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });

    // Match on both product _and_ variant so each variant is a separate cart line
    const existing = cart.items.find(
      i => i.product.toString() === productId && (i.variantId || '') === (variantId || '')
    );
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, stockAvailable);
      existing.price    = price;
    } else {
      cart.items.push({ product: productId, quantity, price, variantId: variantId || '', variantName, variantSku, variantImage });
    }

    await cart.save();
    cart = await Cart.findOne({ user: req.user.id }).populate('items.product', CART_POPULATE);
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.find(i => i._id.toString() === req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    } else {
      item.quantity = quantity;
    }
    await cart.save();
    cart = await Cart.findOne({ user: req.user.id }).populate('items.product', CART_POPULATE);
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    await cart.save();
    cart = await Cart.findOne({ user: req.user.id }).populate('items.product', CART_POPULATE);
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) { next(err); }
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('products', 'name images price discountPrice ratings numReviews stock slug isActive');
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    res.json({ success: true, wishlist });
  } catch (err) { next(err); }
};

exports.toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user.id, products: [] });

    const idx = wishlist.products.findIndex(p => p.toString() === productId);
    if (idx > -1) wishlist.products.splice(idx, 1);
    else wishlist.products.push(productId);

    await wishlist.save();
    wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('products', 'name images price discountPrice ratings numReviews stock slug isActive');
    res.json({ success: true, wishlist });
  } catch (err) { next(err); }
};

// ─── Reviews (Public) ─────────────────────────────────────────────────────────
exports.getProductReviews = async (req, res, next) => {
  try {
    // Public endpoint: only approved reviews
    const reviews = await Review.find({ product: req.params.productId, status: 'approved' })
      .populate('user', 'name avatar').sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) { next(err); }
};

exports.getMyReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ user: req.user.id, product: req.params.productId })
      .populate('user', 'name avatar');
    res.json({ success: true, review: review || null });
  } catch (err) { next(err); }
};

exports.addReview = async (req, res, next) => {
  try {
    const { rating, title, comment, city } = req.body;
    const existing = await Review.findOne({ user: req.user.id, product: req.params.productId });
    if (existing)
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });

    // Images uploaded via multipart/form-data
    const imagesArray = req.files?.images || [];
    const images = imagesArray.map(f => ({
      url:       f.path,
      public_id: f.filename,
    }));

    let avatarUrl = '';
    if (req.files?.avatar && req.files.avatar.length > 0) {
      avatarUrl = req.files.avatar[0].path;
    }

    const review = await Review.create({
      user:    req.user.id,
      product: req.params.productId,
      rating,
      title:   title || '',
      comment,
      city:    city || '',
      images,
      avatar:  avatarUrl,
      status:  'pending',
    });
    await review.populate('user', 'name avatar');

    emitSocket(req, 'review:created', { review, productId: req.params.productId });
    res.status(201).json({ success: true, review });
  } catch (err) { next(err); }
};

exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.user.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const { rating, title, comment, city } = req.body;
    if (rating)  review.rating  = rating;
    if (title !== undefined)  review.title   = title;
    if (comment) review.comment = comment;
    if (city !== undefined) review.city = city;

    // New images to add
    const imagesArray = req.files?.images || [];
    const newImages = imagesArray.map(f => ({
      url:       f.path,
      public_id: f.filename,
    }));
    if (newImages.length > 0) {
      review.images.push(...newImages);
    }

    if (req.files?.avatar && req.files.avatar.length > 0) {
      review.avatar = req.files.avatar[0].path;
    }

    review.status = 'pending'; // Re-moderate on edit
    await review.save();
    await review.populate('user', 'name avatar');

    emitSocket(req, 'review:updated', { review });
    res.json({ success: true, review });
  } catch (err) { next(err); }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.user.toString() !== req.user.id && !['admin', 'super_admin', 'moderator'].includes(req.user.role))
      return res.status(403).json({ success: false, message: 'Not authorized' });

    review.images.forEach(img => {
      if (img.public_id) cloudinary.uploader.destroy(img.public_id).catch(() => {});
    });

    const productId = review.product;
    await review.deleteOne();
    emitSocket(req, 'review:deleted', { reviewId: req.params.id, productId });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
};

// ─── Reviews (Admin) ──────────────────────────────────────────────────────────
exports.getAllReviews = async (req, res, next) => {
  try {
    const page   = Number(req.query.page)   || 1;
    const limit  = Number(req.query.limit)  || 20;
    const status = req.query.status || '';
    const search = req.query.search || '';

    const filter = {};
    if (status) filter.status = status;

    let query = Review.find(filter)
      .populate('user',    'name email avatar')
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 });

    const [all, total] = await Promise.all([
      query.skip((page - 1) * limit).limit(limit),
      Review.countDocuments(filter),
    ]);

    // Client-side search filter on populated fields (for simplicity; search by name/email/product)
    let reviews = all;
    if (search) {
      const q = search.toLowerCase();
      reviews = all.filter(r =>
        r.user?.name?.toLowerCase().includes(q) ||
        r.user?.email?.toLowerCase().includes(q) ||
        r.product?.name?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, reviews, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.updateReviewStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected', 'hidden'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.status = status;
    await review.save();
    await review.populate('user', 'name avatar');
    await review.populate('product', 'name slug');

    emitSocket(req, 'review:statusChanged', { review, productId: review.product?._id });
    res.json({ success: true, review });
  } catch (err) { next(err); }
};

exports.adminDeleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.images.forEach(img => {
      if (img.public_id) cloudinary.uploader.destroy(img.public_id).catch(() => {});
    });

    const productId = review.product;
    await review.deleteOne();
    emitSocket(req, 'review:deleted', { reviewId: req.params.id, productId });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
};

// ─── Categories ───────────────────────────────────────────────────────────────
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    // Attach product count per category
    const withCount = await Promise.all(categories.map(async cat => {
      const count = await Product.countDocuments({ category: cat._id, isActive: true });
      return { ...cat.toObject(), productCount: count };
    }));
    res.json({ success: true, categories: withCount });
  } catch (err) { next(err); }
};

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    const withCount = await Promise.all(categories.map(async cat => {
      const count = await Product.countDocuments({ category: cat._id, isActive: true });
      return { ...cat.toObject(), productCount: count };
    }));
    res.json({ success: true, categories: withCount });
  } catch (err) { next(err); }
};

exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;
    if ('isActive' in data) data.isActive = data.isActive === 'true' || data.isActive === true;
    const category = await Category.create(data);
    emitSocket(req, 'category:created', { category });
    res.status(201).json({ success: true, category });
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;
    if ('isActive' in data) data.isActive = data.isActive === 'true' || data.isActive === true;
    // findByIdAndUpdate skips pre-save hooks, so regenerate slug manually when name changes
    if (data.name) {
      const slugify = require('slugify');
      data.slug = slugify(data.name, { lower: true, strict: true });
    }
    const category = await Category.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    emitSocket(req, 'category:updated', { category });
    res.json({ success: true, category });
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    const pid = cloudinaryPublicId(category.image);
    if (pid) cloudinary.uploader.destroy(pid).catch(() => {});
    await Category.findByIdAndDelete(req.params.id);
    emitSocket(req, 'category:deleted', { categoryId: req.params.id });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};

// ─── Coupons ──────────────────────────────────────────────────────────────────
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount, isFirstOrder } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon || !coupon.isValid())
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon code' });
    if (orderAmount && Number(orderAmount) < coupon.minOrderAmount)
      return res.status(400).json({ success: false, message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}` });
    // first_order coupons require this to be the user's first order
    if (coupon.type === 'first_order' && !isFirstOrder)
      return res.status(400).json({ success: false, message: 'This coupon is valid for first orders only' });
    const discount = orderAmount ? coupon.calculateDiscount(Number(orderAmount)) : 0;
    res.json({
      success: true,
      discount,
      coupon: {
        code:            coupon.code,
        type:            coupon.type,
        value:           coupon.value,
        description:     coupon.description || '',
        discountPercent: ['percentage', 'first_order'].includes(coupon.type) ? coupon.value : null,
        maxDiscount:     coupon.maxDiscount || 0,
        minOrderAmount:  coupon.minOrderAmount,
        freeShipping:    coupon.type === 'free_shipping',
      },
    });
  } catch (err) { next(err); }
};

exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) { next(err); }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (err) { next(err); }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, coupon });
  } catch (err) { next(err); }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) { next(err); }
};

// ─── Stripe Payment Intent ────────────────────────────────────────────────────
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key)
      return res.status(400).json({ success: false, message: 'Stripe secret key is not configured on the server. Add STRIPE_SECRET_KEY to backend/.env' });
    if (!key.startsWith('sk_'))
      return res.status(400).json({ success: false, message: 'Invalid Stripe secret key format. It must start with sk_test_ or sk_live_' });

    const stripe = require('stripe')(key);
    const { amount } = req.body;
    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(Number(amount) * 100),
      currency: 'inr',
      metadata: { userId: req.user.id.toString() },
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    });

    res.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    console.error('Stripe error:', err.message);
    if (err.type === 'StripeAuthenticationError')
      return res.status(400).json({ success: false, message: 'Invalid Stripe API key.' });
    if (err.type === 'StripeInvalidRequestError')
      return res.status(400).json({ success: false, message: `Stripe error: ${err.message}` });
    next(err);
  }
};

// ─── Admin: Users (customers) ─────────────────────────────────────────────────
exports.getAdminUsers = async (req, res, next) => {
  try {
    const page   = Number(req.query.page)  || 1;
    const limit  = Number(req.query.limit) || 20;
    const search = req.query.search || '';
    const filter = { role: 'user' };
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// ─── Admin Management (super_admin only) ──────────────────────────────────────
exports.getAdminList = async (req, res, next) => {
  try {
    const page   = Number(req.query.page)  || 1;
    const limit  = Number(req.query.limit) || 20;
    const search = req.query.search || '';
    const filter = { role: { $in: ['admin', 'moderator', 'super_admin'] } };
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const [admins, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, admins, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.createAdminUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!['admin', 'moderator'].includes(role))
      return res.status(400).json({ success: false, message: 'Role must be admin or moderator' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

    const user = await User.create({ name, email, password, role });
    emitSocket(req, 'user:roleChanged', { userId: user._id, role });
    res.status(201).json({ success: true, user });
  } catch (err) { next(err); }
};

exports.updateAdminRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'moderator'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role. Cannot set super_admin via this endpoint.' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'super_admin')
      return res.status(403).json({ success: false, message: 'Cannot change super admin role' });

    user.role = role;
    await user.save();
    emitSocket(req, 'user:roleChanged', { userId: user._id, role });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.toggleAdminStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'super_admin')
      return res.status(403).json({ success: false, message: 'Cannot suspend super admin' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.deleteAdminUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'super_admin')
      return res.status(403).json({ success: false, message: 'Cannot delete super admin' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Admin user deleted' });
  } catch (err) { next(err); }
};

// ─── Settings ─────────────────────────────────────────────────────────────────
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ success: true, settings });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.files) {
      if (req.files.logo?.[0])            data.storeLogo       = req.files.logo[0].path;
      if (req.files.transparentLogo?.[0]) data.transparentLogo = req.files.transparentLogo[0].path;
      if (req.files.darkLogo?.[0])        data.darkLogo        = req.files.darkLogo[0].path;
      if (req.files.lightLogo?.[0])       data.lightLogo       = req.files.lightLogo[0].path;
      if (req.files.favicon?.[0])         data.storeFavicon    = req.files.favicon[0].path;
    }

    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create(data);
    else { Object.assign(settings, data); await settings.save(); }
    res.json({ success: true, settings });
  } catch (err) { next(err); }
};

// ─── Image Upload ─────────────────────────────────────────────────────────────
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.json({ success: true, image: { url: req.file.path, public_id: req.file.filename } });
  } catch (err) { next(err); }
};

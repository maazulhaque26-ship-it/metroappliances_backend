const DealerCart    = require('../models/DealerCart');
const DealerPricing = require('../models/DealerPricing');
const Product       = require('../models/Product');

// GET /api/dealer/cart
exports.getCart = async (req, res) => {
  try {
    const cart = await DealerCart.findOne({ dealer: req.dealer._id })
      .populate('items.product', 'name slug sku images brand isActive stock');

    res.json({ success: true, cart: cart || { items: [] } });
  } catch (err) {
    console.error('Get dealer cart error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/dealer/cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'productId and quantity are required' });
    }

    // Validate product exists and is active
    const product = await Product.findById(productId).select('name sku images isActive stock');
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Validate pricing is available
    const pricing = await DealerPricing.findOne({ product: productId, dealerVisible: true, isActive: true });
    if (!pricing) {
      return res.status(403).json({ success: false, message: 'Product not available in dealer catalog' });
    }

    // Validate MOQ
    if (quantity < pricing.moq) {
      return res.status(400).json({
        success: false,
        message:  `Minimum order quantity is ${pricing.moq}`,
        moq:      pricing.moq,
      });
    }

    // Validate case pack (qty must be multiple of caseQuantity)
    if (pricing.caseQuantity > 1 && quantity % pricing.caseQuantity !== 0) {
      return res.status(400).json({
        success:      false,
        message:      `Quantity must be a multiple of case quantity (${pricing.caseQuantity})`,
        caseQuantity: pricing.caseQuantity,
      });
    }

    let cart = await DealerCart.findOne({ dealer: req.dealer._id });
    if (!cart) {
      cart = new DealerCart({ dealer: req.dealer._id, items: [] });
    }

    const existingIdx = cart.items.findIndex(i => i.product.toString() === productId);
    if (existingIdx >= 0) {
      cart.items[existingIdx].quantity     = quantity;
      cart.items[existingIdx].dealerPrice  = pricing.dealerPrice;
      cart.items[existingIdx].mrp          = pricing.mrp;
      cart.items[existingIdx].moq          = pricing.moq;
      cart.items[existingIdx].caseQuantity = pricing.caseQuantity;
    } else {
      cart.items.push({
        product:      productId,
        quantity,
        dealerPrice:  pricing.dealerPrice,
        mrp:          pricing.mrp,
        moq:          pricing.moq,
        caseQuantity: pricing.caseQuantity,
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name slug sku images brand');

    res.json({ success: true, message: 'Added to cart', cart });
  } catch (err) {
    console.error('Add to dealer cart error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/dealer/cart/:itemId
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId }   = req.params;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Valid quantity required' });
    }

    const cart = await DealerCart.findOne({ dealer: req.dealer._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found in cart' });

    // Re-validate MOQ + case pack
    if (quantity < item.moq) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity is ${item.moq}`,
        moq:     item.moq,
      });
    }
    if (item.caseQuantity > 1 && quantity % item.caseQuantity !== 0) {
      return res.status(400).json({
        success:      false,
        message:      `Quantity must be a multiple of case quantity (${item.caseQuantity})`,
        caseQuantity: item.caseQuantity,
      });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product', 'name slug sku images brand');

    res.json({ success: true, message: 'Cart updated', cart });
  } catch (err) {
    console.error('Update dealer cart error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/dealer/cart/:itemId
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await DealerCart.findOne({ dealer: req.dealer._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    await cart.save();
    await cart.populate('items.product', 'name slug sku images brand');

    res.json({ success: true, message: 'Item removed', cart });
  } catch (err) {
    console.error('Remove from dealer cart error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/dealer/cart
exports.clearCart = async (req, res) => {
  try {
    await DealerCart.findOneAndUpdate({ dealer: req.dealer._id }, { items: [] });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    console.error('Clear dealer cart error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

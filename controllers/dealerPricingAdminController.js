const DealerPricing = require('../models/DealerPricing');
const Product       = require('../models/Product');

// GET /api/admin/dealer-pricing
exports.getAllPricings = async (req, res) => {
  try {
    const {
      page   = 1,
      limit  = 20,
      tab    = 'priced',   // 'priced' | 'unpriced'
      search,
      visible,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    if (tab === 'unpriced') {
      // Products WITHOUT a DealerPricing record
      const pricedIds = await DealerPricing.distinct('product');
      const filter    = { _id: { $nin: pricedIds }, isActive: true };
      if (search) {
        filter.$or = [
          { name:  { $regex: search, $options: 'i' } },
          { sku:   { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
        ];
      }
      const total    = await Product.countDocuments(filter);
      const products = await Product.find(filter)
        .select('name sku brand price images isActive')
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      return res.json({
        success: true,
        tab:     'unpriced',
        products,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
      });
    }

    // 'priced' tab
    const filter = {};
    if (visible !== undefined) filter.dealerVisible = visible === 'true';

    const total    = await DealerPricing.countDocuments(filter);
    const pricings = await DealerPricing.find(filter)
      .populate('product', 'name sku brand price images isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Filter by search after populate (product name/sku/brand)
    let results = pricings;
    if (search) {
      const s = search.toLowerCase();
      results = pricings.filter(p =>
        p.product?.name?.toLowerCase().includes(s) ||
        p.product?.sku?.toLowerCase().includes(s)  ||
        p.product?.brand?.toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      tab:     'priced',
      pricings: results,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('Admin get dealer pricings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/dealer-pricing/:productId
exports.getPricingByProduct = async (req, res) => {
  try {
    const pricing = await DealerPricing.findOne({ product: req.params.productId })
      .populate('product', 'name sku brand price images');

    if (!pricing) return res.status(404).json({ success: false, message: 'No pricing found for this product' });

    res.json({ success: true, pricing });
  } catch (err) {
    console.error('Get dealer pricing by product error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-pricing  — create or update (upsert)
exports.upsertPricing = async (req, res) => {
  try {
    const {
      productId,
      mrp,
      dealerPrice,
      distributorPrice,
      moq,
      caseQuantity,
      bulkDiscounts,
      dealerVisible,
      isActive,
      notes,
    } = req.body;

    if (!productId || mrp === undefined || dealerPrice === undefined) {
      return res.status(400).json({ success: false, message: 'productId, mrp, and dealerPrice are required' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const pricing = await DealerPricing.findOneAndUpdate(
      { product: productId },
      {
        mrp,
        dealerPrice,
        distributorPrice: distributorPrice ?? null,
        moq:          moq ?? 1,
        caseQuantity: caseQuantity ?? 1,
        bulkDiscounts: bulkDiscounts ?? [],
        dealerVisible: dealerVisible !== undefined ? dealerVisible : true,
        isActive:      isActive !== undefined ? isActive : true,
        notes:         notes || '',
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Pricing saved', pricing });
  } catch (err) {
    console.error('Upsert dealer pricing error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// DELETE /api/admin/dealer-pricing/:id
exports.deletePricing = async (req, res) => {
  try {
    await DealerPricing.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Pricing deleted' });
  } catch (err) {
    console.error('Delete dealer pricing error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/admin/dealer-pricing/:id/visibility
exports.toggleVisibility = async (req, res) => {
  try {
    const pricing = await DealerPricing.findById(req.params.id);
    if (!pricing) return res.status(404).json({ success: false, message: 'Pricing not found' });

    pricing.dealerVisible = !pricing.dealerVisible;
    await pricing.save();

    res.json({ success: true, dealerVisible: pricing.dealerVisible });
  } catch (err) {
    console.error('Toggle dealer pricing visibility error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

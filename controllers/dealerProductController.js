const DealerPricing = require('../models/DealerPricing');
const Product       = require('../models/Product');

// GET /api/dealer/products
exports.getDealerProducts = async (req, res) => {
  try {
    const {
      page     = 1,
      limit    = 24,
      search,
      category,
      brand,
      sort     = 'name',
    } = req.query;

    // Step 1 — get visible product IDs from DealerPricing
    const pricingFilter = { dealerVisible: true, isActive: true };
    const visiblePricings = await DealerPricing.find(pricingFilter).select('product mrp dealerPrice distributorPrice moq caseQuantity bulkDiscounts');

    const visibleProductIds = visiblePricings.map(p => p.product);

    // Build pricing lookup map
    const pricingMap = {};
    visiblePricings.forEach(p => {
      pricingMap[p.product.toString()] = p;
    });

    // Step 2 — query Product collection with optional filters
    const productFilter = {
      _id:      { $in: visibleProductIds },
      isActive: true,
    };

    if (search) {
      productFilter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { sku:   { $regex: search, $options: 'i' } },
      ];
    }
    if (category) productFilter.category = category;
    if (brand)    productFilter.brand     = { $regex: brand, $options: 'i' };

    const sortMap = {
      name:          { name: 1 },
      '-name':       { name: -1 },
      price:         { price: 1 },
      '-price':      { price: -1 },
      newest:        { createdAt: -1 },
    };
    const sortObj = sortMap[sort] || { name: 1 };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(productFilter);

    const products = await Product.find(productFilter)
      .populate('category', 'name slug')
      .select('name slug sku brand category images price discountPrice stock isActive')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Step 3 — attach dealer pricing to each product
    const enriched = products.map(p => {
      const pricing = pricingMap[p._id.toString()];
      return {
        ...p,
        dealerPricing: pricing
          ? {
              mrp:              pricing.mrp,
              dealerPrice:      pricing.dealerPrice,
              distributorPrice: pricing.distributorPrice,
              moq:              pricing.moq,
              caseQuantity:     pricing.caseQuantity,
              bulkDiscounts:    pricing.bulkDiscounts,
            }
          : null,
      };
    });

    res.json({
      success: true,
      products: enriched,
      pagination: {
        page:       Number(page),
        limit:      Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Dealer products error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/dealer/products/:slug
exports.getDealerProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const pricing = await DealerPricing.findOne({
      product:       product._id,
      dealerVisible: true,
      isActive:      true,
    });

    if (!pricing) {
      return res.status(403).json({ success: false, message: 'Product not available in dealer catalog' });
    }

    res.json({
      success: true,
      product: {
        ...product,
        dealerPricing: {
          mrp:              pricing.mrp,
          dealerPrice:      pricing.dealerPrice,
          distributorPrice: pricing.distributorPrice,
          moq:              pricing.moq,
          caseQuantity:     pricing.caseQuantity,
          bulkDiscounts:    pricing.bulkDiscounts,
          notes:            pricing.notes,
        },
      },
    });
  } catch (err) {
    console.error('Dealer product detail error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/dealer/products/filters  — return available brands + categories
exports.getDealerProductFilters = async (req, res) => {
  try {
    const visiblePricings = await DealerPricing.find({ dealerVisible: true, isActive: true }).select('product');
    const ids = visiblePricings.map(p => p.product);

    const products = await Product.find({ _id: { $in: ids }, isActive: true })
      .populate('category', 'name slug _id')
      .select('brand category')
      .lean();

    const brandSet    = new Set();
    const categoryMap = {};
    products.forEach(p => {
      if (p.brand) brandSet.add(p.brand);
      if (p.category) categoryMap[p.category._id] = p.category;
    });

    res.json({
      success:    true,
      brands:     [...brandSet].sort(),
      categories: Object.values(categoryMap),
    });
  } catch (err) {
    console.error('Dealer product filters error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

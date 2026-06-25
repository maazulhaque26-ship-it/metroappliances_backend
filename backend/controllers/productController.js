const Product = require('../models/Product');
const { Cart, Wishlist } = require('../models/index');

function emitSocket(req, event, data) {
  try { req.app.locals.io?.emit(event, data); } catch (_) {}
}

exports.getProducts = async (req, res, next) => {
  try {
    const {
      keyword, search,                      // accept both
      category, brand, minPrice, maxPrice,
      rating, minRating,                    // accept both
      inStock, featured, newArrival, dealOfDay, bestSeller,
      sort, page = 1, limit = 12,
    } = req.query;

    const query = { isActive: true };

    // Text search — accept `keyword` (legacy) or `search` (new frontend)
    const searchTerm = search || keyword;
    if (searchTerm) {
      query.$or = [
        { name:        { $regex: searchTerm, $options: 'i' } },
        { brand:       { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (category) {
      // Accept slug (e.g. "refrigerators") or ObjectId
      const Category = require('../models/Category');
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) query.category = cat._id;
        else query.category = null; // no match → empty result
      }
    }

    if (brand) query.brand = { $in: brand.split(',').map(b => new RegExp(`^${b}$`, 'i')) };

    if (minPrice || maxPrice) {
      query.$and = query.$and || [];
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : Infinity;
      // Filter on the price the customer actually pays:
      //   - discountPrice when it is > 0 (that is the displayed/selling price)
      //   - price otherwise
      query.$and.push({
        $or: [
          { discountPrice: { $gt: 0, $gte: min, ...(max !== Infinity && { $lte: max }) } },
          { $and: [{ $or: [{ discountPrice: 0 }, { discountPrice: { $exists: false } }] },
                   { price: { $gte: min, ...(max !== Infinity && { $lte: max }) } }] },
        ],
      });
    }

    // Accept `rating` (legacy) or `minRating` (new frontend)
    const ratingFilter = minRating || rating;
    if (ratingFilter) query.ratings = { $gte: Number(ratingFilter) };

    if (inStock === 'true')      query.stock       = { $gt: 0 };
    if (featured === 'true')     query.isFeatured  = true;
    if (newArrival === 'true')   query.isNewArrival = true;
    if (dealOfDay === 'true')    query.isDealOfDay  = true;
    if (bestSeller === 'true')   query.isBestSeller = true;

    // Accept named sort (legacy) OR Mongoose-style sort string (new frontend)
    const sortMap = {
      newest:       { createdAt: -1 },
      popular:      { numReviews: -1 },
      rating:       { ratings: -1 },
      'price-low':  { price: 1 },
      'price-high': { price: -1 },
      discount:     { discountPrice: -1 },
      // New frontend format (MongoDB-style)
      '-createdAt': { createdAt: -1 },
      'createdAt':  { createdAt: 1 },
      '-price':     { price: -1 },
      'price':      { price: 1 },
      '-ratings':   { ratings: -1 },
      '-numReviews':{ numReviews: -1 },
      '-averageRating': { ratings: -1 },
      '-reviewCount':   { numReviews: -1 },
      '-discountPrice': { discountPrice: -1 },
    };
    const sortBy = sortMap[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).populate('category', 'name slug').sort(sortBy).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

exports.getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('category', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate('category', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const data = { ...req.body };
    const files = req.files || [];

    // Multipart/form-data sends booleans as strings — coerce them explicitly
    const BOOL_FIELDS = ['isActive', 'isFeatured', 'isNewArrival', 'isDealOfDay', 'isBestSeller', 'hasVariants'];
    BOOL_FIELDS.forEach(f => {
      if (f in data) data[f] = data[f] === 'true' || data[f] === true;
    });

    // Base product images (fieldname === 'images')
    const baseFiles = files.filter(f => f.fieldname === 'images');
    if (baseFiles.length > 0) {
      data.images = baseFiles.map(f => ({ url: f.path, public_id: f.filename }));
    }

    if (typeof data.specs === 'string') data.specs = JSON.parse(data.specs);
    if (typeof data.tags === 'string')  data.tags = data.tags.split(',').map(t => t.trim());

    // Parse variants and attach uploaded images per variant index
    if (typeof data.variants === 'string') data.variants = JSON.parse(data.variants);
    if (Array.isArray(data.variants) && data.variants.length > 0) {
      data.variants = data.variants.map((v, i) => {
        const varFiles = files.filter(f => f.fieldname === `variantImages_${i}`);
        if (varFiles.length > 0) {
          v.images = [
            ...(v.images || []),
            ...varFiles.map(f => ({ url: f.path, public_id: f.filename })),
          ];
        }
        return v;
      });
      // Variant product — always derive product-level values from variant data
      data.hasVariants    = true;
      data.price          = Math.min(...data.variants.map(v => Number(v.price) || 0));
      const discPrices    = data.variants.filter(v => Number(v.discountPrice) > 0).map(v => Number(v.discountPrice));
      data.discountPrice  = discPrices.length > 0 ? Math.min(...discPrices) : 0;
      data.stock          = data.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
    } else {
      // Simple product — no variants
      data.hasVariants = false;
      if (Array.isArray(data.variants)) data.variants = [];
    }

    // Image count guard — non-variant products require 1–6 base images
    if (!data.hasVariants) {
      const imgCount = data.images?.length || 0;
      if (imgCount < 1) return res.status(400).json({ success: false, message: 'At least 1 product image is required' });
      if (imgCount > 6) return res.status(400).json({ success: false, message: 'Maximum 6 product images are allowed' });
    }

    const product = await Product.create(data);
    await product.populate('category', 'name slug');
    emitSocket(req, 'product:created', { product });
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const data = { ...req.body };
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Multipart/form-data sends booleans as strings — coerce them explicitly
    const BOOL_FIELDS = ['isActive', 'isFeatured', 'isNewArrival', 'isDealOfDay', 'isBestSeller', 'hasVariants'];
    BOOL_FIELDS.forEach(f => {
      if (f in data) data[f] = data[f] === 'true' || data[f] === true;
    });

    const files = req.files || [];

    // Base product images — merge kept existing + new uploads
    const baseFiles = files.filter(f => f.fieldname === 'images');
    if (baseFiles.length > 0 || data.existingImages !== undefined) {
      let existing = [];
      if (data.existingImages) {
        existing = typeof data.existingImages === 'string' ? JSON.parse(data.existingImages) : data.existingImages;
      }
      data.images = [
        ...existing,
        ...baseFiles.map(f => ({ url: `/uploads/products/${f.filename}`, public_id: f.filename })),
      ];
    }

    if (typeof data.specs === 'string') data.specs = JSON.parse(data.specs);
    if (typeof data.tags === 'string')  data.tags = data.tags.split(',').map(t => t.trim());
    delete data.existingImages;

    // Parse variants and merge existing images with new uploads per index
    if (typeof data.variants === 'string') data.variants = JSON.parse(data.variants);
    if (Array.isArray(data.variants) && data.variants.length > 0) {
      data.variants = data.variants.map((v, i) => {
        const varFiles = files.filter(f => f.fieldname === `variantImages_${i}`);
        if (varFiles.length > 0) {
          v.images = [
            ...(v.images || []),
            ...varFiles.map(f => ({ url: f.path, public_id: f.filename })),
          ];
        }
        return v;
      });
      // Variant product — derive product-level values from variant data (single source of truth)
      data.hasVariants   = true;
      data.price         = Math.min(...data.variants.map(v => Number(v.price) || 0));
      const discPrices   = data.variants.filter(v => Number(v.discountPrice) > 0).map(v => Number(v.discountPrice));
      data.discountPrice = discPrices.length > 0 ? Math.min(...discPrices) : 0;
      data.stock         = data.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
    } else if (Array.isArray(data.variants)) {
      // Simple product — clear any leftover variants
      data.hasVariants = false;
      data.variants    = [];
    }

    // Image count guard — only checked when images are being updated on a non-variant product
    const updatedHasVariants = 'hasVariants' in data ? data.hasVariants : product.hasVariants;
    if (!updatedHasVariants && data.images !== undefined) {
      const imgCount = data.images.length;
      if (imgCount < 1) return res.status(400).json({ success: false, message: 'At least 1 product image is required' });
      if (imgCount > 6) return res.status(400).json({ success: false, message: 'Maximum 6 product images are allowed' });
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
      .populate('category', 'name slug');
    emitSocket(req, 'product:updated', { product: updated });
    res.json({ success: true, product: updated });
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Leave image files on disk — past orders store an `image` snapshot string
    // pointing at this same file. Deleting it here permanently breaks the
    // order's product photo with no way to recover it later.

    const productId = product._id;
    await product.deleteOne();

    // Cascade: remove deleted product from all carts and wishlists
    await Cart.updateMany(
      { 'items.product': productId },
      { $pull: { items: { product: productId } } }
    );
    await Wishlist.updateMany(
      { products: productId },
      { $pull: { products: productId } }
    );

    emitSocket(req, 'product:deleted', { productId: productId.toString() });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
};

exports.getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const products = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    }).limit(8);
    res.json({ success: true, products });
  } catch (err) { next(err); }
};

exports.getAdminProducts = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).populate('category', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);
    res.json({ success: true, products, total });
  } catch (err) { next(err); }
};

exports.getBrands = async (req, res, next) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    res.json({ success: true, brands: brands.sort() });
  } catch (err) { next(err); }
};

exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const images = req.files.map(f => ({ url: f.path, public_id: f.filename }));
    res.json({ success: true, images });
  } catch (err) { next(err); }
};
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  FiX, FiHeart, FiShoppingCart, FiArrowRight, FiChevronLeft, FiChevronRight,
  FiCheck, FiPackage,
} from 'react-icons/fi';
import API from '../../services/api';
import { addToCart, toggleWishlist } from '../../redux/slices/shopSlices';
import StarRating from './StarRating';
import { imgSrc } from '../../utils/imageHelper';

function QuickViewSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-0">
      <div className="aspect-square skeleton" style={{ borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }} />
      <div className="p-8 space-y-4">
        <div className="skeleton h-3 w-1/4" style={{ borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton h-6 w-3/4" style={{ borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton h-4 w-1/3" style={{ borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton h-3 w-full" style={{ borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton h-3 w-4/5" style={{ borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton h-3 w-2/3" style={{ borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton h-12 w-full mt-6" style={{ borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton h-10 w-full" style={{ borderRadius: 'var(--radius-sm)' }} />
      </div>
    </div>
  );
}

// Resolve variant groups from the variants array
function buildGroups(variants = []) {
  const groups = {};
  variants.forEach(v => {
    ['color', 'size', 'storage', 'material', 'weight'].forEach(attr => {
      if (v[attr]) {
        if (!groups[attr]) groups[attr] = new Set();
        groups[attr].add(v[attr]);
      }
    });
  });
  return Object.entries(groups).map(([key, vals]) => ({ key, values: [...vals] }));
}

function findVariant(variants, selections) {
  return variants.find(v =>
    Object.entries(selections).every(([k, val]) => v[k] === val)
  );
}

export default function QuickView({ slug, onClose }) {
  const dispatch = useDispatch();
  const { token } = useSelector(s => s.auth);
  const { products: wishItems } = useSelector(s => s.wishlist);

  const [product,    setProduct]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [imgIdx,     setImgIdx]     = useState(0);
  const [selections, setSelections] = useState({});
  const [adding,     setAdding]     = useState(false);

  useEffect(() => {
    setLoading(true);
    API.get(`/products/slug/${slug}`)
      .then(res => {
        const p = res.data.product;
        setProduct(p);
        // Pre-select first value in each variant group
        if (p.variants?.length > 0) {
          const groups = buildGroups(p.variants);
          const initial = {};
          groups.forEach(g => { initial[g.key] = g.values[0]; });
          setSelections(initial);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // ESC closes
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const inWishlist = wishItems?.some(p =>
    p._id === product?._id || p === product?._id
  );

  const hasVariants  = product?.hasVariants || product?.variants?.length > 0;
  const groups       = hasVariants ? buildGroups(product.variants) : [];
  const selVariant   = hasVariants ? findVariant(product.variants, selections) : null;

  const displayPrice = selVariant
    ? (selVariant.discountPrice > 0 ? selVariant.discountPrice : selVariant.price)
    : hasVariants
      ? Math.min(...(product?.variants || []).map(v => (v.discountPrice > 0 ? v.discountPrice : v.price) || 0))
      : (product?.discountPrice > 0 ? product.discountPrice : product?.price);

  const originalPrice = selVariant
    ? (selVariant.discountPrice > 0 ? selVariant.price : null)
    : (!hasVariants && product?.discountPrice > 0 ? product.price : null);

  const stockCount  = selVariant ? selVariant.stock : (product?.stock ?? 0);
  const outOfStock  = hasVariants
    ? (selVariant ? selVariant.stock === 0 : product?.variants?.every(v => v.stock === 0))
    : product?.stock === 0;
  const limitedStock = !outOfStock && stockCount > 0 && stockCount <= 5;

  const images = selVariant?.images?.length > 0
    ? selVariant.images
    : product?.images || [];

  const handleAddToCart = useCallback(async () => {
    if (!token) { toast.info('Sign in to add to cart'); return; }
    if (outOfStock) { toast.error('Out of stock'); return; }
    if (hasVariants && !selVariant) { toast.info('Select options first'); return; }
    try {
      setAdding(true);
      const payload = { productId: product._id, quantity: 1 };
      if (selVariant) payload.variantId = selVariant._id;
      await dispatch(addToCart(payload)).unwrap();
      toast.success('Added to cart');
    } catch (err) { toast.error(err || 'Failed'); }
    finally { setAdding(false); }
  }, [token, outOfStock, hasVariants, selVariant, product, dispatch]);

  const handleWishlist = useCallback(async () => {
    if (!token) { toast.info('Sign in to save items'); return; }
    try {
      await dispatch(toggleWishlist(product._id)).unwrap();
      toast.success(inWishlist ? 'Removed from wishlist' : 'Saved to wishlist');
    } catch { toast.error('Failed to update wishlist'); }
  }, [token, product, inWishlist, dispatch]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(17,17,17,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-liftIn no-scrollbar"
        style={{
          background:   'var(--card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow:    'var(--shadow-xl)',
          border:       '1px solid var(--border)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center transition-colors"
          style={{
            background:   'var(--bg)',
            border:       '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color:        'var(--text-3)',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
        >
          <FiX size={16} strokeWidth={2} />
        </button>

        {loading ? (
          <QuickViewSkeleton />
        ) : !product ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <FiPackage size={40} style={{ color: 'var(--text-5)' }} aria-hidden="true" />
            <p className="font-semibold text-sm" style={{ color: 'var(--text-3)' }}>Product not found</p>
            <button onClick={onClose} className="btn btn-outline text-xs">Close</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-0">
            {/* ── Gallery ──────────────────────────────────────── */}
            <div
              className="relative"
              style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)' }}
            >
              <div className="relative aspect-square overflow-hidden" style={{ borderRadius: 'var(--radius-lg) 0 0 0' }}>
                {images.length > 0 ? (
                  <img
                    src={imgSrc(images[imgIdx])}
                    alt={product.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiPackage size={48} style={{ color: 'var(--text-5)' }} aria-hidden="true" />
                  </div>
                )}

                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-all"
                      style={{
                        background:   'rgba(255,255,255,0.9)',
                        borderRadius: 'var(--radius-sm)',
                        border:       '1px solid var(--border)',
                        color:        'var(--text)',
                      }}
                    >
                      <FiChevronLeft size={16} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => setImgIdx(i => (i + 1) % images.length)}
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-all"
                      style={{
                        background:   'rgba(255,255,255,0.9)',
                        borderRadius: 'var(--radius-sm)',
                        border:       '1px solid var(--border)',
                        color:        'var(--text)',
                      }}
                    >
                      <FiChevronRight size={16} strokeWidth={2} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar" style={{ borderTop: '1px solid var(--border)' }}>
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      aria-label={`Image ${i + 1}`}
                      className="flex-shrink-0 w-14 h-14 overflow-hidden transition-all"
                      style={{
                        borderRadius: 'var(--radius-sm)',
                        border:       `2px solid ${i === imgIdx ? 'var(--text)' : 'var(--border)'}`,
                        background:   'var(--bg)',
                        opacity:      i === imgIdx ? 1 : 0.65,
                      }}
                    >
                      <img src={imgSrc(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Info ─────────────────────────────────────────── */}
            <div className="p-7 flex flex-col gap-5 overflow-y-auto no-scrollbar" style={{ maxHeight: '90vh' }}>
              {/* Category */}
              {product.category?.name && (
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: 'var(--accent)' }}
                >
                  {product.category.name}
                </span>
              )}

              {/* Name */}
              <h2
                className="leading-tight"
                style={{
                  fontFamily:    'var(--font-display)',
                  fontWeight:    800,
                  fontSize:      'clamp(18px, 3vw, 22px)',
                  color:         'var(--text)',
                  letterSpacing: '-0.02em',
                }}
              >
                {product.name}
              </h2>

              {/* Rating */}
              {(product.ratings > 0 || product.numReviews > 0) && (
                <div className="flex items-center gap-2">
                  <StarRating rating={product.ratings || 0} showCount={false} size={12} />
                  {product.numReviews > 0 && (
                    <span className="text-[12px]" style={{ color: 'var(--text-4)' }}>
                      ({product.numReviews} reviews)
                    </span>
                  )}
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3">
                {hasVariants && !selVariant && (
                  <span className="text-[12px]" style={{ color: 'var(--text-4)' }}>From</span>
                )}
                <span
                  className="font-bold"
                  style={{
                    fontFamily:    'var(--font-numbers)',
                    fontSize:      'clamp(22px, 4vw, 28px)',
                    color:         'var(--text)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  ₹{displayPrice?.toLocaleString('en-IN')}
                </span>
                {originalPrice && (
                  <span
                    className="text-[14px] line-through"
                    style={{ fontFamily: 'var(--font-numbers)', color: 'var(--text-4)' }}
                  >
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {originalPrice && (
                  <span
                    className="text-[11px] font-bold px-2 py-0.5"
                    style={{
                      background:   'var(--accent)',
                      color:        '#fff',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}% OFF
                  </span>
                )}
              </div>

              {/* Stock status */}
              <div className="flex items-center gap-2">
                {outOfStock ? (
                  <span className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>
                    Out of Stock
                  </span>
                ) : limitedStock ? (
                  <span className="text-[12px] font-semibold flex items-center gap-1.5" style={{ color: '#D97706' }}>
                    <FiPackage size={12} aria-hidden="true" /> Only {stockCount} left
                  </span>
                ) : (
                  <span className="text-[12px] font-semibold flex items-center gap-1.5" style={{ color: '#16A34A' }}>
                    <FiCheck size={12} aria-hidden="true" /> In Stock
                  </span>
                )}
              </div>

              {/* Variant selector */}
              {hasVariants && groups.length > 0 && (
                <div className="space-y-4">
                  {groups.map(({ key, values }) => (
                    <div key={key}>
                      <p
                        className="text-[10px] font-bold uppercase tracking-widest mb-2"
                        style={{ color: 'var(--text-4)' }}
                      >
                        {key}: <span style={{ color: 'var(--text)' }}>{selections[key] || '—'}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {values.map(val => {
                          const active = selections[key] === val;
                          const v = findVariant(product.variants, { ...selections, [key]: val });
                          const unavail = v && v.stock === 0;
                          return (
                            <button
                              key={val}
                              onClick={() => setSelections(s => ({ ...s, [key]: val }))}
                              disabled={unavail}
                              className="px-3 py-1.5 text-[12px] font-semibold transition-all"
                              style={{
                                border:       `1.5px solid ${active ? 'var(--text)' : 'var(--border)'}`,
                                background:   active ? 'var(--text)' : 'var(--card)',
                                color:        active ? '#fff' : unavail ? 'var(--text-5)' : 'var(--text)',
                                borderRadius: 'var(--radius-sm)',
                                textDecoration: unavail ? 'line-through' : 'none',
                                cursor:       unavail ? 'not-allowed' : 'pointer',
                                opacity:      unavail ? 0.6 : 1,
                              }}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Short description */}
              {product.description && (
                <p
                  className="text-[13px] leading-relaxed line-clamp-3"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                >
                  {product.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 mt-auto">
                <button
                  onClick={handleAddToCart}
                  disabled={outOfStock || adding}
                  className="btn btn-primary w-full justify-center gap-2"
                >
                  {adding ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding…</>
                  ) : outOfStock ? (
                    'Out of Stock'
                  ) : (
                    <><FiShoppingCart size={15} aria-hidden="true" /> Add to Cart</>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleWishlist}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-all"
                    style={{
                      background:   inWishlist ? 'var(--accent-dim)' : 'var(--bg)',
                      border:       `1.5px solid ${inWishlist ? 'var(--accent-border)' : 'var(--border)'}`,
                      color:        inWishlist ? 'var(--accent)' : 'var(--text-3)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <FiHeart size={14} fill={inWishlist ? 'currentColor' : 'none'} aria-hidden="true" />
                    {inWishlist ? 'Saved' : 'Wishlist'}
                  </button>
                  <Link
                    to={`/products/${slug}`}
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-all"
                    style={{
                      background:   'var(--bg)',
                      border:       '1.5px solid var(--border)',
                      color:        'var(--text-3)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
                  >
                    View Full <FiArrowRight size={13} strokeWidth={2.5} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

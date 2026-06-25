import React, { useState, useCallback, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiHeart, FiArrowRight, FiEye, FiBarChart2, FiShare2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { addToCart, toggleWishlist } from '../../redux/slices/shopSlices';
import { addToCompare, removeFromCompare } from '../../redux/slices/compareSlice';
import StarRating from './StarRating';
import { imgSrc } from '../../utils/imageHelper';

// Lazy-load QuickView — only downloads when first opened
const QuickView = lazy(() => import('./QuickView'));

export default function ProductCard({ product }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { token } = useSelector(s => s.auth);
  const { products: wishItems }  = useSelector(s => s.wishlist);
  const compareItems             = useSelector(s => s.compare.items);
  const [adding,    setAdding]    = useState(false);
  const [showQV,    setShowQV]    = useState(false);
  const [hovered,   setHovered]   = useState(false);

  if (!product) return null;

  const {
    _id, name, slug, price, discountPrice,
    images, ratings, numReviews,
    isBestSeller, isNewArrival, isFeatured, stock,
    variants, hasVariants: productHasVariants,
  } = product;

  const hasVariants   = productHasVariants || (variants && variants.length > 0);
  const displayPrice  = hasVariants
    ? Math.min(...variants.map(v => (v.discountPrice > 0 ? v.discountPrice : v.price) || 0))
    : (discountPrice > 0 ? discountPrice : price);
  const hasDiscount   = !hasVariants && discountPrice > 0 && discountPrice < price;
  const discountPct   = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;
  const inWishlist    = wishItems?.some(p => p._id === _id || p === _id);
  const inCompare     = compareItems.some(p => p._id === _id);
  const outOfStock    = hasVariants ? variants.every(v => v.stock === 0) : stock === 0;
  const limitedStock  = !outOfStock && !hasVariants && stock > 0 && stock <= 5;
  const thumbnail     = imgSrc(images?.[0]);

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!token)     { toast.info('Sign in to add to cart'); return; }
    if (outOfStock) { toast.error('Currently out of stock'); return; }
    try {
      setAdding(true);
      await dispatch(addToCart({ productId: _id, quantity: 1 })).unwrap();
      toast.success('Added to cart');
    } catch (err) { toast.error(err || 'Failed to add to cart'); }
    finally { setAdding(false); }
  }, [token, _id, outOfStock, dispatch]);

  const handleWishlist = useCallback(async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!token) { toast.info('Sign in to save items'); return; }
    try {
      await dispatch(toggleWishlist(_id)).unwrap();
      toast.success(inWishlist ? 'Removed from wishlist' : 'Saved to wishlist');
    } catch { toast.error('Failed to update wishlist'); }
  }, [token, _id, inWishlist, dispatch]);

  const handleCompare = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    if (inCompare) {
      dispatch(removeFromCompare(_id));
      toast.info('Removed from compare');
    } else {
      if (compareItems.length >= 4) {
        toast.warning('Compare up to 4 products at a time');
        return;
      }
      dispatch(addToCompare(product));
      toast.success('Added to compare');
    }
  }, [inCompare, compareItems.length, _id, product, dispatch]);

  const handleShare = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/products/${slug}`;
    if (navigator.share) {
      navigator.share({ title: name, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => toast.success('Link copied!')).catch(() => {});
    }
  }, [slug, name]);

  const handleQuickView = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setShowQV(true);
  }, []);

  return (
    <>
      <div
        className="group cursor-pointer flex flex-col h-full"
        onClick={() => navigate(`/products/${slug}`)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background:   'var(--card)',
          border:       '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          transition:   'transform 0.28s var(--ease), box-shadow 0.28s var(--ease), border-color 0.28s var(--ease)',
          transform:    hovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow:    hovered ? 'var(--shadow-lg)' : 'none',
          borderColor:  hovered ? 'var(--border-hover)' : 'var(--border)',
        }}
      >
        {/* ── Image ──────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio:  '4/5',
            background:   'var(--bg-2)',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
          }}
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover mix-blend-multiply"
              style={{
                transition: 'transform 0.65s var(--ease)',
                transform:  hovered ? 'scale(1.05)' : 'scale(1)',
                filter:     outOfStock ? 'grayscale(0.6) opacity(0.55)' : 'none',
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-5)' }}>
                NO IMAGE
              </span>
            </div>
          )}

          {/* ── Badges ──────────────────────────────────────────── */}
          <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5">
            {discountPct > 0 && (
              <span
                className="px-2 py-0.5 text-white text-[9px] font-bold tracking-widest uppercase"
                style={{ background: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}
              >
                -{discountPct}%
              </span>
            )}
            {isNewArrival && !outOfStock && (
              <span
                className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase"
                style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
              >
                NEW
              </span>
            )}
            {isBestSeller && !outOfStock && (
              <span
                className="px-2 py-0.5 text-white text-[9px] font-bold tracking-widest uppercase"
                style={{ background: 'var(--text)', borderRadius: 'var(--radius-sm)' }}
              >
                HOT
              </span>
            )}
            {isFeatured && !isBestSeller && !isNewArrival && !outOfStock && (
              <span
                className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-sm)' }}
              >
                FEATURED
              </span>
            )}
            {limitedStock && (
              <span
                className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase"
                style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 'var(--radius-sm)' }}
              >
                LIMITED
              </span>
            )}
            {outOfStock && (
              <span
                className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase"
                style={{ background: 'var(--bg-2)', color: 'var(--text-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
              >
                SOLD OUT
              </span>
            )}
          </div>

          {/* ── Wishlist (always visible) ──────────────────────── */}
          <button
            onClick={handleWishlist}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center transition-all duration-200"
            style={{
              background:   inWishlist ? 'var(--accent)' : 'var(--card)',
              border:       `1px solid ${inWishlist ? 'var(--accent)' : 'var(--border)'}`,
              color:        inWishlist ? '#fff' : 'var(--text-3)',
              borderRadius: 'var(--radius-sm)',
              boxShadow:    'var(--shadow-sm)',
            }}
            onMouseEnter={e => { if (!inWishlist) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; } }}
            onMouseLeave={e => { if (!inWishlist) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; } }}
          >
            <FiHeart size={13} strokeWidth={2} fill={inWishlist ? 'currentColor' : 'none'} />
          </button>

          {/* ── Hover action bar (desktop) ──────────────────────── */}
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 px-3 py-3"
            style={{
              background:  'linear-gradient(to top, rgba(255,255,255,0.97) 60%, rgba(255,255,255,0))',
              opacity:     hovered ? 1 : 0,
              transform:   hovered ? 'translateY(0)' : 'translateY(8px)',
              transition:  'opacity 0.22s var(--ease), transform 0.22s var(--ease)',
              pointerEvents: hovered ? 'auto' : 'none',
            }}
          >
            <button
              onClick={handleQuickView}
              aria-label={`Quick view ${name}`}
              title="Quick View"
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all"
              style={{
                background:   'var(--text)',
                color:        '#fff',
                borderRadius: 'var(--radius-sm)',
                flexShrink:   0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#333'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--text)'}
            >
              <FiEye size={12} strokeWidth={2} aria-hidden="true" /> Quick View
            </button>
            <button
              onClick={handleCompare}
              aria-label={inCompare ? 'Remove from compare' : `Compare ${name}`}
              title={inCompare ? 'Remove from compare' : 'Add to compare'}
              className="w-8 h-8 flex items-center justify-center transition-all"
              style={{
                background:   inCompare ? 'var(--accent)' : 'var(--card)',
                border:       `1px solid ${inCompare ? 'var(--accent)' : 'var(--border)'}`,
                color:        inCompare ? '#fff' : 'var(--text-3)',
                borderRadius: 'var(--radius-sm)',
                boxShadow:    'var(--shadow-sm)',
              }}
              onMouseEnter={e => { if (!inCompare) { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)'; } }}
              onMouseLeave={e => { if (!inCompare) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; } }}
            >
              <FiBarChart2 size={13} strokeWidth={2} />
            </button>
            <button
              onClick={handleShare}
              aria-label={`Share ${name}`}
              title="Share"
              className="w-8 h-8 flex items-center justify-center transition-all"
              style={{
                background:   'var(--card)',
                border:       '1px solid var(--border)',
                color:        'var(--text-3)',
                borderRadius: 'var(--radius-sm)',
                boxShadow:    'var(--shadow-sm)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
            >
              <FiShare2 size={13} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── Info ────────────────────────────────────────────────── */}
        <div className="p-5 flex flex-col flex-1">
          {/* Stars */}
          {(ratings > 0 || numReviews > 0) && (
            <StarRating
              rating={ratings || 0}
              showCount={false}
              size={11}
              className="mb-3"
            />
          )}

          {/* Name */}
          <h3
            className="font-bold text-[13px] sm:text-sm leading-snug line-clamp-2 mb-4 flex-1 transition-colors duration-150 group-hover:text-[#FF8A00]"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.01em' }}
          >
            {name}
          </h3>

          {/* Price + CTA */}
          <div className="flex flex-col gap-3 mt-auto">
            {/* Price row */}
            <div className="flex items-baseline gap-2">
              {hasVariants && (
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-4)', fontFamily: 'var(--font-body)' }}>From</span>
              )}
              <span
                className="font-bold text-[17px] leading-none"
                style={{ fontFamily: 'var(--font-numbers)', color: 'var(--text)', letterSpacing: '-0.02em' }}
              >
                ₹{displayPrice?.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span
                  className="text-[12px] line-through"
                  style={{ fontFamily: 'var(--font-numbers)', color: 'var(--text-4)' }}
                >
                  ₹{price?.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Action button */}
            {hasVariants ? (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/products/${slug}`); }}
                disabled={outOfStock}
                className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-bold tracking-widest uppercase transition-all duration-200"
                style={outOfStock ? {
                  background:   'var(--bg-2)',
                  color:        'var(--text-5)',
                  border:       '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor:       'not-allowed',
                } : {
                  background:   'transparent',
                  border:       '1.5px solid var(--text)',
                  color:        'var(--text)',
                  borderRadius: 'var(--radius-sm)',
                }}
                onMouseEnter={e => { if (!outOfStock) { e.currentTarget.style.background = 'var(--text)'; e.currentTarget.style.color = '#fff'; }}}
                onMouseLeave={e => { if (!outOfStock) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}}
              >
                {outOfStock ? 'Unavailable' : 'Select Options'}
                {!outOfStock && <FiArrowRight size={13} strokeWidth={2.5} />}
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={outOfStock || adding}
                className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-bold tracking-widest uppercase transition-all duration-200"
                style={outOfStock ? {
                  background:   'var(--bg-2)',
                  color:        'var(--text-5)',
                  border:       '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor:       'not-allowed',
                } : {
                  background:   'transparent',
                  border:       '1.5px solid var(--text)',
                  color:        'var(--text)',
                  borderRadius: 'var(--radius-sm)',
                  opacity:      adding ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!outOfStock && !adding) { e.currentTarget.style.background = 'var(--text)'; e.currentTarget.style.color = '#fff'; }}}
                onMouseLeave={e => { if (!outOfStock && !adding) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}}
              >
                {adding ? 'Adding…' : outOfStock ? 'Unavailable' : 'Add to Cart'}
                {(!outOfStock && !adding) && <FiArrowRight size={13} strokeWidth={2.5} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QuickView — lazy loaded, renders only when triggered */}
      {showQV && (
        <Suspense fallback={null}>
          <QuickView slug={slug} onClose={() => setShowQV(false)} />
        </Suspense>
      )}
    </>
  );
}

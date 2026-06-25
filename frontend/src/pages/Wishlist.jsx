import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWishlist, toggleWishlist, addToCart } from '../redux/slices/shopSlices';
import { toast } from 'react-toastify';
import { imgSrc } from '../utils/imageHelper';
import StarRating from '../components/ui/StarRating';
import { WishlistSkeleton } from '../components/ui/Skeleton';
import {
  FiHeart, FiShoppingCart, FiTrash2, FiArrowRight,
  FiEye, FiShare2, FiAlertTriangle, FiX, FiCopy,
} from 'react-icons/fi';

export default function Wishlist() {
  const dispatch  = useDispatch();
  const { token } = useSelector(s => s.auth);
  const { products: items, loading } = useSelector(s => s.wishlist);
  const [movingAll, setMovingAll] = useState(false);

  const handleRemove = useCallback(async (productId, name) => {
    try {
      await dispatch(toggleWishlist(productId)).unwrap();
      toast.success(`${name} removed from wishlist`);
    } catch { toast.error('Failed'); }
  }, [dispatch]);

  const handleMoveToCart = useCallback(async (p) => {
    try {
      await dispatch(addToCart({ productId: p._id, quantity: 1 })).unwrap();
      await dispatch(toggleWishlist(p._id)).unwrap();
      toast.success('Moved to cart!');
    } catch { toast.error('Failed'); }
  }, [dispatch]);

  const handleMoveAllToCart = useCallback(async () => {
    if (!items?.length) return;
    setMovingAll(true);
    let moved = 0;
    for (const p of items) {
      if (p && p.stock > 0) {
        try {
          await dispatch(addToCart({ productId: p._id, quantity: 1 })).unwrap();
          await dispatch(toggleWishlist(p._id)).unwrap();
          moved++;
        } catch {}
      }
    }
    setMovingAll(false);
    if (moved > 0) toast.success(`${moved} item${moved > 1 ? 's' : ''} moved to cart!`);
    else toast.info('No in-stock items to move');
  }, [dispatch, items]);

  const handleClearWishlist = useCallback(async () => {
    if (!items?.length) return;
    if (!window.confirm('Clear your entire wishlist?')) return;
    for (const p of items) {
      if (p) await dispatch(toggleWishlist(p._id)).catch(() => {});
    }
    toast.success('Wishlist cleared');
  }, [dispatch, items]);

  const handleShareWishlist = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'My Wishlist', url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url)
        .then(() => toast.success('Wishlist link copied!'))
        .catch(() => toast.info('Copy the URL from your browser'));
    }
  }, []);

  const handleShare = useCallback((p) => {
    const url = `${window.location.origin}/products/${p.slug}`;
    if (navigator.share) {
      navigator.share({ title: p.name, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url)
        .then(() => toast.success('Link copied!'))
        .catch(() => toast.info('Copy the URL from your browser'));
    }
  }, []);

  // ── Not logged in ────────────────────────────────────────────────────────

  if (!token) return (
    <div className="min-h-screen pt-32 pb-24 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div
        className="text-center"
        style={{ padding: '60px 40px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', maxWidth: '380px', width: '100%' }}
      >
        <FiHeart size={44} className="mx-auto mb-5" style={{ color: 'var(--text-4)' }} aria-hidden="true" />
        <h2 className="font-extrabold text-xl mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.025em' }}>
          Save your favourites
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-4)' }}>
          Login to view and manage your wishlist.
        </p>
        <Link
          to="/login"
          className="inline-block w-full py-4 font-bold uppercase tracking-widest text-sm"
          style={{ background: 'var(--text)', color: '#fff', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}
        >
          Login to Continue
        </Link>
      </div>
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pt-32 pb-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1
              className="font-extrabold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,36px)', color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1 }}
            >
              Wishlist
            </h1>
            {(items?.length || 0) > 0 && (
              <p className="mt-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>
                {items.length} item{items.length !== 1 ? 's' : ''} saved
              </p>
            )}
          </div>
          {(items?.length || 0) > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleMoveAllToCart}
                disabled={movingAll}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all"
                style={{ background: 'var(--text)', color: '#fff', borderRadius: 'var(--radius-sm)', opacity: movingAll ? 0.65 : 1 }}
              >
                <FiShoppingCart size={12} />
                {movingAll ? 'Moving…' : 'Move All to Cart'}
              </button>
              <button
                onClick={handleShareWishlist}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all"
                style={{ border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius-sm)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <FiShare2 size={12} /> Share
              </button>
              <button
                onClick={handleClearWishlist}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors"
                style={{ color: '#DC2626', border: '1.5px solid rgba(220,38,38,0.25)', borderRadius: 'var(--radius-sm)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <FiX size={12} /> Clear
              </button>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-colors ml-1"
                style={{ color: 'var(--text-4)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
              >
                Continue Shopping <FiArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <WishlistSkeleton count={8} />

        /* Empty */
        ) : !items?.length ? (
          <div
            className="py-24 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
          >
            <div
              className="w-20 h-20 flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--bg-2)', borderRadius: '50%' }}
            >
              <FiHeart size={32} style={{ color: 'var(--text-4)' }} aria-hidden="true" />
            </div>
            <h2 className="font-extrabold text-xl mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.025em' }}>
              Your wishlist is empty
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--text-4)' }}>
              Save items you love to buy later.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 font-bold uppercase tracking-widest text-sm"
              style={{ background: 'var(--text)', color: '#fff', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}
            >
              Explore Products <FiArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

        /* Grid */
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map(p => {
              if (!p) return null;
              const displayPrice = p.discountPrice > 0 ? p.discountPrice : p.price;
              const hasDiscount  = p.discountPrice > 0 && p.discountPrice < p.price;
              const discount     = hasDiscount ? Math.round((1 - p.discountPrice / p.price) * 100) : 0;
              const isOOS        = p.stock === 0;
              return (
                <article
                  key={p._id}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  {/* Image */}
                  <div className="relative" style={{ aspectRatio: '1/1', background: 'var(--bg)', flexShrink: 0 }}>
                    <Link to={`/products/${p.slug}`} tabIndex={-1} aria-hidden="true">
                      <img
                        src={imgSrc(p.images?.[0])}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-contain mix-blend-multiply"
                        style={{ padding: '16px' }}
                      />
                    </Link>

                    {/* Discount badge */}
                    {hasDiscount && (
                      <span
                        className="absolute top-3 left-3 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                        style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)' }}
                      >
                        -{discount}%
                      </span>
                    )}

                    {/* OOS overlay */}
                    {isOOS && (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(2px)' }}
                      >
                        <div className="text-center">
                          <FiAlertTriangle size={18} className="mx-auto mb-1" style={{ color: 'var(--text-3)' }} aria-hidden="true" />
                          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Out of Stock</p>
                        </div>
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemove(p._id, p.name)}
                      aria-label={`Remove ${p.name} from wishlist`}
                      className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center transition-all"
                      style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-4)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#DC2626'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#DC2626'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <FiTrash2 size={12} aria-hidden="true" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1 space-y-2">
                    {p.brand && (
                      <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--accent)' }}>
                        {p.brand}
                      </p>
                    )}
                    <Link
                      to={`/products/${p.slug}`}
                      className="font-bold text-sm line-clamp-2 leading-snug transition-colors"
                      style={{ color: 'var(--text)', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}
                    >
                      {p.name}
                    </Link>
                    {(p.ratings || 0) > 0 && (
                      <StarRating rating={p.ratings} count={p.numReviews} size={11} />
                    )}
                    <div className="flex items-center gap-2 mt-auto pt-1">
                      <span style={{ fontFamily: 'var(--font-numbers)', fontWeight: 800, fontSize: '15px', color: 'var(--text)' }}>
                        ₹{displayPrice?.toLocaleString('en-IN')}
                      </span>
                      {hasDiscount && (
                        <span style={{ fontFamily: 'var(--font-numbers)', fontSize: '12px', color: 'var(--text-4)', textDecoration: 'line-through' }}>
                          ₹{p.price?.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* CTA buttons */}
                    <button
                      onClick={() => handleMoveToCart(p)}
                      disabled={isOOS}
                      aria-label={isOOS ? 'Out of stock' : `Move ${p.name} to cart`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 font-bold transition-all disabled:cursor-not-allowed"
                      style={{
                        fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
                        background: isOOS ? 'var(--bg-2)' : 'var(--text)',
                        color: isOOS ? 'var(--text-4)' : '#fff',
                        border: 'none', borderRadius: 'var(--radius-sm)', cursor: isOOS ? 'not-allowed' : 'pointer',
                      }}
                      onMouseEnter={e => { if (!isOOS) e.currentTarget.style.background = '#333'; }}
                      onMouseLeave={e => { if (!isOOS) e.currentTarget.style.background = 'var(--text)'; }}
                    >
                      <FiShoppingCart size={12} aria-hidden="true" />
                      {isOOS ? 'Out of Stock' : 'Move to Cart'}
                    </button>

                    {/* Secondary row: View | Share */}
                    <div className="flex gap-2">
                      <Link
                        to={`/products/${p.slug}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 font-bold transition-all"
                        style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-3)', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
                      >
                        <FiEye size={11} aria-hidden="true" /> View
                      </Link>
                      <button
                        onClick={() => handleShare(p)}
                        aria-label={`Share ${p.name}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 font-bold transition-all"
                        style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
                      >
                        <FiShare2 size={11} aria-hidden="true" /> Share
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

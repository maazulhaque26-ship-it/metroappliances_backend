import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { usePageTitle, useJsonLd } from '../hooks/usePageTitle';
import { fetchProductBySlug } from '../redux/slices/shopSlices';
import { addToCart, toggleWishlist } from '../redux/slices/shopSlices';
import { addToCompare, removeFromCompare } from '../redux/slices/compareSlice';
import { toast } from 'react-toastify';
import API from '../services/api';
import StarRating, { InteractiveStars } from '../components/ui/StarRating';
import ProductCard from '../components/ui/ProductCard';
import { Skeleton } from '../components/ui/Skeleton';
import { imgSrc } from '../utils/imageHelper';
import { calculateShipping } from '../utils/shippingLogic';
import {
  FiShoppingCart, FiHeart, FiShield, FiTruck, FiRefreshCw, FiChevronRight,
  FiChevronLeft, FiPlus, FiMinus, FiCheck, FiShare2, FiStar, FiPackage,
  FiEdit2, FiTrash2, FiX, FiClock, FiUpload, FiMaximize2,
  FiMapPin, FiCheckCircle, FiAlertCircle, FiBarChart2, FiPhone, FiAward,
} from 'react-icons/fi';

// ── Recently Viewed helpers ──────────────────────────────────────────────────
const RV_KEY = 'metro_recently_viewed';

function getRV() {
  try { return JSON.parse(localStorage.getItem(RV_KEY) || '[]'); }
  catch { return []; }
}

function addRV(product) {
  try {
    const entry = {
      _id: product._id, name: product.name, slug: product.slug,
      images: product.images, price: product.price, discountPrice: product.discountPrice,
      ratings: product.ratings, brand: product.brand, stock: product.stock,
    };
    const prev = getRV().filter(x => x._id !== product._id);
    localStorage.setItem(RV_KEY, JSON.stringify([entry, ...prev].slice(0, 10)));
  } catch {}
}

function removeRV(id) {
  try { localStorage.setItem(RV_KEY, JSON.stringify(getRV().filter(x => x._id !== id))); } catch {}
}

function clearRV() {
  try { localStorage.removeItem(RV_KEY); } catch {}
}

// ── EMI utility ──────────────────────────────────────────────────────────────
const EMI_THRESHOLD = 4999;
const EMI_MONTHS    = 12;
const EMI_RATE      = 1.0; // 1 % per month (placeholder)

function calcEMI(price) {
  const r = EMI_RATE / 100;
  return Math.round((price * r * Math.pow(1 + r, EMI_MONTHS)) / (Math.pow(1 + r, EMI_MONTHS) - 1));
}

// ── STATUS_BADGE (review status) ─────────────────────────────────────────────
const STATUS_BADGE = {
  pending:  { label: 'Awaiting Approval',  cls: 'bg-[#F7F6F3] text-[#666666] border-[#E5E5E5]' },
  approved: { label: 'Approved',           cls: 'bg-green-50 text-green-700 border-green-200'  },
  rejected: { label: 'Rejected',           cls: 'bg-red-50 text-red-700 border-red-200'        },
  hidden:   { label: 'Hidden',             cls: 'bg-gray-100 text-gray-500 border-gray-200'    },
};

// ── DeliveryChecker ──────────────────────────────────────────────────────────
function DeliveryChecker() {
  const [pin,      setPin]      = useState('');
  const [result,   setResult]   = useState(null);   // null | 'available' | 'unavailable'
  const [checking, setChecking] = useState(false);

  const check = () => {
    if (pin.length !== 6) { toast.info('Enter a valid 6-digit PIN code'); return; }
    setChecking(true);
    // Placeholder service: PINs 100000–899999 are serviceable.
    // Replace setTimeout block with real API call when backend is ready.
    setTimeout(() => {
      const code = parseInt(pin, 10);
      setResult(code >= 100000 && code <= 899999 ? 'available' : 'unavailable');
      setChecking(false);
    }, 900);
  };

  return (
    <div style={{ padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
      <div className="flex items-center gap-2 mb-3">
        <FiMapPin size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} aria-hidden="true" />
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-4)' }}>
          Check Delivery
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter 6-digit PIN code"
          value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && check()}
          maxLength={6}
          aria-label="PIN code"
          style={{
            flex: 1, padding: '9px 14px', border: '1px solid var(--border)',
            background: 'var(--card)', color: 'var(--text)', fontSize: '14px',
            fontFamily: 'var(--font-numbers)', outline: 'none',
            borderRadius: 'var(--radius-sm)', transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--text)')}
          onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
        />
        <button
          onClick={check}
          disabled={checking || pin.length !== 6}
          style={{
            padding: '9px 16px', border: '1.5px solid var(--text)', background: 'transparent',
            color: 'var(--text)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', cursor: pin.length !== 6 ? 'not-allowed' : 'pointer',
            opacity: pin.length !== 6 ? 0.45 : 1, borderRadius: 'var(--radius-sm)',
            transition: 'background 0.2s, color 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={e => { if (pin.length === 6) { e.currentTarget.style.background = 'var(--text)'; e.currentTarget.style.color = '#fff'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}
        >
          {checking ? '…' : 'Check'}
        </button>
      </div>
      {result === 'available' && (
        <div className="flex items-start gap-2 mt-3" role="status">
          <FiCheckCircle size={14} style={{ color: '#16A34A', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#16A34A' }}>Delivery available</p>
            <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: 2 }}>Estimated: 2–4 business days</p>
          </div>
        </div>
      )}
      {result === 'unavailable' && (
        <div className="flex items-start gap-2 mt-3" role="status">
          <FiAlertCircle size={14} style={{ color: '#DC2626', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626' }}>Not deliverable here</p>
            <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: 2 }}>We don't deliver to this area yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TrustCards ───────────────────────────────────────────────────────────────
function TrustCards({ shippingInfo }) {
  const shippingTitle = shippingInfo?.isFree
    ? 'Free Delivery'
    : shippingInfo?.isEnabled && shippingInfo.threshold > 0
      ? `Free above ₹${shippingInfo.threshold.toLocaleString('en-IN')}`
      : 'Shipping Available';

  const shippingSub = shippingInfo?.isFree
    ? 'On this order'
    : shippingInfo?.amountNeeded > 0
      ? `Add ₹${shippingInfo.amountNeeded.toLocaleString('en-IN')} more`
      : 'Standard rates apply';

  const cards = [
    { icon: FiTruck,      title: shippingTitle,      sub: shippingSub,                accent: false },
    { icon: FiShield,     title: 'Secure Payment',   sub: 'SSL encrypted checkout',   accent: false },
    { icon: FiRefreshCw,  title: '30-Day Returns',   sub: 'Hassle-free returns',      accent: false },
    { icon: FiCheck,      title: 'Genuine Products', sub: 'Manufacturer certified',   accent: false },
    { icon: FiPhone,      title: 'Support 9AM–9PM',  sub: '7 days a week',            accent: false },
    { icon: FiAward,      title: 'Made for India',   sub: 'Designed for Indian homes',accent: true  },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
      {cards.map(({ icon: Icon, title, sub, accent }) => (
        <div
          key={title}
          style={{
            padding: '10px 8px', textAlign: 'center',
            background: accent ? 'var(--accent-dim)' : 'var(--bg)',
            border: `1px solid ${accent ? 'var(--accent-border)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <Icon
            size={15}
            aria-hidden="true"
            style={{ color: accent ? 'var(--accent)' : 'var(--text)', margin: '0 auto 6px', display: 'block' }}
          />
          <p style={{ fontSize: '9px', fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--text)', lineHeight: 1.3, marginBottom: 2 }}>
            {title}
          </p>
          <p style={{ fontSize: '9px', color: 'var(--text-4)', lineHeight: 1.3 }}>{sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── EMIBadge ──────────────────────────────────────────────────────────────────
function EMIBadge({ price }) {
  if (!price || price <= EMI_THRESHOLD) return null;
  const emi = calcEMI(price);
  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      style={{
        padding: '7px 12px', background: 'var(--accent-dim)',
        border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-sm)',
        marginTop: '8px',
      }}
    >
      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-numbers)' }}>
        EMI from ₹{emi.toLocaleString('en-IN')}/mo
      </span>
      <span style={{ fontSize: '10px', color: 'var(--text-4)' }}>· No-cost options available at checkout</span>
    </div>
  );
}

// ── RatingSummary ─────────────────────────────────────────────────────────────
function RatingSummary({ ratings, numReviews, reviews }) {
  const dist = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[rounded]++;
    });
    return counts;
  }, [reviews]);

  return (
    <div className="flex items-start gap-8 p-8 bg-white border border-[#E5E5E5]">
      {/* Big rating number */}
      <div className="text-center flex-shrink-0">
        <div style={{ fontFamily: 'var(--font-numbers)', fontSize: '52px', fontWeight: 800, lineHeight: 1, color: 'var(--text)', letterSpacing: '-0.04em' }}>
          {(ratings || 0).toFixed(1)}
        </div>
        <StarRating rating={ratings || 0} showCount={false} size={14} className="justify-center mt-2" />
        <p style={{ color: 'var(--text-4)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '8px' }}>
          {numReviews || 0} review{numReviews !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px self-stretch" style={{ background: 'var(--border)' }} />

      {/* Rating distribution bars */}
      <div className="flex-1 min-w-0 space-y-2">
        {[5, 4, 3, 2, 1].map(star => {
          const count = dist[star] || 0;
          const pct   = numReviews > 0 ? (count / numReviews) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-3">
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-4)', width: '14px', textAlign: 'right', flexShrink: 0 }}>
                {star}
              </span>
              <div style={{ flex: 1, height: '5px', background: 'var(--bg-2)', borderRadius: '99px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${pct}%`, height: '100%',
                    background: pct > 0 ? 'var(--text)' : 'transparent',
                    borderRadius: '99px', transition: 'width 0.9s var(--ease)',
                  }}
                />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-5)', width: '20px', flexShrink: 0 }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── RecentlyViewedCard ────────────────────────────────────────────────────────
function RecentlyViewedCard({ product: p, onRemove }) {
  const price = p.discountPrice > 0 ? p.discountPrice : p.price;
  return (
    <div className="flex-shrink-0 relative group/rv" style={{ width: '120px' }}>
      <Link
        to={`/products/${p.slug}`}
        style={{ display: 'block' }}
        aria-label={p.name}
      >
        <div
          className="overflow-hidden"
          style={{
            width: '120px', height: '120px', padding: '10px',
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <img
            src={imgSrc(p.images?.[0])}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-contain mix-blend-multiply"
          />
        </div>
        <p
          className="text-[11px] font-semibold line-clamp-2 mt-2 transition-colors"
          style={{ color: 'var(--text)', lineHeight: 1.4 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}
        >
          {p.name}
        </p>
        {price > 0 && (
          <p style={{ fontFamily: 'var(--font-numbers)', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginTop: '3px' }}>
            ₹{price.toLocaleString('en-IN')}
          </p>
        )}
      </Link>
      {onRemove && (
        <button
          onClick={e => { e.preventDefault(); onRemove(p._id); }}
          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-white/90 border border-[var(--border)] text-[var(--text-4)] hover:text-red-500 opacity-0 group-hover/rv:opacity-100 transition-all"
          style={{ borderRadius: '50%', fontSize: '10px', lineHeight: 1 }}
          aria-label={`Remove ${p.name} from recently viewed`}
          title="Remove"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ── Image Lightbox ────────────────────────────────────────────────────────────
function ImageLightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-12 right-0 text-[#111111] hover:text-[#FF7A00]"><FiX size={28} /></button>
        <img src={imgSrc(images[idx])} alt="Review" className="w-full max-h-[85vh] object-contain" />
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
              className="p-3 bg-[#F7F6F3] hover:bg-[#E5E5E5] text-[#111111] transition-colors">
              <FiChevronRight size={18} className="rotate-180" />
            </button>
            <span className="text-[#666666] text-sm font-bold tracking-widest">{idx + 1} / {images.length}</span>
            <button onClick={() => setIdx(i => (i + 1) % images.length)}
              className="p-3 bg-[#F7F6F3] hover:bg-[#E5E5E5] text-[#111111] transition-colors">
              <FiChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Review Form (shared for write + edit) ─────────────────────────────────────
function ReviewForm({ productId, existing, onSaved, onCancel }) {
  const [rating,    setRating]    = useState(existing?.rating  || 5);
  const [comment,   setComment]   = useState(existing?.comment || '');
  const [title,     setTitle]     = useState(existing?.title   || '');
  const [city,      setCity]      = useState(existing?.city    || '');
  const [images,    setImages]    = useState([]);
  const [previews,  setPreviews]  = useState([]);
  const [avatar,    setAvatar]    = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(existing?.avatar || null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);
  const avatarRef = useRef(null);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removePreview = (i) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (file) { setAvatar(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error('Write your review');
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('rating', rating); fd.append('comment', comment);
      fd.append('title',  title);  fd.append('city', city);
      images.forEach(f => fd.append('images', f));
      if (avatar) fd.append('avatar', avatar);
      let data;
      if (existing) {
        ({ data } = await API.put(`/reviews/${existing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
      } else {
        ({ data } = await API.post(`/products/${productId}/reviews`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
      }
      onSaved(data.review);
      toast.success(existing ? 'Review updated — awaiting re-approval' : 'Review submitted — awaiting approval!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#E5E5E5] p-8 space-y-6">
      <h4 className="text-[#111111] font-bold text-xl" style={{ fontFamily: 'Poppins, sans-serif' }}>{existing ? 'Edit Your Review' : 'Write a Review'}</h4>
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-[#666666] mb-2">Your Rating</label>
        <InteractiveStars value={rating} onChange={setRating} />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-[#666666] mb-2">Title (optional)</label>
        <input className="w-full border border-[#E5E5E5] px-4 py-3 outline-none focus:border-[#111111] bg-[#F7F6F3] transition-colors text-sm"
          placeholder="Summary of your experience" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-[#666666] mb-2">City (optional)</label>
        <input className="w-full border border-[#E5E5E5] px-4 py-3 outline-none focus:border-[#111111] bg-[#F7F6F3] transition-colors text-sm"
          placeholder="Your city" value={city} onChange={e => setCity(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-[#666666] mb-2">Your Review</label>
        <textarea className="w-full border border-[#E5E5E5] px-4 py-3 outline-none focus:border-[#111111] bg-[#F7F6F3] transition-colors text-sm resize-none h-32"
          placeholder="Share your experience…" value={comment} onChange={e => setComment(e.target.value)} required />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-[#666666] mb-2">Photos (up to 4)</label>
        <div className="flex flex-wrap gap-4">
          {previews.map((src, i) => (
            <div key={i} className="relative w-20 h-20">
              <img src={src} alt="" className="w-20 h-20 object-cover border border-[#E5E5E5]" />
              <button type="button" onClick={() => removePreview(i)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white">
                <FiX size={12} />
              </button>
            </div>
          ))}
          {previews.length < 4 && (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-20 h-20 border border-dashed border-[#CCCCCC] flex flex-col items-center justify-center text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors bg-[#F7F6F3]">
              <FiUpload size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Add</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-[#666666] mb-2">Profile Picture (Optional)</label>
        <div className="flex items-center gap-4">
          {avatarPreview ? (
            <div className="relative w-16 h-16">
              <img src={imgSrc(avatarPreview)} alt="" className="w-16 h-16 object-cover rounded-full border border-[#E5E5E5]" />
              <button type="button" onClick={() => { setAvatar(null); setAvatarPreview(null); }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white">
                <FiX size={10} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => avatarRef.current?.click()}
              className="w-16 h-16 rounded-full border border-dashed border-[#CCCCCC] flex items-center justify-center text-[#666666] hover:border-[#111111] transition-colors bg-[#F7F6F3]">
              <FiUpload size={16} />
            </button>
          )}
        </div>
        <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
      </div>
      <div className="flex gap-4 pt-4">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="flex-1 py-4 border border-[#111111] text-[#111111] font-bold uppercase tracking-widest text-sm hover:bg-[#F7F6F3] transition-colors">
            Cancel
          </button>
        )}
        <button type="submit" disabled={submitting}
          className="flex-1 py-4 bg-[#111111] text-white font-bold uppercase tracking-widest text-sm hover:bg-[#333333] transition-colors">
          {submitting ? 'Submitting…' : existing ? 'Update Review' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { slug }     = useParams();
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const { product, loading }        = useSelector(s => s.products);
  const { token, user }             = useSelector(s => s.auth);
  const { products: wishItems }     = useSelector(s => s.wishlist);
  const compareItems                = useSelector(s => s.compare.items);
  const { data: settings }          = useSelector(s => s.settings);

  // ── Existing state ──────────────────────────────────────────────────────────
  const [activeImg,           setActiveImg]           = useState(0);
  const [qty,                 setQty]                 = useState(1);
  const [activeTab,           setActiveTab]           = useState('Description');
  const [adding,              setAdding]              = useState(false);
  const [related,             setRelated]             = useState([]);
  const [reviews,             setReviews]             = useState([]);
  const [myReview,            setMyReview]            = useState(null);
  const [editing,             setEditing]             = useState(false);
  const [zoom,                setZoom]                = useState(false);
  const [lightbox,            setLightbox]            = useState(null);
  const [showForm,            setShowForm]            = useState(false);
  const [deleting,            setDeleting]            = useState(false);
  const [selectedVariantId,   setSelectedVariantId]   = useState(null);
  const [userSelectedVariant, setUserSelectedVariant] = useState(false);

  // ── New state ───────────────────────────────────────────────────────────────
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Refs for keyboard gallery nav and mobile swipe
  const imgsRef      = useRef([]);
  const touchStartX  = useRef(null);

  // ── SEO: page title + structured data ──────────────────────────────────────
  const seoDescription = product
    ? (product.shortDescription || product.description || '').replace(/<[^>]+>/g, '').slice(0, 160)
    : '';
  usePageTitle(product?.name, seoDescription || undefined);

  const productSchema = useMemo(() => {
    if (!product?._id) return null;
    const price = (product.discountPrice > 0 ? product.discountPrice : product.price) || 0;
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: (product.description || '').replace(/<[^>]+>/g, '').slice(0, 500),
      image: (product.images || []).map(img => imgSrc(img)).filter(Boolean),
      brand: { '@type': 'Brand', name: product.brand || 'Metro Appliances' },
      sku: product.sku || product._id,
      offers: {
        '@type': 'Offer',
        price,
        priceCurrency: 'INR',
        availability: (product.stock || 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: `${window.location.origin}/products/${product.slug}`,
      },
      ...(product.ratings > 0 ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.ratings,
          reviewCount: product.numReviews || 1,
          bestRating: 5,
          worstRating: 1,
        },
      } : {}),
    };
  }, [product?._id, product?.discountPrice, product?.stock, product?.ratings]);

  useJsonLd(productSchema, `product-${product?._id}`);

  // ── Effects: existing ───────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, dispatch]);

  useEffect(() => {
    if (product?._id) {
      API.get(`/products/${product._id}/related`).then(r => setRelated(r.data.products || [])).catch(() => {});
      API.get(`/products/${product._id}/reviews`).then(r => setReviews(r.data.reviews || [])).catch(() => {});
      if (token) {
        API.get(`/products/${product._id}/my-review`).then(r => setMyReview(r.data.review)).catch(() => {});
      }
      setActiveImg(0);
      setUserSelectedVariant(false);
      if (product.variants && product.variants.length > 0) {
        const def = product.variants.find(v => v.isDefault) || product.variants[0];
        setSelectedVariantId(def?._id?.toString() ?? null);
      } else {
        setSelectedVariantId(null);
      }
      // Recently viewed
      addRV(product);
      setRecentlyViewed(getRV().filter(x => x._id !== product._id).slice(0, 5));
    }
  }, [product?._id, token]);

  // ── Keyboard gallery navigation ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowLeft')  setActiveImg(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setActiveImg(i => Math.min(imgsRef.current.length - 1, i + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Existing handlers (unchanged) ───────────────────────────────────────────
  const inWishlist = wishItems?.some(p => p._id === product?._id);
  const inCompare  = compareItems.some(p => p._id === product?._id);

  const handleAddCart = useCallback(async () => {
    if (!token) { toast.info('Please login to add to cart'); return; }
    if (product.variants?.length > 0 && !selectedVariant) {
      toast.info('Please select a variant'); return;
    }
    try {
      setAdding(true);
      await dispatch(addToCart({
        productId:   product._id,
        quantity:    qty,
        variantId:   selectedVariant?._id,
        variantName: selectedVariant?.name,
      })).unwrap();
      const label = selectedVariant ? ` — ${selectedVariant.name}` : '';
      toast.success(`${product.name}${label} added to cart!`);
    } catch (err) { toast.error(err || 'Failed'); }
    finally { setAdding(false); }
  }, [token, product, qty, dispatch, selectedVariantId]);

  const handleBuyNow = async () => { await handleAddCart(); navigate('/cart'); };

  const handleWishlist = useCallback(async () => {
    if (!token) { toast.info('Login to save wishlist'); return; }
    try {
      await dispatch(toggleWishlist(product._id)).unwrap();
      toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist');
    } catch { toast.error('Failed'); }
  }, [token, product, inWishlist, dispatch]);

  const handleCompare = useCallback(() => {
    if (inCompare) {
      dispatch(removeFromCompare(product._id));
      toast.info('Removed from compare');
    } else {
      if (compareItems.length >= 4) { toast.warning('Compare up to 4 products'); return; }
      dispatch(addToCompare(product));
      toast.success('Added to compare');
    }
  }, [inCompare, compareItems.length, product, dispatch]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product?.name, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url)
        .then(() => toast.success('Link copied!'))
        .catch(() => toast.info('Copy the URL from your browser address bar'));
    }
  }, [product?.name]);

  const handleReviewSaved = (review) => {
    setMyReview(review);
    setShowForm(false);
    setEditing(false);
    if (review.status === 'approved') {
      setReviews(prev => {
        const existing = prev.find(r => r._id === review._id);
        if (existing) return prev.map(r => r._id === review._id ? review : r);
        return [review, ...prev];
      });
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Delete your review?')) return;
    try {
      setDeleting(true);
      await API.delete(`/reviews/${myReview._id}`);
      setMyReview(null);
      setReviews(prev => prev.filter(r => r._id !== myReview._id));
      toast.success('Review deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setDeleting(false); }
  };

  const handleShowForm = () => {
    setShowForm(true);
    setTimeout(() => {
      document.getElementById('review-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // ── Touch handlers for mobile swipe ────────────────────────────────────────
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setActiveImg(i => Math.min(imgsRef.current.length - 1, i + 1));
      else          setActiveImg(i => Math.max(0, i - 1));
    }
    touchStartX.current = null;
  };

  // ── Loading / Not found ─────────────────────────────────────────────────────
  if (loading) return <ProductDetailSkeleton />;
  if (!product) return (
    <div className="min-h-screen flex items-center justify-center pt-32 bg-[#F7F6F3]">
      <div className="text-center p-12 bg-white border border-[#E5E5E5]">
        <FiPackage size={64} className="mx-auto mb-6 text-[#CCCCCC]" />
        <h2 className="text-[#111111] font-extrabold text-2xl mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Product not found</h2>
        <Link to="/shop" className="inline-block mt-4 px-8 py-4 bg-[#111111] text-white font-bold uppercase tracking-widest text-sm">Back to Shop</Link>
      </div>
    </div>
  );

  // ── Derived values (unchanged) ──────────────────────────────────────────────
  const { name, brand, price, discountPrice, images, description, specs, ratings, numReviews, stock, warranty, isNewArrival } = product;
  const hasVariants = product.hasVariants || (product.variants?.length > 0);

  const selectedVariant = hasVariants
    ? (product.variants.find(v => v._id?.toString() === selectedVariantId)
       || product.variants.find(v => v.isDefault)
       || product.variants[0])
    : null;

  const activePrice    = hasVariants && selectedVariant ? selectedVariant.price         : price;
  const activeDiscount = hasVariants && selectedVariant ? selectedVariant.discountPrice : discountPrice;
  const activeStock    = hasVariants && selectedVariant ? selectedVariant.stock          : stock;
  const activeSpecs    = hasVariants && selectedVariant?.specs?.length ? selectedVariant.specs : specs;
  const activeImages   = (hasVariants && userSelectedVariant && selectedVariant?.images?.length)
    ? selectedVariant.images : images;

  const displayPrice = activeDiscount > 0 ? activeDiscount : activePrice;
  const hasDiscount  = activeDiscount > 0 && activeDiscount < activePrice;
  const discount     = hasDiscount ? Math.round((1 - activeDiscount / activePrice) * 100) : 0;
  const imgs         = activeImages?.length ? activeImages : [null];

  // Keep ref in sync for keyboard/swipe handlers
  imgsRef.current = imgs;

  const shippingInfo = calculateShipping(settings, displayPrice);

  // Dynamic tabs — FAQs tab only shown when product has FAQ data
  const visibleTabs = useMemo(() => {
    const base = ['Description', 'Specifications', 'Reviews'];
    if (product.faqs?.length > 0) base.push('FAQs');
    return base;
  }, [product.faqs?.length]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F6F3] pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-12">
          <Link to="/" className="hover:text-[#111111] transition-colors">Home</Link>
          <FiChevronRight size={12} aria-hidden="true" />
          <Link to="/shop" className="hover:text-[#111111] transition-colors">Shop</Link>
          {product.category?.name && (
            <>
              <FiChevronRight size={12} aria-hidden="true" />
              <Link to={`/shop?category=${product.category.slug}`} className="hover:text-[#111111] transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          {brand && !product.category?.name && <><FiChevronRight size={12} aria-hidden="true" /><span>{brand}</span></>}
          <FiChevronRight size={12} aria-hidden="true" />
          <span className="text-[#111111] line-clamp-1">{name}</span>
        </nav>

        {/* ── Main: Gallery + Buy Box ──────────────────────────────────── */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-20 mb-24">

          {/* ── Gallery (7 cols) ─────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-3">

            {/* Main image */}
            <div
              className="relative bg-white border border-[#E5E5E5] overflow-hidden select-none"
              style={{ aspectRatio: '1/1', borderRadius: 'var(--radius-md)' }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {imgs[activeImg] ? (
                <img
                  src={imgSrc(imgs[activeImg])}
                  alt={`${name} — view ${activeImg + 1}`}
                  className="w-full h-full object-contain mix-blend-multiply"
                  style={{ padding: '40px', transition: 'opacity 0.22s ease' }}
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiPackage size={56} style={{ color: 'var(--text-5)' }} aria-hidden="true" />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {hasDiscount && (
                  <span className="px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase text-white"
                    style={{ background: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}>
                    -{discount}% OFF
                  </span>
                )}
                {isNewArrival && !hasDiscount && (
                  <span className="px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase"
                    style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    NEW
                  </span>
                )}
              </div>

              {/* Fullscreen button */}
              <button
                onClick={() => setZoom(true)}
                aria-label="View fullscreen"
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                style={{
                  background: 'rgba(255,255,255,0.92)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-3)', opacity: 0.75,
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0.75'; e.currentTarget.style.color = 'var(--text-3)'; }}
              >
                <FiMaximize2 size={15} strokeWidth={2} aria-hidden="true" />
              </button>

              {/* Prev/Next arrows */}
              {imgs.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg(i => Math.max(0, i - 1))}
                    disabled={activeImg === 0}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.92)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text)',
                      opacity: activeImg === 0 ? 0.3 : 0.85,
                    }}
                  >
                    <FiChevronLeft size={16} strokeWidth={2.5} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setActiveImg(i => Math.min(imgs.length - 1, i + 1))}
                    disabled={activeImg === imgs.length - 1}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.92)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text)',
                      opacity: activeImg === imgs.length - 1 ? 0.3 : 0.85,
                    }}
                  >
                    <FiChevronRight size={16} strokeWidth={2.5} aria-hidden="true" />
                  </button>
                </>
              )}

              {/* Image counter */}
              {imgs.length > 1 && (
                <div
                  className="absolute bottom-3 right-3"
                  style={{
                    padding: '3px 10px', background: 'rgba(17,17,17,0.6)', backdropFilter: 'blur(4px)',
                    borderRadius: '99px', color: '#fff', fontSize: '10px', fontWeight: 700,
                    letterSpacing: '0.05em', fontFamily: 'var(--font-numbers)',
                  }}
                >
                  {activeImg + 1} / {imgs.length}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {imgs.length > 1 && (
              <div
                className="flex gap-2 overflow-x-auto no-scrollbar py-1"
                role="tablist"
                aria-label="Product images"
              >
                {imgs.map((img, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === activeImg}
                    aria-label={`Image ${i + 1}`}
                    onClick={() => setActiveImg(i)}
                    className="flex-shrink-0 overflow-hidden transition-all"
                    style={{
                      width: '72px', height: '72px', padding: '6px',
                      background: 'var(--card)',
                      border: `2px solid ${i === activeImg ? 'var(--text)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      opacity: i === activeImg ? 1 : 0.6,
                    }}
                    onMouseEnter={e => { if (i !== activeImg) e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { if (i !== activeImg) e.currentTarget.style.opacity = '0.6'; }}
                  >
                    <img src={imgSrc(img)} alt="" className="w-full h-full object-contain mix-blend-multiply" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Buy Box (5 cols, sticky) ─────────────────────────────────── */}
          <div className="lg:col-span-5" style={{ alignSelf: 'start' }}>
            <div className="lg:sticky lg:top-28 space-y-6">

              {/* Brand + Name + Stars */}
              <div>
                {brand && (
                  <Link
                    to={`/shop?brand=${brand}`}
                    className="block text-[11px] font-bold tracking-[0.2em] uppercase mb-3 transition-colors"
                    style={{ color: 'var(--text-4)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
                  >
                    {brand}
                  </Link>
                )}
                <h1
                  className="leading-[1.1] tracking-tight mb-5"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px, 4vw, 36px)', color: 'var(--text)', letterSpacing: '-0.025em' }}
                >
                  {name}
                </h1>
                <div className="flex items-center gap-4 flex-wrap">
                  <StarRating rating={ratings || 0} count={numReviews} size={14} />
                  <button
                    onClick={() => {
                      setActiveTab('Reviews');
                      setTimeout(() => document.getElementById('reviews-section-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                    }}
                    className="text-[10px] font-bold uppercase tracking-widest transition-colors"
                    style={{ color: 'var(--text-4)', borderBottom: '1px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderBottomColor = 'var(--text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.borderBottomColor = 'transparent'; }}
                  >
                    Write a Review
                  </button>
                </div>
              </div>

              {/* Variant Selector */}
              {hasVariants && (
                <div className="pt-5 border-t border-[#E5E5E5]">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-4)' }}>
                    Select Variant
                    {selectedVariant && <span style={{ color: 'var(--text)', marginLeft: '6px' }}>— {selectedVariant.name}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map(v => {
                      const isSelected  = selectedVariant?._id === v._id;
                      const unavailable = v.stock === 0 || v.isActive === false;
                      return (
                        <button
                          key={v._id}
                          onClick={() => { setSelectedVariantId(v._id?.toString()); setUserSelectedVariant(true); setActiveImg(0); setQty(1); }}
                          disabled={unavailable}
                          aria-pressed={isSelected}
                          aria-label={`${v.name}${unavailable ? ' — out of stock' : ''}`}
                          className="relative px-4 py-2 text-[12px] font-bold uppercase tracking-wider transition-all"
                          style={{
                            background:     isSelected ? 'var(--text)' : unavailable ? 'var(--bg-2)' : 'var(--card)',
                            color:          isSelected ? '#fff' : unavailable ? 'var(--text-5)' : 'var(--text)',
                            border:         `1.5px solid ${isSelected ? 'var(--text)' : unavailable ? 'var(--border)' : 'var(--border)'}`,
                            borderRadius:   'var(--radius-sm)',
                            cursor:         unavailable ? 'not-allowed' : 'pointer',
                            textDecoration: unavailable ? 'line-through' : 'none',
                            opacity:        unavailable ? 0.5 : 1,
                          }}
                          onMouseEnter={e => { if (!isSelected && !unavailable) e.currentTarget.style.borderColor = 'var(--text)'; }}
                          onMouseLeave={e => { if (!isSelected && !unavailable) e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          {v.name}
                          {v.stock === 0 && (
                            <span className="absolute -top-2 -right-2 text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 uppercase tracking-wider"
                              style={{ borderRadius: 'var(--radius-sm)' }}>
                              OOS
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedVariant?.sku && (
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-5)' }}>
                      SKU: <span style={{ color: 'var(--text-3)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>{selectedVariant.sku}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Price + EMI */}
              <div className="pt-5 border-t border-[#E5E5E5]">
                <div className="flex items-end gap-3 flex-wrap">
                  <span
                    style={{ fontFamily: 'var(--font-numbers)', fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}
                  >
                    ₹{displayPrice?.toLocaleString('en-IN')}
                  </span>
                  {hasDiscount && (
                    <span style={{ fontFamily: 'var(--font-numbers)', fontSize: '18px', color: 'var(--text-4)', textDecoration: 'line-through', fontWeight: 500, marginBottom: '2px' }}>
                      ₹{activePrice?.toLocaleString('en-IN')}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="px-2.5 py-1 text-[11px] font-bold" style={{ background: 'rgba(22,163,74,0.1)', color: '#16A34A', borderRadius: 'var(--radius-sm)', marginBottom: '2px' }}>
                      {discount}% off
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-medium mt-1" style={{ color: 'var(--text-4)' }}>Inclusive of all taxes</p>
                <EMIBadge price={displayPrice} />
              </div>

              {/* Stock + Warranty row */}
              <div className="flex items-center justify-between py-4 border-y border-[#E5E5E5]">
                <div className="flex items-center gap-2">
                  {activeStock > 0 ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>
                        {activeStock <= 5 ? `Only ${activeStock} left` : 'In Stock'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-[#CCCCCC]" />
                      <span className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Out of Stock</span>
                    </>
                  )}
                </div>
                {warranty && (
                  <div className="flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                    <FiShield size={14} aria-hidden="true" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{warranty}</span>
                  </div>
                )}
              </div>

              {/* Delivery Checker */}
              <DeliveryChecker />

              {/* Quantity */}
              <div className="flex items-center border border-[#E5E5E5] bg-white" style={{ borderRadius: 'var(--radius-sm)' }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                  className="p-4 transition-colors disabled:opacity-30"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                >
                  <FiMinus size={16} aria-hidden="true" />
                </button>
                <span
                  className="flex-1 text-center font-bold text-lg"
                  style={{ fontFamily: 'var(--font-numbers)', color: 'var(--text)' }}
                  aria-live="polite"
                  aria-label={`Quantity: ${qty}`}
                >
                  {qty}
                </span>
                <button
                  onClick={() => setQty(q => Math.min(activeStock || 99, q + 1))}
                  disabled={qty >= (activeStock || 99)}
                  aria-label="Increase quantity"
                  className="p-4 transition-colors disabled:opacity-30"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                >
                  <FiPlus size={16} aria-hidden="true" />
                </button>
              </div>

              {/* Add to Cart + Buy Now */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddCart}
                  disabled={!activeStock || adding || (hasVariants && !selectedVariant)}
                  className="w-full py-4 border font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: 'var(--text)', color: 'var(--text)', background: 'transparent', borderRadius: 'var(--radius-sm)' }}
                  onMouseEnter={e => { if (activeStock && !adding) { e.currentTarget.style.background = 'var(--text)'; e.currentTarget.style.color = '#fff'; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}
                >
                  <FiShoppingCart size={15} className="inline mr-2" aria-hidden="true" />
                  {adding ? 'Adding…' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!activeStock || (hasVariants && !selectedVariant)}
                  className="w-full py-4 font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--text)', color: '#fff', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--text)' }}
                  onMouseEnter={e => { if (activeStock) e.currentTarget.style.background = '#333'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--text)'; }}
                >
                  Buy Now
                </button>
              </div>

              {/* Wishlist + Compare + Share */}
              <div className="flex gap-2">
                <button
                  onClick={handleWishlist}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  className="flex-1 py-3 flex items-center justify-center gap-2 border font-bold uppercase tracking-widest text-[10px] transition-all"
                  style={{
                    borderColor: inWishlist ? 'var(--accent)' : 'var(--border)',
                    color:       inWishlist ? 'var(--accent)' : 'var(--text-3)',
                    background:  inWishlist ? 'var(--accent-dim)' : 'var(--card)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <FiHeart size={13} fill={inWishlist ? 'currentColor' : 'none'} aria-hidden="true" />
                  {inWishlist ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={handleCompare}
                  aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
                  title={inCompare ? 'Remove from compare' : 'Compare'}
                  className="flex-1 py-3 flex items-center justify-center gap-2 border font-bold uppercase tracking-widest text-[10px] transition-all"
                  style={{
                    borderColor: inCompare ? 'var(--text)' : 'var(--border)',
                    color:       inCompare ? '#fff' : 'var(--text-3)',
                    background:  inCompare ? 'var(--text)' : 'var(--card)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <FiBarChart2 size={13} aria-hidden="true" />
                  {inCompare ? 'Comparing' : 'Compare'}
                </button>
                <button
                  onClick={handleShare}
                  aria-label="Share product"
                  title="Share"
                  className="w-11 flex items-center justify-center border transition-all"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-3)', background: 'var(--card)', borderRadius: 'var(--radius-sm)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
                >
                  <FiShare2 size={15} aria-hidden="true" />
                </button>
              </div>

              {/* Warranty detail */}
              {warranty && (
                <div
                  className="flex items-start gap-3"
                  style={{ padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                >
                  <FiShield size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.01em' }}>
                      {warranty} Manufacturer Warranty
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: 3 }}>
                      Covers manufacturing defects · Authorised service centres
                    </p>
                  </div>
                </div>
              )}

              {/* Trust cards */}
              <TrustCards shippingInfo={shippingInfo} />

            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="mb-24">
          {/* Tab bar */}
          <div className="flex border-b border-[#E5E5E5] overflow-x-auto no-scrollbar" role="tablist">
            {visibleTabs.map(tab => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className="px-8 py-5 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-px"
                style={{
                  color:       activeTab === tab ? 'var(--text)' : 'var(--text-4)',
                  borderColor: activeTab === tab ? 'var(--text)' : 'transparent',
                }}
              >
                {tab}{tab === 'Reviews' && numReviews > 0 && ` (${numReviews})`}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="py-14 max-w-4xl" role="tabpanel">

            {/* Description */}
            {activeTab === 'Description' && (
              <div className="space-y-6">
                {description ? (
                  <p className="whitespace-pre-line leading-relaxed" style={{ color: 'var(--text-2)', fontSize: '16px', lineHeight: 1.8 }}>
                    {description}
                  </p>
                ) : (
                  <p style={{ color: 'var(--text-4)' }}>No description available.</p>
                )}
              </div>
            )}

            {/* Specifications */}
            {activeTab === 'Specifications' && (
              <div>
                {activeSpecs && activeSpecs.length > 0 ? (
                  <div className="overflow-hidden" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                    {activeSpecs.map(({ key, value }, i) => (
                      <div
                        key={i}
                        className="grid"
                        style={{
                          gridTemplateColumns: '220px 1fr',
                          borderBottom: i < activeSpecs.length - 1 ? '1px solid var(--border)' : 'none',
                          background: i % 2 === 0 ? 'var(--card)' : 'var(--bg)',
                        }}
                      >
                        <div
                          className="p-4 border-r"
                          style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-2)' }}
                        >
                          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                            {key}
                          </span>
                        </div>
                        <div className="p-4">
                          <span className="text-[14px]" style={{ color: 'var(--text-2)' }}>{value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-4)' }}>No specifications available.</p>
                )}
              </div>
            )}

            {/* Reviews */}
            {activeTab === 'Reviews' && (
              <div id="reviews-section-container" className="space-y-10">
                {/* Rating summary */}
                <RatingSummary ratings={ratings} numReviews={numReviews} reviews={reviews} />

                {/* Write review CTA */}
                {token && !myReview && !showForm && (
                  <button
                    onClick={handleShowForm}
                    className="py-3 px-6 border font-bold uppercase tracking-widest text-xs transition-colors"
                    style={{ borderColor: 'var(--text)', color: 'var(--text)', background: 'transparent', borderRadius: 'var(--radius-sm)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--text)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}
                  >
                    Write a Review
                  </button>
                )}

                {/* My review */}
                {token && myReview && (
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', padding: '24px', borderRadius: 'var(--radius-md)' }}>
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <p className="font-bold text-sm uppercase tracking-widest mb-2" style={{ color: 'var(--text)' }}>Your Review</p>
                        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${STATUS_BADGE[myReview.status]?.cls}`}>
                          {STATUS_BADGE[myReview.status]?.label}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setEditing(true)} className="font-bold text-xs uppercase tracking-widest transition-colors" style={{ color: 'var(--text-4)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}>Edit</button>
                        <button onClick={handleDeleteReview} disabled={deleting} className="font-bold text-xs uppercase tracking-widest transition-colors" style={{ color: 'var(--text-4)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#DC2626')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}>Delete</button>
                      </div>
                    </div>
                    {editing ? (
                      <ReviewForm productId={product._id} existing={myReview} onSaved={handleReviewSaved} onCancel={() => setEditing(false)} />
                    ) : (
                      <>
                        <StarRating rating={myReview.rating} showCount={false} size={14} className="mb-3" />
                        {myReview.title && <p className="font-bold text-lg mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{myReview.title}</p>}
                        {myReview.city  && <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>{myReview.city}</p>}
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{myReview.comment}</p>
                        {myReview.images?.length > 0 && (
                          <div className="flex gap-3 mt-5">
                            {myReview.images.map((img, i) => (
                              <button key={i} onClick={() => setLightbox({ images: myReview.images, index: i })}
                                className="w-20 h-20 border overflow-hidden transition-all"
                                style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)' }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text)')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                                <img src={imgSrc(img)} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Review form */}
                {token && !myReview && showForm && (
                  <div id="review-form-container">
                    <ReviewForm productId={product._id} onSaved={handleReviewSaved} onCancel={() => setShowForm(false)} />
                  </div>
                )}

                {/* Review list */}
                <div className="space-y-6">
                  {reviews.length > 0 ? reviews.map(r => (
                    <div
                      key={r._id}
                      className="p-6"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          {r.avatar ? (
                            <img src={imgSrc(r.avatar)} alt="" className="w-11 h-11 rounded-full object-cover border border-[#E5E5E5]" />
                          ) : (
                            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm"
                              style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                              {r.user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-[13px]" style={{ color: 'var(--text)' }}>{r.user?.name || 'User'}</p>
                              {r.isVerified && (
                                <span
                                  className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                                  style={{ background: 'rgba(22,163,74,0.08)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 'var(--radius-sm)' }}
                                >
                                  <FiCheck size={9} aria-hidden="true" /> Verified
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              {r.city && <span className="text-[11px] font-medium" style={{ color: 'var(--text-4)' }}>{r.city} ·</span>}
                              <p className="text-[11px]" style={{ color: 'var(--text-5)' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                            </div>
                          </div>
                        </div>
                        <StarRating rating={r.rating} showCount={false} size={12} className="flex-shrink-0" />
                      </div>
                      {r.title && (
                        <p className="font-bold text-base mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{r.title}</p>
                      )}
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{r.comment}</p>
                      {r.images?.length > 0 && (
                        <div className="flex gap-3 mt-4">
                          {r.images.map((img, i) => (
                            <button key={i} onClick={() => setLightbox({ images: r.images, index: i })}
                              className="w-16 h-16 overflow-hidden transition-all"
                              style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text)')}
                              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                              <img src={imgSrc(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="py-16 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <FiStar size={32} className="mx-auto mb-4" style={{ color: 'var(--text-5)' }} aria-hidden="true" />
                      <p className="text-sm font-medium" style={{ color: 'var(--text-4)' }}>No reviews yet — be the first!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FAQs — only rendered when product.faqs exists */}
            {activeTab === 'FAQs' && product.faqs?.length > 0 && (
              <div className="space-y-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                {product.faqs.map(({ q, a }, i) => (
                  <details
                    key={i}
                    className="group"
                    style={{ borderBottom: i < product.faqs.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <summary
                      className="flex items-center justify-between px-6 py-5 cursor-pointer list-none"
                      style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--text)', background: 'var(--card)' }}
                    >
                      {q}
                      <FiChevronRight size={16} aria-hidden="true" style={{ color: 'var(--text-4)', flexShrink: 0, transition: 'transform 0.2s' }}
                        className="group-open:rotate-90" />
                    </summary>
                    <p className="px-6 pb-5 pt-2 text-sm leading-relaxed" style={{ color: 'var(--text-3)', background: 'var(--bg)' }}>{a}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Related Products ─────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="pt-16 border-t border-[#E5E5E5] mb-20" aria-label="Related products">
            <div className="flex items-center justify-between mb-8">
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(20px,3vw,28px)', color: 'var(--text)', letterSpacing: '-0.025em' }}>
                Related Appliances
              </h2>
              <Link
                to="/shop"
                className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors"
                style={{ color: 'var(--text-4)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
              >
                View All <FiChevronRight size={13} strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>
            {/* Horizontal scroll on mobile, grid on desktop */}
            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-3 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
              {related.slice(0, 4).map(p => (
                <div key={p._id} className="flex-shrink-0 w-[260px] lg:w-auto">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Frequently Bought Together ───────────────────────────────── */}
        {/* Architecture placeholder: backend endpoint /products/:id/bought-together
            not yet implemented. Section hidden until data is available.
            When ready: fetch from API and render a similar horizontal strip.    */}

        {/* ── Recently Viewed ──────────────────────────────────────────── */}
        {recentlyViewed.length > 0 && (
          <section className="pt-16 border-t border-[#E5E5E5]" aria-label="Recently viewed">
            <div className="flex items-center justify-between mb-8">
              <h2
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(18px,3vw,24px)', color: 'var(--text)', letterSpacing: '-0.025em' }}
              >
                Recently Viewed
              </h2>
              <button
                onClick={() => { clearRV(); setRecentlyViewed([]); }}
                className="text-[10px] font-bold uppercase tracking-widest transition-colors"
                style={{ color: 'var(--text-4)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#DC2626')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
              >
                Clear All
              </button>
            </div>
            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-3">
              {recentlyViewed.map(p => (
                <RecentlyViewedCard
                  key={p._id}
                  product={p}
                  onRemove={(id) => { removeRV(id); setRecentlyViewed(prev => prev.filter(x => x._id !== id)); }}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Fullscreen zoom overlay ──────────────────────────────────── */}
      {zoom && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center cursor-zoom-out"
          style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)' }}
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Product image fullscreen"
        >
          <button
            onClick={() => setZoom(false)}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center"
            aria-label="Close fullscreen"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-3)' }}
          >
            <FiX size={18} strokeWidth={2} aria-hidden="true" />
          </button>
          <img
            src={imgSrc(imgs[activeImg])}
            alt={name}
            className="max-w-full max-h-full object-contain"
            style={{ padding: '40px' }}
          />
          {/* Image nav in fullscreen */}
          {imgs.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setActiveImg(i => Math.max(0, i - 1)); }}
                disabled={activeImg === 0}
                aria-label="Previous image"
                className="absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center disabled:opacity-30"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)' }}
              >
                <FiChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setActiveImg(i => Math.min(imgs.length - 1, i + 1)); }}
                disabled={activeImg === imgs.length - 1}
                aria-label="Next image"
                className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center disabled:opacity-30"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)' }}
              >
                <FiChevronRight size={20} strokeWidth={2} aria-hidden="true" />
              </button>
              <div
                className="absolute bottom-6 left-1/2 -translate-x-1/2"
                style={{ padding: '4px 14px', background: 'rgba(17,17,17,0.55)', borderRadius: '99px', color: '#fff', fontSize: '11px', fontFamily: 'var(--font-numbers)', fontWeight: 700 }}
              >
                {activeImg + 1} / {imgs.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Review image lightbox ────────────────────────────────────── */}
      {lightbox && (
        <ImageLightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F7F6F3] pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-12">
          <Skeleton className="h-2.5 w-10" />
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-2.5 w-24" />
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-20">
          {/* Gallery skeleton */}
          <div className="lg:col-span-7 space-y-3">
            <Skeleton className="w-full" style={{ aspectRatio: '1/1', borderRadius: 'var(--radius-md)' }} />
            <div className="flex gap-2">
              {[0, 1, 2, 3].map(i => <Skeleton key={i} className="flex-shrink-0 w-[72px] h-[72px]" style={{ borderRadius: 'var(--radius-sm)' }} />)}
            </div>
          </div>

          {/* Buy box skeleton */}
          <div className="lg:col-span-5 space-y-5 pt-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-3 w-2/5" />
            <div className="pt-4 space-y-3">
              <Skeleton className="h-2.5 w-24" />
              <div className="flex gap-2">
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-9 w-20" style={{ borderRadius: 'var(--radius-sm)' }} />)}
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-14 w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-14" style={{ borderRadius: 'var(--radius-sm)' }} />
              <Skeleton className="h-14" style={{ borderRadius: 'var(--radius-sm)' }} />
            </div>
            <div className="flex gap-2">
              <Skeleton className="flex-1 h-11" style={{ borderRadius: 'var(--radius-sm)' }} />
              <Skeleton className="flex-1 h-11" style={{ borderRadius: 'var(--radius-sm)' }} />
              <Skeleton className="w-11 h-11" style={{ borderRadius: 'var(--radius-sm)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-16" style={{ borderRadius: 'var(--radius-sm)' }} />)}
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="mt-20 space-y-4">
          <div className="flex gap-6 border-b border-[#E5E5E5] pb-4">
            {[0,1,2].map(i => <Skeleton key={i} className="h-4 w-24" />)}
          </div>
          <div className="space-y-3 pt-6">
            {[0,1,2,3].map(i => <Skeleton key={i} className="h-4" style={{ width: `${[100,85,90,65][i]}%` }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiX, FiBarChart2, FiTrash2 } from 'react-icons/fi';
import { removeFromCompare, clearCompare } from '../../redux/slices/compareSlice';
import StarRating from './StarRating';
import { imgSrc } from '../../utils/imageHelper';

const COMPARE_ATTRS = [
  { key: 'category',  label: 'Category',   render: (p) => p.category?.name || '—'            },
  { key: 'brand',     label: 'Brand',      render: (p) => p.brand || '—'                       },
  { key: 'price',     label: 'Price',      render: (p) => {
    if (p.hasVariants && p.variants?.length > 0) {
      const min = Math.min(...p.variants.map(v => (v.discountPrice > 0 ? v.discountPrice : v.price) || 0));
      return `From ₹${min.toLocaleString('en-IN')}`;
    }
    return `₹${(p.discountPrice > 0 ? p.discountPrice : p.price)?.toLocaleString('en-IN') || '—'}`;
  }},
  { key: 'rating',    label: 'Rating',     render: (p) => p.ratings > 0 ? `${p.ratings.toFixed(1)} ★ (${p.numReviews})` : '—' },
  { key: 'stock',     label: 'Availability', render: (p) => {
    if (p.hasVariants && p.variants?.length > 0)
      return p.variants.some(v => v.stock > 0) ? 'In Stock' : 'Out of Stock';
    return p.stock > 0 ? `${p.stock} in stock` : 'Out of Stock';
  }},
  { key: 'variants',  label: 'Variants',   render: (p) => p.variants?.length > 0 ? `${p.variants.length} options` : 'No variants' },
  { key: 'warranty',  label: 'Warranty',   render: (p) => p.warranty || '—'                   },
  { key: 'isBestSeller', label: 'Best Seller', render: (p) => p.isBestSeller ? '✓ Yes' : '—' },
  { key: 'isNewArrival', label: 'New Arrival', render: (p) => p.isNewArrival ? '✓ Yes' : '—' },
];

// Mini card shown in the floating compare bar
function MiniCard({ product, onRemove }) {
  const thumb = imgSrc(product.images?.[0]);
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 relative group/mini"
      style={{
        background:   'var(--card)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        minWidth:     '160px',
      }}
    >
      <div
        className="w-10 h-10 overflow-hidden flex-shrink-0"
        style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)' }}
      >
        <img src={thumb} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold line-clamp-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
          {product.name}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-4)' }}>
          {product.category?.name || ''}
        </p>
      </div>
      <button
        onClick={() => onRemove(product._id)}
        aria-label={`Remove ${product.name} from compare`}
        className="flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors opacity-0 group-hover/mini:opacity-100"
        style={{ color: 'var(--text-4)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
      >
        <FiX size={13} strokeWidth={2} />
      </button>
    </div>
  );
}

// Full comparison modal
function CompareModal({ items, onClose }) {
  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ESC
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const dispatch = useDispatch();

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: 'rgba(17,17,17,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto no-scrollbar animate-liftIn"
        style={{
          background:   'var(--card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow:    'var(--shadow-xl)',
          border:       '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between px-7 py-5 z-10"
          style={{
            background:  'var(--card)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            <FiBarChart2 size={18} aria-hidden="true" style={{ color: 'var(--accent)' }} />
            <h2
              className="font-bold text-[16px]"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.02em' }}
            >
              Comparing {items.length} Products
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close comparison"
            className="w-9 h-9 flex items-center justify-center transition-colors"
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full border-collapse" style={{ minWidth: `${280 + items.length * 200}px` }}>
            <colgroup>
              <col style={{ width: '200px' }} />
              {items.map(p => <col key={p._id} style={{ width: '200px' }} />)}
            </colgroup>

            {/* Product headers */}
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                <th
                  className="text-left px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: 'var(--text-4)', borderBottom: '1px solid var(--border)' }}
                >
                  Product
                </th>
                {items.map(p => (
                  <th
                    key={p._id}
                    className="px-4 py-5 text-left"
                    style={{ borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}
                  >
                    <div className="flex flex-col gap-3">
                      <div
                        className="w-20 h-20 overflow-hidden mx-auto"
                        style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <img
                          src={imgSrc(p.images?.[0])}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <p
                          className="text-[13px] font-bold line-clamp-2 leading-snug"
                          style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}
                        >
                          {p.name}
                        </p>
                        {p.ratings > 0 && (
                          <StarRating rating={p.ratings} showCount={false} size={11} className="mt-1.5" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Link
                          to={`/products/${p.slug}`}
                          onClick={onClose}
                          className="btn btn-primary w-full justify-center text-[10px]"
                          style={{ padding: '6px 12px' }}
                        >
                          View
                        </Link>
                        <button
                          onClick={() => dispatch(removeFromCompare(p._id))}
                          className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors"
                          style={{ color: 'var(--text-4)' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
                        >
                          <FiX size={11} /> Remove
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Attribute rows */}
            <tbody>
              {COMPARE_ATTRS.map((attr, rowIdx) => (
                <tr
                  key={attr.key}
                  style={{ background: rowIdx % 2 === 0 ? 'var(--card)' : 'var(--bg)' }}
                >
                  <td
                    className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--text-4)', borderBottom: '1px solid var(--border)' }}
                  >
                    {attr.label}
                  </td>
                  {items.map(p => (
                    <td
                      key={p._id}
                      className="px-4 py-4 text-[13px]"
                      style={{
                        color:        'var(--text-2)',
                        borderBottom: '1px solid var(--border)',
                        borderLeft:   '1px solid var(--border)',
                        fontWeight:   attr.key === 'price' ? 700 : 400,
                        fontFamily:   attr.key === 'price' ? 'var(--font-numbers)' : 'var(--font-body)',
                      }}
                    >
                      {attr.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Main exported component — floating compare bar
export default function CompareDrawer() {
  const dispatch = useDispatch();
  const items    = useSelector(s => s.compare.items);
  const [open,   setOpen]   = useState(false); // compare modal
  const [visible, setVisible] = useState(false); // bar enter animation

  useEffect(() => {
    if (items.length >= 1) setVisible(true);
    else setVisible(false);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <>
      {/* Floating bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          transform:  visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 320ms var(--ease)',
        }}
        role="region"
        aria-label="Product comparison"
      >
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6"
          style={{
            background:   'var(--text)',
            borderTop:    '1px solid rgba(255,255,255,0.1)',
            boxShadow:    '0 -8px 32px rgba(0,0,0,0.2)',
          }}
        >
          <div className="flex items-center gap-4 py-3 overflow-x-auto no-scrollbar">
            {/* Label */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <FiBarChart2 size={16} aria-hidden="true" style={{ color: 'var(--accent)' }} />
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/60 whitespace-nowrap">
                Compare ({items.length}/4)
              </span>
            </div>

            {/* Mini cards */}
            <div className="flex items-center gap-2 flex-1">
              {items.map(p => (
                <MiniCard key={p._id} product={p} onRemove={(id) => dispatch(removeFromCompare(id))} />
              ))}
              {/* Empty slots */}
              {items.length < 4 && Array.from({ length: 4 - items.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-center text-[11px] font-medium text-white/25"
                  style={{
                    minWidth:     '120px',
                    height:       '52px',
                    border:       '1.5px dashed rgba(255,255,255,0.15)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  + Add product
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              {items.length >= 2 && (
                <button
                  onClick={() => setOpen(true)}
                  className="btn btn-accent whitespace-nowrap"
                  style={{ fontSize: '11px', padding: '8px 16px' }}
                >
                  Compare Now
                </button>
              )}
              <button
                onClick={() => dispatch(clearCompare())}
                aria-label="Clear all from compare"
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest transition-colors text-white/40 hover:text-white whitespace-nowrap"
              >
                <FiTrash2 size={13} aria-hidden="true" /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison modal */}
      {open && <CompareModal items={items} onClose={() => setOpen(false)} />}
    </>
  );
}

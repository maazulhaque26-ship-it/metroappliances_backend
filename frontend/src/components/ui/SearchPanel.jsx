import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiX, FiArrowRight, FiTrendingUp, FiClock,
} from 'react-icons/fi';
import API from '../../services/api';
import { imgSrc } from '../../utils/imageHelper';

const POPULAR_SEARCHES = [
  'Mixer Grinder',
  'Gas Stove',
  'Induction Cooktop',
  'Pressure Cooker',
  'Juicer',
  'Mixer under ₹3000',
  'Mixer under ₹5000',
];

function ResultSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-3" aria-hidden="true">
      <div className="w-12 h-12 skeleton flex-shrink-0" style={{ borderRadius: 'var(--radius-sm)' }} />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-3/4" style={{ borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton h-2.5 w-1/2" style={{ borderRadius: 'var(--radius-sm)' }} />
      </div>
      <div className="skeleton h-4 w-16 flex-shrink-0" style={{ borderRadius: 'var(--radius-sm)' }} />
    </div>
  );
}

function displayPrice(p) {
  if ((p.hasVariants || p.variants?.length > 0) && p.variants?.length > 0) {
    const min = Math.min(
      ...p.variants.map(v => (v.discountPrice > 0 ? v.discountPrice : v.price) || Infinity)
    );
    return min === Infinity ? `₹${p.price?.toLocaleString('en-IN')}` : `From ₹${min.toLocaleString('en-IN')}`;
  }
  const price = p.discountPrice > 0 ? p.discountPrice : p.price;
  return `₹${price?.toLocaleString('en-IN')}`;
}

function isOOS(p) {
  if (p.hasVariants || p.variants?.length > 0)
    return p.variants?.every(v => v.stock === 0) ?? false;
  return p.stock === 0;
}

export default function SearchPanel({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef    = useRef(null);
  const panelRef    = useRef(null);
  const debounceRef = useRef(null);

  // Reset + focus on open
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setResults([]);
    setSelectedIdx(-1);
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Debounced API search (280ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) { setResults([]); setLoading(false); return; }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await API.get('/products', { params: { search: q, limit: 6 } });
        setResults(res.data.products || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Click outside → close
  useEffect(() => {
    if (!isOpen) return;
    const close = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isOpen, onClose]);

  const go = useCallback((path) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (selectedIdx >= 0 && results[selectedIdx]) {
        e.preventDefault();
        go(`/products/${results[selectedIdx].slug}`);
        return;
      }
      if (query.trim()) go(`/shop?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) go(`/shop?search=${encodeURIComponent(query.trim())}`);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
      className="fixed inset-0 z-50"
      style={{ background: 'rgba(17,17,17,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      <div className="flex flex-col items-center pt-[72px] sm:pt-24 px-4 sm:px-6">
        <div
          ref={panelRef}
          className="w-full max-w-2xl animate-liftIn"
          style={{
            background:   'var(--card)',
            border:       '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow:    'var(--shadow-xl)',
            overflow:     'hidden',
          }}
        >
          {/* ── Input ────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit}>
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <FiSearch
                size={20} strokeWidth={2} aria-hidden="true"
                style={{ color: 'var(--text)', flexShrink: 0 }}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIdx(-1); }}
                onKeyDown={handleKeyDown}
                placeholder="Search appliances, brands, categories…"
                aria-label="Search query"
                aria-autocomplete="list"
                aria-controls="search-results"
                autoComplete="off"
                className="flex-1 bg-transparent border-none outline-none placeholder-[rgba(17,17,17,0.25)]"
                style={{
                  fontFamily:    'var(--font-display)',
                  fontSize:      'clamp(15px, 2vw, 18px)',
                  fontWeight:    700,
                  color:         'var(--text)',
                  letterSpacing: '-0.01em',
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setResults([]); setSelectedIdx(-1); inputRef.current?.focus(); }}
                  aria-label="Clear search"
                  className="p-1.5 transition-colors flex-shrink-0"
                  style={{ color: 'var(--text-4)', borderRadius: 'var(--radius-sm)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
                >
                  <FiX size={16} strokeWidth={2} />
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary flex-shrink-0 hidden sm:inline-flex"
                style={{ fontSize: '11px', padding: '8px 16px', minHeight: 'unset' }}
              >
                Search
              </button>
            </div>
          </form>

          {/* ── Body ─────────────────────────────────────────────── */}
          <div
            id="search-results"
            role="listbox"
            aria-label="Search results"
            style={{ maxHeight: '55vh', overflowY: 'auto' }}
            className="no-scrollbar"
          >

            {/* Loading */}
            {loading && (
              <div className="py-2">
                {[1, 2, 3].map(i => <ResultSkeleton key={i} />)}
              </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: 'var(--text-4)' }}
                  >
                    Products ({results.length})
                  </span>
                  <button
                    onClick={() => go(`/shop?search=${encodeURIComponent(query)}`)}
                    className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors"
                    style={{ color: 'var(--accent)' }}
                  >
                    View all <FiArrowRight size={11} strokeWidth={2.5} aria-hidden="true" />
                  </button>
                </div>

                {results.map((r, i) => (
                  <button
                    key={r._id}
                    role="option"
                    aria-selected={i === selectedIdx}
                    onClick={() => go(`/products/${r.slug}`)}
                    onMouseEnter={() => setSelectedIdx(i)}
                    onMouseLeave={() => setSelectedIdx(-1)}
                    className="w-full flex items-center gap-4 px-5 py-3 text-left transition-colors"
                    style={{
                      background:   i === selectedIdx ? 'var(--bg)' : 'transparent',
                      borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-12 h-12 flex-shrink-0 overflow-hidden"
                      style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)' }}
                    >
                      <img
                        src={imgSrc(r.images?.[0])}
                        alt={r.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <p
                        className="text-[13px] font-semibold line-clamp-1"
                        style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}
                      >
                        {r.name}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-4)' }}>
                        {r.category?.name}
                        {isOOS(r) && (
                          <span className="ml-2 font-medium" style={{ color: '#DC2626' }}>
                            · Out of Stock
                          </span>
                        )}
                      </p>
                    </div>
                    {/* Price */}
                    <span
                      className="text-[13px] font-bold flex-shrink-0"
                      style={{ fontFamily: 'var(--font-numbers)', color: 'var(--text)' }}
                    >
                      {displayPrice(r)}
                    </span>
                    <FiArrowRight
                      size={13} strokeWidth={2} aria-hidden="true"
                      style={{ color: 'var(--text-5)', flexShrink: 0 }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {!loading && query.trim() && results.length === 0 && (
              <div className="px-5 py-10 text-center">
                <div
                  className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-md)' }}
                >
                  <FiSearch size={20} aria-hidden="true" style={{ color: 'var(--text-4)' }} />
                </div>
                <p className="font-bold text-[15px] mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                  No results for "{query}"
                </p>
                <p className="text-[12px] mb-6" style={{ color: 'var(--text-4)' }}>
                  Check spelling, or try one of these:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {POPULAR_SEARCHES.slice(0, 4).map(s => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="px-3 py-1.5 text-[11px] font-semibold transition-colors"
                      style={{
                        background:   'var(--bg)',
                        color:        'var(--text-3)',
                        border:       '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => go('/shop')}
                  className="btn btn-outline mt-6 inline-flex"
                  style={{ fontSize: '11px', padding: '10px 20px' }}
                >
                  Browse All Products
                </button>
              </div>
            )}

            {/* Popular searches (empty input) */}
            {!query.trim() && (
              <div className="px-5 py-4">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2"
                  style={{ color: 'var(--text-4)' }}
                >
                  <FiTrendingUp size={12} aria-hidden="true" /> Popular Searches
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {POPULAR_SEARCHES.map(s => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors"
                      style={{
                        background:   'var(--bg)',
                        color:        'var(--text-3)',
                        border:       '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
                    >
                      <FiClock size={11} aria-hidden="true" /> {s}
                    </button>
                  ))}
                </div>
                <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
                    style={{ color: 'var(--text-4)' }}
                  >
                    Browse Collections
                  </p>
                  <button
                    onClick={() => go('/shop')}
                    className="flex items-center gap-2 text-[12px] font-semibold transition-colors"
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                  >
                    <FiArrowRight size={13} strokeWidth={2.5} aria-hidden="true" />
                    View All Products
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer hints ──────────────────────────────────────── */}
          <div
            className="flex items-center gap-4 px-5 py-3"
            style={{
              borderTop: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-5)',
              fontSize: '11px',
            }}
          >
            <span>
              <kbd
                className="px-1.5 py-0.5 font-mono text-[10px]"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--text-3)' }}
              >
                ↑↓
              </kbd>
              {' '}Navigate
            </span>
            <span>
              <kbd
                className="px-1.5 py-0.5 font-mono text-[10px]"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--text-3)' }}
              >
                ↵
              </kbd>
              {' '}Select
            </span>
            <span>
              <kbd
                className="px-1.5 py-0.5 font-mono text-[10px]"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--text-3)' }}
              >
                ESC
              </kbd>
              {' '}Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

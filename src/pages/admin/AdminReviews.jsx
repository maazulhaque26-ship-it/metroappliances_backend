import React, { useEffect, useState, useCallback, useRef } from 'react';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import useAdminSocket from '../../hooks/useAdminSocket';
import { toast } from 'react-toastify';
import { imgSrc } from '../../utils/imageHelper';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  FiSearch, FiStar, FiCheck, FiX, FiEyeOff, FiTrash2, FiImage,
  FiChevronLeft, FiChevronRight, FiRefreshCw, FiMessageSquare,
} from 'react-icons/fi';

const STATUS_TABS = [
  { key: '',         label: 'All' },
  { key: 'pending',  label: 'Pending'  },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'hidden',   label: 'Hidden'   },
];

const STATUS_BADGE = {
  pending:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  hidden:   'bg-gray-50 text-gray-700 border-gray-200',
};

function Stars({ rating }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <FiStar key={i} size={14}
          className={i <= rating ? 'text-[var(--text)]' : 'text-[#CCCCCC]'}
          fill={i <= rating ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  );
}

function ImageLightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--text)]/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors">
          <FiX size={32} />
        </button>
        <img
          src={imgSrc(images[idx])}
          alt="Review"
          className="w-full max-h-[80vh] object-contain"
        />
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-6 mt-6">
            <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
              className="p-3 bg-white/10 hover:bg-white/20 text-white transition-colors">
              <FiChevronLeft size={24} />
            </button>
            <span className="text-white/60 text-sm font-bold uppercase tracking-widest">{idx + 1} / {images.length}</span>
            <button onClick={() => setIdx(i => (i + 1) % images.length)}
              className="p-3 bg-white/10 hover:bg-white/20 text-white transition-colors">
              <FiChevronRight size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminReviews() {
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [statusTab,  setStatusTab]  = useState('pending');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [acting,     setActing]     = useState(null);
  const [lightbox,   setLightbox]   = useState(null);
  const searchRef = useRef(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/reviews', {
        params: { status: statusTab, search, page, limit: 15 },
      });
      setReviews(data.reviews || []);
      setTotal(data.total   || 0);
      setPages(data.pages   || 1);
    } catch { toast.error('Failed to load reviews'); }
    finally { setLoading(false); }
  }, [statusTab, search, page]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  useAdminSocket({
    'review:created':      () => fetchReviews(),
    'review:statusChanged': (data) => {
      setReviews(prev => prev.map(r => r._id === data.review?._id ? data.review : r));
    },
    'review:deleted': (data) => {
      setReviews(prev => prev.filter(r => r._id !== data.reviewId));
    },
  });

  useEffect(() => { setPage(1); }, [statusTab, search]);

  const setStatus = async (id, status) => {
    try {
      setActing(id + status);
      const { data } = await API.put(`/admin/reviews/${id}/status`, { status });
      setReviews(prev => prev.map(r => r._id === id ? data.review : r));
      toast.success(`Review ${status}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setActing(null); }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Permanently delete this review?')) return;
    try {
      setActing(id + 'delete');
      await API.delete(`/admin/reviews/${id}`);
      setReviews(prev => prev.filter(r => r._id !== id));
      setTotal(t => t - 1);
      toast.success('Review deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setActing(null); }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Review Management</h1>
            <p className="text-[var(--text-3)] text-sm font-medium mt-1">{total} total reviews</p>
          </div>
          <button onClick={fetchReviews} className="flex items-center gap-2 px-6 py-3 bg-white border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase tracking-widest hover:border-[#111111] transition-colors">
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATUS_TABS.filter(t => t.key).map(t => {
            const count = t.key === statusTab ? total : undefined;
            return (
              <button key={t.key} onClick={() => setStatusTab(t.key)}
                className={`p-6 border text-left transition-colors bg-white ${
                  statusTab === t.key ? 'border-[#111111]' : 'border-[var(--border)] hover:border-[#CCCCCC]'
                }`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
                  t.key === 'pending' ? 'text-yellow-600' : t.key === 'approved' ? 'text-green-600' :
                  t.key === 'rejected' ? 'text-red-600' : 'text-[var(--text-3)]'
                }`}>{t.label}</div>
                {count !== undefined && <div className="text-[var(--text)] font-extrabold text-3xl" style={{ fontFamily: 'var(--font-display)' }}>{count}</div>}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white border border-[var(--border)] p-4 items-center">
          {/* Search */}
          <div className="relative flex-1 w-full sm:w-auto">
            <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by customer, product, or content…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#111111]"
            />
          </div>
          {/* Status Tabs */}
          <div className="flex gap-2 flex-wrap">
            {STATUS_TABS.map(t => (
              <button key={t.key} onClick={() => setStatusTab(t.key)}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors border ${
                  statusTab === t.key ? 'bg-[var(--text)] text-white border-[#111111]' : 'bg-[var(--bg)] text-[var(--text-3)] border-[var(--border)] hover:border-[#111111] hover:text-[var(--text)]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Review Cards */}
        {loading ? (
          <TableSkeleton rows={6} />
        ) : reviews.length === 0 ? (
          <div className="text-center py-24 bg-white border border-[var(--border)]">
            <FiMessageSquare size={48} className="mx-auto text-[#CCCCCC] mb-6" />
            <p className="text-[var(--text-3)] text-sm font-medium">No reviews found in this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review._id}
                className="bg-white border border-[var(--border)] p-6 sm:p-8">

                <div className="flex flex-col lg:flex-row lg:items-start gap-8">

                  {/* Left: User + Product info */}
                  <div className="flex items-start gap-6 flex-1 min-w-0">
                    {/* Avatar */}
                    {review.avatar ? (
                      <img src={imgSrc(review.avatar)} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-[var(--border)] flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] font-bold text-lg flex-shrink-0" style={{ fontFamily: 'var(--font-display)' }}>
                        {review.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {/* Customer + Status */}
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-[var(--text)] font-bold">{review.user?.name || 'Unknown'}</span>
                        {review.city && <span className="text-[var(--text-3)] text-xs">({review.city})</span>}
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 border ${STATUS_BADGE[review.status] || ''}`}>
                          {review.status}
                        </span>
                      </div>
                      {/* Product */}
                      <p className="text-[var(--text-3)] text-xs font-bold uppercase tracking-widest mb-4 truncate">
                        Product: <span className="text-[var(--text)]">{review.product?.name || '—'}</span>
                      </p>
                      {/* Stars + Date */}
                      <div className="flex items-center gap-4 mb-4">
                        <Stars rating={review.rating} />
                        <span className="text-[var(--text-3)] text-xs font-bold tracking-widest uppercase">
                          {new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {/* Title */}
                      {review.title && (
                        <p className="text-[var(--text)] font-bold text-lg mb-2" style={{ fontFamily: 'var(--font-display)' }}>{review.title}</p>
                      )}
                      {/* Comment */}
                      <p className="text-[#444444] text-sm leading-relaxed">{review.comment}</p>

                      {/* Images */}
                      {review.images?.length > 0 && (
                        <div className="flex gap-3 mt-6">
                          {review.images.map((img, i) => (
                            <button key={i} onClick={() => setLightbox({ images: review.images, index: i })}
                              className="w-20 h-20 bg-[var(--bg)] border border-[var(--border)] flex-shrink-0 group relative overflow-hidden">
                              <img src={imgSrc(img)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-[var(--text)]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <FiImage size={20} className="text-white" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Action buttons */}
                  <div className="flex flex-wrap lg:flex-col gap-3 flex-shrink-0">
                    {review.status !== 'approved' && (
                      <button
                        onClick={() => setStatus(review._id, 'approved')}
                        disabled={acting === review._id + 'approved'}
                        className="flex items-center justify-center gap-2 px-6 py-3 border border-green-600 text-green-700 text-xs font-bold uppercase tracking-widest hover:bg-green-50 transition-colors disabled:opacity-50">
                        <FiCheck size={14} /> Approve
                      </button>
                    )}
                    {review.status !== 'rejected' && (
                      <button
                        onClick={() => setStatus(review._id, 'rejected')}
                        disabled={acting === review._id + 'rejected'}
                        className="flex items-center justify-center gap-2 px-6 py-3 border border-red-600 text-red-700 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50">
                        <FiX size={14} /> Reject
                      </button>
                    )}
                    {review.status !== 'hidden' && (
                      <button
                        onClick={() => setStatus(review._id, 'hidden')}
                        disabled={acting === review._id + 'hidden'}
                        className="flex items-center justify-center gap-2 px-6 py-3 border border-[var(--border)] text-[var(--text-3)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--bg)] transition-colors disabled:opacity-50">
                        <FiEyeOff size={14} /> Hide
                      </button>
                    )}
                    <button
                      onClick={() => deleteReview(review._id)}
                      disabled={acting === review._id + 'delete'}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50 mt-2">
                        <FiTrash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-6 pt-8 border-t border-[var(--border)]">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-6 py-3 bg-white border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase disabled:opacity-50 hover:border-[#111111] transition-colors">
              Previous
            </button>
            <span className="text-[var(--text-3)] text-xs font-bold uppercase tracking-widest">Page {page} of {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-6 py-3 bg-white border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase disabled:opacity-50 hover:border-[#111111] transition-colors">
              Next
            </button>
          </div>
        )}
      </div>

      {/* Image lightbox */}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </AdminLayout>
  );
}

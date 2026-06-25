import React, { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchNotifications, markNotifRead, markAllNotifRead,
} from '../../redux/slices/notificationSlice';
import {
  FiBell, FiPackage, FiTag, FiHeart, FiArrowDown,
  FiInfo, FiShoppingBag, FiTrendingDown, FiCheckCircle,
} from 'react-icons/fi';

const TYPE_META = {
  order:          { icon: FiShoppingBag, color: '#3B82F6' },
  offer:          { icon: FiTag,         color: '#FF7A00' },
  coupon:         { icon: FiTag,         color: '#10B981' },
  wishlist:       { icon: FiHeart,       color: '#EF4444' },
  price_drop:     { icon: FiTrendingDown,color: '#F59E0B' },
  back_in_stock:  { icon: FiPackage,     color: '#8B5CF6' },
  admin:          { icon: FiInfo,        color: '#6B7280' },
  system:         { icon: FiInfo,        color: '#6B7280' },
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)  return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationCenter({ open, onClose }) {
  const dispatch     = useDispatch();
  const { items, unreadCount, loading, hasMore, page } = useSelector(s => s.notifications);
  const panelRef     = useRef(null);
  const { token }    = useSelector(s => s.auth);

  useEffect(() => {
    if (!token || !open) return;
    dispatch(fetchNotifications(1));
  }, [open, token, dispatch]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  const handleRead = (id) => dispatch(markNotifRead(id));
  const handleReadAll = () => dispatch(markAllNotifRead());
  const loadMore = () => { if (hasMore && !loading) dispatch(fetchNotifications(page + 1)); };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 overflow-hidden"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Notifications</p>
          {unreadCount > 0 && (
            <span
              className="text-[9px] font-black px-1.5 py-0.5"
              style={{ background: '#EF4444', color: '#fff', borderRadius: '10px' }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleReadAll}
            className="text-[10px] font-semibold transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto no-scrollbar">
        {loading && items.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12px]" style={{ color: 'var(--text-4)' }}>Loading…</p>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <FiBell size={24} className="mx-auto mb-2" style={{ color: 'var(--text-5)' }} />
            <p className="text-[12px]" style={{ color: 'var(--text-4)' }}>No notifications yet</p>
          </div>
        ) : (
          <>
            {items.map(n => {
              const meta = TYPE_META[n.type] || TYPE_META.system;
              const Icon = meta.icon;
              return (
                <div
                  key={n._id}
                  onClick={() => { if (!n.isRead) handleRead(n._id); }}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: n.isRead ? 'transparent' : 'rgba(255,138,0,0.03)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(255,138,0,0.03)'}
                >
                  <div
                    className="flex items-center justify-center w-7 h-7 flex-shrink-0 mt-0.5"
                    style={{ background: `${meta.color}15`, borderRadius: 'var(--radius-sm)' }}
                  >
                    <Icon size={12} style={{ color: meta.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold leading-snug" style={{ color: 'var(--text)' }}>{n.title}</p>
                    <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--text-4)' }}>{n.message}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-5)' }}>{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: 'var(--accent)' }} />
                  )}
                </div>
              );
            })}
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 text-[11px] font-semibold transition-colors"
                style={{ color: 'var(--text-4)' }}
              >
                <FiArrowDown size={12} /> {loading ? 'Loading…' : 'Load more'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import React, { memo, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import API from '../services/api';
import ImageWithFallback from '../components/ui/ImageWithFallback';
import OrderStatusBadge from '../components/ui/OrderStatusBadge';
import { OrderListCardSkeleton } from '../components/ui/Skeleton';
import { estimateExpectedDelivery } from '../utils/orderTracking';
import { openInvoice } from '../utils/invoice';
import { addToCart } from '../redux/slices/shopSlices';
import {
  FiPackage, FiTruck, FiDownload, FiRefreshCw, FiMapPin,
  FiX, FiShoppingBag,
} from 'react-icons/fi';

// Status filter config — driven by data, not hardcoded rendering
const STATUS_FILTERS = [
  { key: 'All',        label: 'All Orders' },
  { key: 'Pending',    label: 'Pending'    },
  { key: 'Processing', label: 'Processing' },
  { key: 'Shipped',    label: 'Shipped'    },
  { key: 'Delivered',  label: 'Delivered'  },
  { key: 'Cancelled',  label: 'Cancelled'  },
];

const OrderCard = memo(function OrderCard({ order, onReorder, reordering, onCancel, cancelling }) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const expected  = estimateExpectedDelivery(order);
  const canCancel = ['Pending', 'Processing'].includes(order.status);

  const handleCancelClick = () => {
    if (cancelling) return;
    onCancel(order._id);
    setShowCancelConfirm(false);
  };

  return (
    <article
      className="p-5 sm:p-6 transition-shadow"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
    >
      {/* Header row: status + order meta */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <OrderStatusBadge status={order.status} size="lg" />
        <p className="text-[11px] font-medium" style={{ color: 'var(--text-4)' }}>
          #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
          {' · '}
          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Images + summary */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex -space-x-3 flex-shrink-0">
          {order.items?.slice(0, 4).map((item, i) => (
            <ImageWithFallback
              key={i}
              src={item.image}
              fallbackSrc={item.product?.images?.[0]}
              alt={item.name}
              className="w-14 h-14 flex-shrink-0"
              imgClassName="w-full h-full object-cover"
              loading="lazy"
              style={{ border: '2px solid var(--card)', borderRadius: 'var(--radius-sm)', zIndex: 4 - i }}
            />
          ))}
          {order.items?.length > 4 && (
            <div
              className="w-14 h-14 flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--bg-2)', border: '2px solid var(--card)', borderRadius: 'var(--radius-sm)', color: 'var(--text-3)', zIndex: 0 }}
            >
              +{order.items.length - 4}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
            {order.items?.[0]?.name}
            {order.items?.length > 1 ? ` and ${order.items.length - 1} more item${order.items.length > 2 ? 's' : ''}` : ''}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
            {' · '}{order.paymentMethod}
            {' · '}<span style={{ color: order.paymentStatus === 'Paid' ? '#16A34A' : 'var(--text-3)' }}>{order.paymentStatus}</span>
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p
            className="font-extrabold text-lg"
            style={{ fontFamily: 'var(--font-numbers)', color: 'var(--text)', letterSpacing: '-0.02em' }}
          >
            ₹{order.totalPrice?.toLocaleString('en-IN')}
          </p>
          {order.status !== 'Cancelled' && (
            <p className="text-[10px] font-bold mt-0.5 flex items-center justify-end gap-1" style={{ color: 'var(--text-4)' }}>
              <FiMapPin size={9} aria-hidden="true" />
              {order.status === 'Delivered'
                ? 'Delivered'
                : expected
                  ? `By ${expected.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                  : '—'}
            </p>
          )}
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center flex-wrap gap-3">
        <Link
          to={`/track-order/${order._id}`}
          className="btn btn-sm flex-1 sm:flex-initial"
          style={{ background: 'var(--text)', color: '#fff', textDecoration: 'none' }}
        >
          <FiTruck size={13} aria-hidden="true" /> Track Order
        </Link>
        <Link
          to={`/order/${order._id}`}
          className="btn btn-sm btn-outline flex-1 sm:flex-initial"
          style={{ textDecoration: 'none' }}
        >
          View Details
        </Link>

        {/* Secondary actions */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 ml-auto mt-1 sm:mt-0">
          <button
            onClick={() => openInvoice(order)}
            className="inline-flex items-center gap-1 text-xs font-bold transition-colors"
            style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            <FiDownload size={12} aria-hidden="true" /> Invoice
          </button>
          <button
            onClick={() => onReorder(order)}
            disabled={reordering === order._id}
            aria-label="Reorder these items"
            className="inline-flex items-center gap-1 text-xs font-bold disabled:opacity-50 transition-colors"
            style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: reordering === order._id ? 'not-allowed' : 'pointer' }}
            onMouseEnter={e => { if (reordering !== order._id) e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            <FiRefreshCw size={12} className={reordering === order._id ? 'animate-spin' : ''} aria-hidden="true" /> Reorder
          </button>
          {canCancel && !showCancelConfirm && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="inline-flex items-center gap-1 text-xs font-bold transition-colors"
              style={{ color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <FiX size={11} aria-hidden="true" /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Inline cancel confirmation */}
      {showCancelConfirm && (
        <div
          className="flex items-center justify-between flex-wrap gap-3 mt-4 pt-4"
          style={{ borderTop: '1px solid var(--border)' }}
          role="alert"
        >
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            Cancel order #{order.orderNumber || order._id?.slice(-8).toUpperCase()}?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-3)', background: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              Keep Order
            </button>
            <button
              onClick={handleCancelClick}
              disabled={cancelling === order._id}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
              style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: cancelling === order._id ? 'not-allowed' : 'pointer' }}
            >
              {cancelling === order._id ? 'Cancelling…' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
});

export default function Orders() {
  const dispatch     = useDispatch();
  const { token }    = useSelector(s => s.auth);
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [reordering, setReordering] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (!token) return;
    API.get('/orders/my-orders')
      .then(r => setOrders(r.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // ── Handlers (reorder logic unchanged) ──────────────────────────────────

  const handleReorder = useCallback(async (order) => {
    try {
      setReordering(order._id);
      for (const item of order.items) {
        const productId = item.product?._id || item.product;
        if (!productId) continue;
        await dispatch(addToCart({
          productId,
          quantity:    item.quantity,
          variantId:   item.variantId   || undefined,
          variantName: item.variantName || undefined,
        })).unwrap();
      }
      toast.success('Items added to cart');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Some items could not be added');
    } finally {
      setReordering(null);
    }
  }, [dispatch]);

  const handleCancel = useCallback(async (orderId) => {
    try {
      setCancelling(orderId);
      const { data } = await API.put(`/orders/${orderId}/cancel`);
      setOrders(prev => prev.map(o => o._id === orderId ? data.order : o));
      toast.success('Order cancelled');
    } catch {
      toast.error('Failed to cancel order');
    } finally {
      setCancelling(null);
    }
  }, []);

  // ── Derived: filtered list + per-status counts ───────────────────────────

  const filtered = statusFilter === 'All' ? orders : orders.filter(o => o.status === statusFilter);

  const countFor = (key) => key === 'All' ? orders.length : orders.filter(o => o.status === key).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pt-32 pb-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Page heading */}
        <div className="mb-8">
          <h1
            className="font-extrabold"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,36px)', color: 'var(--text)', letterSpacing: '-0.025em' }}
          >
            My Orders
          </h1>
          {orders.length > 0 && (
            <p className="mt-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>
              {orders.length} order{orders.length !== 1 ? 's' : ''} total
            </p>
          )}
        </div>

        {/* Status filter tabs */}
        {!loading && orders.length > 0 && (
          <div
            className="flex overflow-x-auto no-scrollbar mb-6"
            role="tablist"
            aria-label="Filter orders by status"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            {STATUS_FILTERS.map(({ key, label }) => {
              const count = countFor(key);
              if (key !== 'All' && count === 0) return null;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={statusFilter === key}
                  onClick={() => setStatusFilter(key)}
                  className="flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap border-b-2 -mb-px transition-all"
                  style={{
                    color:       statusFilter === key ? 'var(--text)' : 'var(--text-4)',
                    borderColor: statusFilter === key ? 'var(--text)' : 'transparent',
                    background:  'none',
                    border:      'none',
                    borderBottom: `2px solid ${statusFilter === key ? 'var(--text)' : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                >
                  {label}
                  {count > 0 && (
                    <span
                      className="text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center"
                      style={{
                        background: statusFilter === key ? 'var(--text)' : 'var(--bg-2)',
                        color:      statusFilter === key ? '#fff' : 'var(--text-4)',
                        borderRadius: '99px', padding: '0 5px',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4" aria-live="polite" aria-label="Loading orders">
            {[1, 2, 3].map(i => <OrderListCardSkeleton key={i} />)}
          </div>

        ) : orders.length === 0 ? (
          // No orders at all
          <div
            className="text-center py-24 px-6"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--bg-2)' }}
            >
              <FiPackage size={32} style={{ color: 'var(--text-4)' }} aria-hidden="true" />
            </div>
            <h2 className="font-bold text-xl mb-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              No orders yet
            </h2>
            <p className="mb-8" style={{ color: 'var(--text-3)', fontSize: '14px' }}>
              Your orders will appear here once you start shopping.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 font-bold uppercase tracking-widest text-sm"
              style={{ background: 'var(--text)', color: '#fff', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}
            >
              <FiShoppingBag size={15} aria-hidden="true" /> Browse Products
            </Link>
          </div>

        ) : filtered.length === 0 ? (
          // Filter returned nothing
          <div
            className="text-center py-20 px-6"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
          >
            <FiPackage size={28} className="mx-auto mb-4" style={{ color: 'var(--text-5)' }} aria-hidden="true" />
            <p className="font-bold text-base mb-2" style={{ color: 'var(--text)' }}>
              No {statusFilter.toLowerCase()} orders
            </p>
            <button
              onClick={() => setStatusFilter('All')}
              className="text-sm font-bold uppercase tracking-widest mt-1 transition-colors"
              style={{ color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
            >
              View all orders
            </button>
          </div>

        ) : (
          <div className="space-y-4" aria-live="polite">
            {filtered.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                onReorder={handleReorder}
                reordering={reordering}
                onCancel={handleCancel}
                cancelling={cancelling}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

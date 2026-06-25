import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import OrderTracking from '../components/ui/OrderTracking';
import OrderStatusBadge from '../components/ui/OrderStatusBadge';
import { TrackOrderSkeleton } from '../components/ui/Skeleton';
import { estimateExpectedDelivery } from '../utils/orderTracking';
import ImageWithFallback from '../components/ui/ImageWithFallback';
import {
  FiArrowLeft, FiPackage, FiClock, FiMapPin, FiCreditCard,
} from 'react-icons/fi';

export default function TrackOrderPage() {
  const { orderId } = useParams();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/orders/${orderId}`)
      .then(r => setOrder(r.data.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <TrackOrderSkeleton />;

  if (!order) return (
    <div className="min-h-screen pt-32 pb-24 flex flex-col items-center justify-center gap-5" style={{ background: 'var(--bg)' }}>
      <div
        className="w-20 h-20 flex items-center justify-center"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '50%' }}
      >
        <FiPackage size={32} style={{ color: 'var(--text-4)' }} aria-hidden="true" />
      </div>
      <p className="font-bold text-lg" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Order not found</p>
      <Link
        to="/my-orders"
        className="inline-flex items-center gap-2 px-6 py-3 font-bold uppercase tracking-widest text-[11px]"
        style={{ background: 'var(--text)', color: '#fff', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}
      >
        Back to Orders
      </Link>
    </div>
  );

  const expected = estimateExpectedDelivery(order);
  const trackingId = order.statusHistory?.find(h => h.trackingId)?.trackingId;
  const courier    = order.statusHistory?.find(h => h.courier)?.courier;

  return (
    <div className="min-h-screen pt-32 pb-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Back link */}
        <Link
          to="/my-orders"
          className="inline-flex items-center gap-2 text-sm font-medium mb-6 transition-colors"
          style={{ color: 'var(--text-4)', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
        >
          <FiArrowLeft size={15} aria-hidden="true" /> Back to Orders
        </Link>

        {/* Order summary card */}
        <div
          className="mb-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px' }}
        >
          {/* Title row */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <h1
                className="font-extrabold"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,3vw,24px)', color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
              >
                Track Order #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-4)' }}>
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <OrderStatusBadge status={order.status} size="lg" />
          </div>

          {/* Stats row */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: 'var(--text-4)' }}>
                <FiClock size={9} aria-hidden="true" /> Expected By
              </p>
              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                {order.status === 'Cancelled'
                  ? '—'
                  : order.status === 'Delivered'
                    ? 'Delivered'
                    : expected
                      ? expected.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: 'var(--text-4)' }}>
                <FiMapPin size={9} aria-hidden="true" /> Ship To
              </p>
              <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
                {order.shippingAddress?.city || '—'}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-4)' }}>
                Tracking ID
              </p>
              <p className="font-bold text-sm font-mono truncate" style={{ color: 'var(--text)', letterSpacing: '0.03em' }}>
                {trackingId || 'Not available'}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: 'var(--text-4)' }}>
                <FiCreditCard size={9} aria-hidden="true" /> Total
              </p>
              <p
                className="font-bold text-sm"
                style={{ fontFamily: 'var(--font-numbers)', color: 'var(--text)', letterSpacing: '-0.02em' }}
              >
                ₹{order.totalPrice?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Courier info (show only when available) */}
          {(trackingId || courier) && (
            <div
              className="flex items-center gap-3 mt-4 pt-4"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <div
                className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)' }}
              >
                <FiPackage size={14} style={{ color: 'var(--text-3)' }} aria-hidden="true" />
              </div>
              <div>
                {courier && (
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{courier}</p>
                )}
                {trackingId && (
                  <p className="text-[11px]" style={{ color: 'var(--text-4)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    {trackingId}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Order Tracking component (untouched) */}
        <div className="mb-4">
          <OrderTracking order={order} />
        </div>

        {/* Items thumbnail strip */}
        {order.items?.length > 0 && (
          <div
            style={{ padding: '20px 24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-4)' }}>
              Items in this order ({order.items.length})
            </p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {order.items.map((item, i) => (
                <div key={i} className="flex-shrink-0 flex items-center gap-3" style={{ minWidth: 0 }}>
                  <ImageWithFallback
                    src={item.image}
                    fallbackSrc={item.product?.images?.[0]}
                    alt={item.name}
                    className="w-14 h-14 flex-shrink-0"
                    imgClassName="w-full h-full object-contain mix-blend-multiply"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                  />
                  <div style={{ minWidth: '120px', maxWidth: '180px' }}>
                    <p className="text-xs font-bold line-clamp-2 leading-snug" style={{ color: 'var(--text)' }}>{item.name}</p>
                    {item.variantName && (
                      <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--accent)' }}>{item.variantName}</p>
                    )}
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-4)', fontFamily: 'var(--font-numbers)' }}>
                      Qty {item.quantity} · ₹{item.price?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  {i < order.items.length - 1 && (
                    <div className="w-px h-12 flex-shrink-0" style={{ background: 'var(--border)' }} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
              <Link
                to={`/order/${order._id}`}
                className="text-[11px] font-bold uppercase tracking-widest transition-colors"
                style={{ color: 'var(--text-4)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
              >
                Full Order Details →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

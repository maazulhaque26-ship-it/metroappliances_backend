import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import API from '../services/api';
import ImageWithFallback from '../components/ui/ImageWithFallback';
import OrderTracking from '../components/ui/OrderTracking';
import OrderStatusBadge from '../components/ui/OrderStatusBadge';
import { OrderDetailSkeleton } from '../components/ui/Skeleton';
import { estimateExpectedDelivery } from '../utils/orderTracking';
import { openInvoice } from '../utils/invoice';
import { addToCart } from '../redux/slices/shopSlices';
import { trackPurchase } from '../utils/analytics';
import {
  FiPackage, FiCheckCircle, FiTruck,
  FiArrowLeft, FiMapPin, FiCreditCard, FiShield,
  FiDownload, FiRefreshCw, FiUser, FiX,
} from 'react-icons/fi';

export default function OrderDetailPage() {
  const { id }     = useParams();
  const dispatch   = useDispatch();
  const [sp]       = useSearchParams();
  const isSuccess  = sp.get('success') === 'true';

  const [order,             setOrder]             = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [cancelling,        setCancelling]        = useState(false);
  const [reordering,        setReordering]        = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    API.get(`/orders/${id}`)
      .then(r => {
        setOrder(r.data.order);
        if (isSuccess) trackPurchase(r.data.order);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]); // isSuccess is stable (from URL, doesn't change)

  useEffect(() => {
    if (order && window.location.hash === '#tracking') {
      document.getElementById('tracking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [order]);

  const handleCancel = async () => {
    try {
      setCancelling(true);
      const { data } = await API.put(`/orders/${id}/cancel`);
      setOrder(data.order);
      setShowCancelConfirm(false);
      toast.success('Order cancelled');
    } catch {
      toast.error('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = useCallback(async () => {
    if (!order) return;
    try {
      setReordering(true);
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
      setReordering(false);
    }
  }, [dispatch, order]);

  if (loading) return <OrderDetailSkeleton />;

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

  const canCancel = ['Pending', 'Processing'].includes(order.status);
  const expected  = estimateExpectedDelivery(order);

  return (
    <div className="min-h-screen pt-32 pb-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Success banner */}
        {isSuccess && (
          <div
            className="p-8 mb-8 text-center"
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)' }}
            role="alert"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#DCFCE7' }}>
              <FiCheckCircle size={32} style={{ color: '#16A34A' }} aria-hidden="true" />
            </div>
            <h2 className="font-extrabold text-2xl mb-1" style={{ color: '#111111', fontFamily: 'var(--font-display)' }}>
              Order Confirmed!
            </h2>
            <p className="text-sm mb-1" style={{ color: '#555555' }}>
              Order #{order?.orderNumber || order?._id?.slice(-8).toUpperCase()}
            </p>
            <p className="text-sm mb-6" style={{ color: '#555555' }}>
              We'll send you tracking updates. Estimated delivery: 3–7 business days.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                to={`/orders/${id}#tracking`}
                className="inline-flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors"
                style={{ background: '#16A34A', color: '#fff', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}
              >
                <FiTruck size={13} /> Track Order
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors"
                style={{ background: 'transparent', border: '1.5px solid #16A34A', color: '#16A34A', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}

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

        {/* Header card */}
        <div
          className="mb-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px' }}
        >
          {/* Title + status */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <h1
                className="font-extrabold"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,3vw,24px)', color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
              >
                Order #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-4)' }}>
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <OrderStatusBadge status={order.status} size="lg" />
          </div>

          {/* Metadata grid */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {[
              { icon: FiUser,      label: 'Customer', value: order.shippingAddress?.fullName || '—' },
              { icon: FiCreditCard, label: 'Payment', value: `${order.paymentMethod} · ${order.paymentStatus}` },
              { icon: FiMapPin,    label: 'Deliver To', value: order.shippingAddress?.city || '—' },
              {
                icon: FiTruck, label: order.status === 'Delivered' ? 'Delivered On' : 'Expected By',
                value: order.status === 'Cancelled' ? '—' : expected ? expected.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—',
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-4)' }}>
                  <Icon size={9} aria-hidden="true" /> {label}
                </p>
                <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div
            className="flex flex-wrap gap-2 mt-5 pt-5"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <button
              onClick={() => openInvoice(order)}
              className="btn btn-sm btn-outline"
            >
              <FiDownload size={13} aria-hidden="true" /> Invoice
            </button>
            <button
              onClick={handleReorder}
              disabled={reordering}
              className="btn btn-sm btn-outline disabled:opacity-50"
            >
              <FiRefreshCw size={13} className={reordering ? 'animate-spin' : ''} aria-hidden="true" />
              {reordering ? 'Adding…' : 'Reorder'}
            </button>
            {canCancel && !showCancelConfirm && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="btn btn-sm"
                style={{ background: 'transparent', border: '1.5px solid #FCA5A5', color: '#DC2626' }}
              >
                <FiX size={13} aria-hidden="true" /> Cancel Order
              </button>
            )}
          </div>

          {/* Inline cancel confirmation */}
          {showCancelConfirm && (
            <div
              className="flex items-center justify-between flex-wrap gap-3 mt-4 pt-4"
              style={{ borderTop: '1px solid var(--border)' }}
              role="alert"
            >
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                Cancel order #{order.orderNumber || order._id?.slice(-8).toUpperCase()}? This cannot be undone.
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
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                  style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: cancelling ? 'not-allowed' : 'pointer' }}
                >
                  {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tracking */}
        <div id="tracking" className="mb-4">
          <OrderTracking order={order} />
        </div>

        {/* Items */}
        <div
          className="mb-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px' }}
        >
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-5 flex items-center gap-2" style={{ color: 'var(--text-4)' }}>
            <FiPackage size={13} aria-hidden="true" /> Items Ordered ({order.items?.length || 0})
          </h2>
          <div className="space-y-5">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <ImageWithFallback
                  src={item.image}
                  fallbackSrc={item.product?.images?.[0]}
                  alt={item.name}
                  className="w-16 h-16 flex-shrink-0"
                  imgClassName="w-full h-full object-contain mix-blend-multiply"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm line-clamp-2" style={{ color: 'var(--text)' }}>{item.name}</p>
                  {item.variantName && (
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--accent)' }}>
                      {item.variantName}
                    </p>
                  )}
                  <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-4)' }}>
                    Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                  </p>
                </div>
                <span
                  className="font-extrabold text-sm flex-shrink-0"
                  style={{ fontFamily: 'var(--font-numbers)', color: 'var(--text)', letterSpacing: '-0.02em' }}
                >
                  ₹{(item.price * item.quantity)?.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping + Payment grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          {/* Shipping address */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            <h2 className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text-4)' }}>
              <FiMapPin size={13} aria-hidden="true" /> Delivery Address
            </h2>
            {order.shippingAddress ? (
              <div className="text-sm space-y-1">
                <p className="font-bold" style={{ color: 'var(--text)' }}>{order.shippingAddress.fullName}</p>
                <p style={{ color: 'var(--text-3)' }}>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p style={{ color: 'var(--text-3)' }}>{order.shippingAddress.addressLine2}</p>
                )}
                <p style={{ color: 'var(--text-3)' }}>
                  {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                </p>
                {order.shippingAddress.phone && (
                  <p style={{ color: 'var(--text-4)', paddingTop: '4px' }}>📞 {order.shippingAddress.phone}</p>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--text-4)', fontSize: '13px' }}>No address on record</p>
            )}
          </div>

          {/* Payment summary */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            <h2 className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text-4)' }}>
              <FiCreditCard size={13} aria-hidden="true" /> Payment Summary
            </h2>
            <div className="space-y-3 text-sm">
              {[
                { l: 'Subtotal',   v: `₹${order.itemsPrice?.toLocaleString('en-IN')}` },
                { l: 'Shipping',   v: order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice?.toLocaleString('en-IN')}` },
                { l: 'Tax / GST',  v: `₹${order.taxPrice?.toLocaleString('en-IN') || 0}` },
                { l: 'Payment',   v: order.paymentMethod },
                { l: 'Status',    v: order.paymentStatus },
              ].map(({ l, v }) => (
                <div key={l} className="flex justify-between">
                  <span className="font-medium" style={{ color: 'var(--text-4)' }}>{l}</span>
                  <span
                    className="font-bold"
                    style={{ color: l === 'Status' ? (v === 'Paid' ? '#16A34A' : '#D97706') : 'var(--text)' }}
                  >
                    {v}
                  </span>
                </div>
              ))}
              <div
                className="flex justify-between items-baseline pt-3"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <span className="font-bold text-xs uppercase tracking-widest" style={{ color: 'var(--text)' }}>Total</span>
                <span
                  className="font-extrabold text-xl"
                  style={{ fontFamily: 'var(--font-numbers)', color: 'var(--text)', letterSpacing: '-0.03em' }}
                >
                  ₹{order.totalPrice?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Secure note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-5)' }}>
          <FiShield size={12} aria-hidden="true" /> All transactions are 100% secure &amp; encrypted
        </div>
      </div>
    </div>
  );
}

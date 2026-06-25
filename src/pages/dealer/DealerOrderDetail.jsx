import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import DealerLayout from '../../components/dealer/DealerLayout';
import dealerAPI from '../../services/dealerAPI';
import { addToCart } from '../../redux/slices/dealerCartSlice';

const STATUS_COLORS = {
  pending:    '#F59E0B',
  confirmed:  '#3B82F6',
  processing: '#8B5CF6',
  shipped:    '#06B6D4',
  delivered:  '#10B981',
  cancelled:  '#EF4444',
};

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function DealerOrderDetail() {
  const { id }    = useParams();
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const [order,     setOrder]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [toast,     setToast]     = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  useEffect(() => {
    dealerAPI.get(`/dealer/orders/${id}`)
      .then(r => setOrder(r.data.order))
      .catch(e => setError(e.response?.data?.message || 'Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data } = await dealerAPI.post(`/dealer/orders/${id}/cancel`, { reason: cancelReason });
      setOrder(data.order);
      setShowCancel(false);
      showToast('Order cancelled');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = async () => {
    setReordering(true);
    try {
      await Promise.all(
        order.items.map(item =>
          dispatch(addToCart({ productId: item.product?._id || item.product, quantity: item.quantity })).unwrap()
        )
      );
      showToast('Items added to cart!');
      setTimeout(() => navigate('/dealer/cart'), 1200);
    } catch {
      showToast('Some items could not be added to cart');
    } finally {
      setReordering(false);
    }
  };

  if (loading) return <DealerLayout><div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>Loading…</div></DealerLayout>;
  if (error || !order) {
    return (
      <DealerLayout>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '40px' }}>📋</div>
          <div style={{ fontSize: '16px', fontWeight: 700, margin: '12px 0 8px', color: 'var(--text,#111)' }}>{error || 'Order not found'}</div>
          <Link to="/dealer/orders" style={{ fontSize: '13px', color: 'var(--accent,#FF7A00)', fontWeight: 600, textDecoration: 'none' }}>← Back to Orders</Link>
        </div>
      </DealerLayout>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <DealerLayout>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: '#111', color: '#fff', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}

      {showCancel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card,#fff)', borderRadius: '12px', padding: '24px', maxWidth: '380px', width: '90%' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '8px' }}>Cancel Order?</div>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)…"
              rows={3}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', marginBottom: '16px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowCancel(false)} style={{ flex: 1, padding: '8px', border: '1px solid var(--border,#E5E7EB)', borderRadius: '7px', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '13px' }}>Keep Order</button>
              <button onClick={handleCancel} disabled={cancelling}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '7px', background: '#EF4444', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 700, opacity: cancelling ? 0.7 : 1 }}>
                {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <Link to="/dealer/orders" style={{ fontSize: '12px', color: 'var(--accent,#FF7A00)', textDecoration: 'none', fontWeight: 600 }}>← Back to Orders</Link>
      </div>

      {/* Header */}
      <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text,#111)', margin: '0 0 6px' }}>{order.orderNumber}</h1>
            <div style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)' }}>
              Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
            {order.requiresApproval && !order.isApproved && (
              <div style={{ marginTop: '8px', display: 'inline-block', padding: '4px 10px', background: '#FFF7ED', color: '#F59E0B', borderRadius: '100px', fontSize: '11px', fontWeight: 700 }}>
                ⏳ Awaiting Admin Approval
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ padding: '6px 14px', borderRadius: '100px', background: (STATUS_COLORS[order.status] || '#6B7280') + '1A', color: STATUS_COLORS[order.status] || '#6B7280', fontSize: '12px', fontWeight: 700, textTransform: 'capitalize' }}>
              {order.status}
            </span>
            {['pending', 'confirmed'].includes(order.status) && (
              <button onClick={() => setShowCancel(true)}
                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #EF4444', color: '#EF4444', background: 'transparent', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel Order
              </button>
            )}
            <button onClick={handleReorder} disabled={reordering}
              style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: 'var(--accent,#FF7A00)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: reordering ? 0.7 : 1 }}>
              {reordering ? 'Adding…' : 'Reorder'}
            </button>
            <button onClick={() => showToast('Invoice download coming soon!')}
              style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--text,#111)' }}>
              ⇩ Invoice
            </button>
          </div>
        </div>

        {/* Progress tracker */}
        {order.status !== 'cancelled' && (
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '0' }}>
            {STATUS_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 'none' : 1 }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i <= currentStep ? 'var(--accent,#FF7A00)' : 'var(--border,#E5E7EB)',
                    color: i <= currentStep ? '#fff' : 'var(--text-4,#9CA3AF)',
                    fontSize: '12px', fontWeight: 700, flexShrink: 0,
                  }}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: '10px', color: i <= currentStep ? 'var(--accent,#FF7A00)' : 'var(--text-4,#9CA3AF)', fontWeight: i === currentStep ? 700 : 400, marginTop: '4px', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{step}</div>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div style={{ flex: 1, height: '2px', background: i < currentStep ? 'var(--accent,#FF7A00)' : 'var(--border,#E5E7EB)', margin: '0 4px', marginBottom: '20px' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
        {/* Items */}
        <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border,#E5E7EB)', fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)' }}>Order Items</div>
          {order.items.map((item, i) => (
            <div key={item._id} style={{ display: 'flex', gap: '14px', padding: '14px 20px', alignItems: 'center', borderBottom: i < order.items.length - 1 ? '1px solid var(--border,#E5E7EB)' : 'none' }}>
              {item.image && <img src={item.image} alt={item.name} style={{ width: '52px', height: '52px', objectFit: 'contain', borderRadius: '6px', background: '#F9FAFB', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text,#111)' }}>{item.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)', marginTop: '2px' }}>SKU: {item.sku || '—'} · Qty: {item.quantity} · ₹{item.dealerPrice?.toLocaleString('en-IN')}/unit</div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)' }}>₹{item.lineTotal?.toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>

        {/* Summary + address */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '12px' }}>Payment Summary</div>
            {[['Subtotal', `₹${order.subtotal?.toLocaleString('en-IN')}`], ['Tax', `₹${order.taxAmount?.toLocaleString('en-IN')}`], ['Shipping', `₹${order.shippingCost?.toLocaleString('en-IN')}`]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-2,#374151)', marginBottom: '8px' }}>
                <span>{k}</span><span>{v}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border,#E5E7EB)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)' }}>Total</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent,#FF7A00)' }}>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '10px' }}>Delivery Address</div>
            {Object.entries(order.shippingAddress || {}).filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{ fontSize: '12px', color: 'var(--text-2,#374151)', marginBottom: '4px' }}>{v}</div>
            ))}
          </div>

          {order.trackingNumber && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E40AF', marginBottom: '8px' }}>Tracking</div>
              <div style={{ fontSize: '13px', color: '#1D4ED8' }}>{order.trackingNumber}</div>
              {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>Track Package →</a>}
            </div>
          )}

          {order.dealerNote && (
            <div style={{ background: 'var(--bg,#F9FAFB)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: 'var(--text-2,#374151)' }}>
              <strong style={{ color: 'var(--text,#111)' }}>Your Note:</strong> {order.dealerNote}
            </div>
          )}
        </div>
      </div>
    </DealerLayout>
  );
}

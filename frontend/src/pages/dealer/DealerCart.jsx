import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DealerLayout from '../../components/dealer/DealerLayout';
import {
  fetchDealerCart,
  updateCartQuantity,
  removeFromCart,
  clearDealerCart,
} from '../../redux/slices/dealerCartSlice';
import dealerAPI from '../../services/dealerAPI';

const imgUrl = (product) => product?.images?.[0]?.url || product?.images?.[0] || '/placeholder.png';

export default function DealerCart() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { cart, loading, error } = useSelector(s => s.dealerCart);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [note,         setNote]         = useState('');
  const [toast,        setToast]        = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => { dispatch(fetchDealerCart()); }, [dispatch]);

  const items    = cart?.items || [];
  const subtotal = items.reduce((s, i) => s + i.quantity * i.dealerPrice, 0);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleQtyChange = async (itemId, qty, item) => {
    if (qty < item.moq) { showToast(`Minimum order quantity is ${item.moq}`); return; }
    if (item.caseQuantity > 1 && qty % item.caseQuantity !== 0) { showToast(`Quantity must be a multiple of ${item.caseQuantity}`); return; }
    try {
      await dispatch(updateCartQuantity({ itemId, quantity: qty })).unwrap();
    } catch (err) {
      showToast(err || 'Update failed');
    }
  };

  const handleRemove = async (itemId) => {
    try { await dispatch(removeFromCart(itemId)).unwrap(); }
    catch (err) { showToast(err || 'Remove failed'); }
  };

  const handleClear = async () => {
    setConfirmClear(false);
    try { await dispatch(clearDealerCart()).unwrap(); }
    catch (err) { showToast(err || 'Clear failed'); }
  };

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      const { data } = await dealerAPI.post('/dealer/orders', { dealerNote: note });
      showToast('Order placed successfully!');
      await dispatch(fetchDealerCart());
      setTimeout(() => navigate(`/dealer/orders/${data.order._id}`), 1200);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <DealerLayout>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: '#111', color: '#fff', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}
      {confirmClear && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card,#fff)', borderRadius: '12px', padding: '24px', maxWidth: '340px', width: '90%' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '8px' }}>Clear Cart?</div>
            <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)', marginBottom: '20px' }}>This will remove all items from your cart.</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: '8px', border: '1px solid var(--border,#E5E7EB)', borderRadius: '7px', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleClear} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '7px', background: '#EF4444', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Clear Cart</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text,#111)', margin: '0 0 4px' }}>My Cart</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>{items.length} item{items.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/dealer/products" style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '12px', fontWeight: 600, color: 'var(--text,#111)', textDecoration: 'none', background: 'var(--card,#fff)' }}>Continue Shopping</Link>
          {items.length > 0 && (
            <button onClick={() => setConfirmClear(true)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #EF4444', fontSize: '12px', fontWeight: 600, color: '#EF4444', background: 'transparent', cursor: 'pointer' }}>Clear Cart</button>
          )}
        </div>
      </div>

      {loading && !items.length ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-4,#9CA3AF)' }}>Loading cart…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '8px' }}>Your cart is empty</div>
          <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)', marginBottom: '20px' }}>Browse the dealer catalog to add products</div>
          <Link to="/dealer/products" style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--accent,#FF7A00)', color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>Browse Catalog</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
          {/* Cart items */}
          <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', overflow: 'hidden' }}>
            {/* CSV import placeholder */}
            <div style={{ padding: '12px 20px', background: 'var(--bg,#F9FAFB)', borderBottom: '1px solid var(--border,#E5E7EB)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)' }}>Bulk import via CSV — <em>coming soon</em></span>
              <button disabled style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', fontSize: '11px', color: 'var(--text-4,#9CA3AF)', cursor: 'not-allowed' }}>⇡ Import CSV</button>
            </div>

            {items.map((item, idx) => (
              <div key={item._id} style={{ padding: '16px 20px', borderBottom: idx < items.length - 1 ? '1px solid var(--border,#E5E7EB)' : 'none', display: 'flex', gap: '14px', alignItems: 'center' }}>
                <img src={imgUrl(item.product)} alt={item.product?.name}
                  style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '8px', background: '#F9FAFB', flexShrink: 0 }}
                  onError={e => { e.target.src = '/placeholder.png'; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/dealer/products/${item.product?.slug}`} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text,#111)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.product?.name}
                  </Link>
                  <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)', marginTop: '2px' }}>
                    SKU: {item.product?.sku || '—'} · MOQ: {item.moq} · Case: {item.caseQuantity}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)', marginTop: '4px' }}>
                    ₹{item.dealerPrice?.toLocaleString('en-IN')} / unit
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border,#E5E7EB)', borderRadius: '7px', overflow: 'hidden' }}>
                    <button onClick={() => handleQtyChange(item._id, item.quantity - (item.caseQuantity || 1), item)}
                      style={{ width: '30px', height: '30px', border: 'none', background: 'var(--bg,#F9FAFB)', cursor: 'pointer', fontSize: '14px' }}>−</button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => handleQtyChange(item._id, Number(e.target.value), item)}
                      style={{ width: '52px', textAlign: 'center', border: 'none', fontSize: '13px', fontWeight: 600, color: 'var(--text,#111)', background: 'var(--card,#fff)', padding: '6px 0' }}
                    />
                    <button onClick={() => handleQtyChange(item._id, item.quantity + (item.caseQuantity || 1), item)}
                      style={{ width: '30px', height: '30px', border: 'none', background: 'var(--bg,#F9FAFB)', cursor: 'pointer', fontSize: '14px' }}>+</button>
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '80px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent,#FF7A00)' }}>₹{(item.quantity * item.dealerPrice).toLocaleString('en-IN')}</div>
                  <button onClick={() => handleRemove(item._id)} style={{ fontSize: '11px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px', padding: 0 }}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '20px', position: 'sticky', top: '24px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '16px' }}>Order Summary</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-2,#374151)', marginBottom: '8px' }}>
              <span>Items ({items.length})</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-2,#374151)', marginBottom: '8px' }}>
              <span>Tax</span>
              <span style={{ color: 'var(--text-4,#9CA3AF)' }}>Calculated at checkout</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border,#E5E7EB)', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)' }}>Subtotal</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent,#FF7A00)' }}>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {subtotal > 100000 && (
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '12px', color: '#92400E' }}>
                ⚠️ Orders above ₹1L require admin approval before processing.
              </div>
            )}

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note for this order (optional)…"
              rows={2}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', fontSize: '12px', color: 'var(--text,#111)', background: 'var(--bg,#F9FAFB)', resize: 'vertical', boxSizing: 'border-box', marginBottom: '12px', fontFamily: 'inherit' }}
            />

            <button onClick={handlePlaceOrder} disabled={placingOrder || items.length === 0}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--accent,#FF7A00)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: placingOrder ? 0.7 : 1 }}>
              {placingOrder ? 'Placing Order…' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </DealerLayout>
  );
}

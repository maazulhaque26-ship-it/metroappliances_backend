import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import DealerLayout from '../../components/dealer/DealerLayout';
import dealerAPI from '../../services/dealerAPI';
import { addToCart } from '../../redux/slices/dealerCartSlice';

const imgUrl = (images, idx = 0) => images?.[idx]?.url || images?.[idx] || '/placeholder.png';

export default function DealerProductDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [imgIdx,  setImgIdx]    = useState(0);
  const [qty,     setQty]       = useState(1);
  const [adding,  setAdding]    = useState(false);
  const [toast,   setToast]     = useState('');
  const [error,   setError]     = useState('');

  useEffect(() => {
    dealerAPI.get(`/dealer/products/${slug}`)
      .then(r => {
        setProduct(r.data.product);
        setQty(r.data.product.dealerPricing?.moq || 1);
      })
      .catch(e => setError(e.response?.data?.message || 'Product not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <DealerLayout><div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>Loading…</div></DealerLayout>;
  }
  if (error || !product) {
    return (
      <DealerLayout>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '40px' }}>📦</div>
          <div style={{ fontSize: '16px', fontWeight: 700, margin: '12px 0 8px', color: 'var(--text,#111)' }}>{error || 'Product not found'}</div>
          <Link to="/dealer/products" style={{ fontSize: '13px', color: 'var(--accent,#FF7A00)', fontWeight: 600, textDecoration: 'none' }}>← Back to Catalog</Link>
        </div>
      </DealerLayout>
    );
  }

  const dp = product.dealerPricing;
  const saving = dp ? Math.round(((dp.mrp - dp.dealerPrice) / dp.mrp) * 100) : 0;

  // Compute effective price based on bulk discount tiers
  const effectivePrice = (() => {
    if (!dp?.bulkDiscounts?.length) return dp?.dealerPrice;
    const sorted = [...dp.bulkDiscounts].sort((a, b) => b.minQty - a.minQty);
    const tier = sorted.find(t => qty >= t.minQty);
    return tier ? tier.discountedPrice : dp.dealerPrice;
  })();

  const adjustQty = (delta) => {
    const cq  = dp?.caseQuantity || 1;
    const moq = dp?.moq || 1;
    const newQ = Math.max(moq, qty + delta * cq);
    setQty(newQ);
  };

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await dispatch(addToCart({ productId: product._id, quantity: qty })).unwrap();
      setToast('Added to cart!');
      setTimeout(() => { setToast(''); navigate('/dealer/cart'); }, 1200);
    } catch (err) {
      setToast(err || 'Failed to add to cart');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <DealerLayout>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: '#111', color: '#fff', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <Link to="/dealer/products" style={{ fontSize: '12px', color: 'var(--accent,#FF7A00)', textDecoration: 'none', fontWeight: 600 }}>← Back to Catalog</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Left — images */}
        <div>
          <div style={{ background: '#F9FAFB', borderRadius: '12px', height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', overflow: 'hidden' }}>
            <img src={imgUrl(product.images, imgIdx)} alt={product.name}
              style={{ maxHeight: '320px', maxWidth: '100%', objectFit: 'contain' }}
              onError={e => { e.target.src = '/placeholder.png'; }}
            />
          </div>
          {product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  style={{ width: '60px', height: '60px', borderRadius: '8px', border: `2px solid ${i === imgIdx ? 'var(--accent,#FF7A00)' : 'var(--border,#E5E7EB)'}`, overflow: 'hidden', cursor: 'pointer', padding: 0, background: '#F9FAFB' }}>
                  <img src={imgUrl(product.images, i)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — details */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)', marginBottom: '6px' }}>{product.brand} · SKU: {product.sku || '—'}</div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text,#111)', margin: '0 0 16px', lineHeight: 1.3 }}>{product.name}</h1>

          {/* Dealer pricing block */}
          {dp && (
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#92400E', marginBottom: '12px' }}>Dealer Pricing</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--accent,#FF7A00)' }}>₹{effectivePrice?.toLocaleString('en-IN')}</span>
                {effectivePrice !== dp.dealerPrice && (
                  <span style={{ fontSize: '14px', color: 'var(--text-4,#9CA3AF)', textDecoration: 'line-through' }}>₹{dp.dealerPrice.toLocaleString('en-IN')}</span>
                )}
                {saving > 0 && <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 700, background: '#DCFCE7', padding: '2px 8px', borderRadius: '100px' }}>{saving}% off MRP</span>}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)' }}>MRP ₹{dp.mrp.toLocaleString('en-IN')}</div>
              {dp.distributorPrice && (
                <div style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)' }}>Distributor Price ₹{dp.distributorPrice.toLocaleString('en-IN')}</div>
              )}
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '12px' }}>
                <span><strong style={{ color: 'var(--text,#111)' }}>MOQ:</strong> <span style={{ color: 'var(--text-4,#9CA3AF)' }}>{dp.moq} units</span></span>
                <span><strong style={{ color: 'var(--text,#111)' }}>Case Qty:</strong> <span style={{ color: 'var(--text-4,#9CA3AF)' }}>{dp.caseQuantity} units</span></span>
              </div>
            </div>
          )}

          {/* Bulk discount table */}
          {dp?.bulkDiscounts?.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '8px' }}>Bulk Discounts</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg,#F9FAFB)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid var(--border,#E5E7EB)', fontWeight: 600, color: 'var(--text-4,#9CA3AF)' }}>Min Qty</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid var(--border,#E5E7EB)', fontWeight: 600, color: 'var(--text-4,#9CA3AF)' }}>Price/Unit</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid var(--border,#E5E7EB)', fontWeight: 600, color: 'var(--text-4,#9CA3AF)' }}>Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {[...dp.bulkDiscounts].sort((a, b) => a.minQty - b.minQty).map((tier, i) => (
                    <tr key={i} style={{ background: qty >= tier.minQty ? '#F0FDF4' : 'var(--card,#fff)' }}>
                      <td style={{ padding: '8px 12px', border: '1px solid var(--border,#E5E7EB)', fontWeight: qty >= tier.minQty ? 700 : 400 }}>{tier.minQty}+</td>
                      <td style={{ padding: '8px 12px', border: '1px solid var(--border,#E5E7EB)', color: '#10B981', fontWeight: 700 }}>₹{tier.discountedPrice?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px 12px', border: '1px solid var(--border,#E5E7EB)', color: '#10B981' }}>{tier.discountPercent}% off</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Quantity selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text,#111)' }}>Quantity:</div>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border,#E5E7EB)', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => adjustQty(-1)} style={{ width: '36px', height: '36px', border: 'none', background: 'var(--bg,#F9FAFB)', cursor: 'pointer', fontSize: '16px', color: 'var(--text,#111)' }}>−</button>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(Math.max(dp?.moq || 1, Number(e.target.value)))}
                style={{ width: '60px', textAlign: 'center', border: 'none', fontSize: '14px', fontWeight: 600, color: 'var(--text,#111)', background: 'var(--card,#fff)', padding: '8px 0' }}
              />
              <button onClick={() => adjustQty(1)} style={{ width: '36px', height: '36px', border: 'none', background: 'var(--bg,#F9FAFB)', cursor: 'pointer', fontSize: '16px', color: 'var(--text,#111)' }}>+</button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)' }}>
              Total: <strong style={{ color: 'var(--accent,#FF7A00)' }}>₹{(qty * (effectivePrice || 0)).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <button onClick={handleAddToCart} disabled={adding}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--accent,#FF7A00)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: adding ? 0.7 : 1 }}>
            {adding ? 'Adding…' : 'Add to Cart'}
          </button>

          {/* Notes */}
          {dp?.notes && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg,#F9FAFB)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-4,#9CA3AF)' }}>
              <strong style={{ color: 'var(--text,#111)' }}>Note:</strong> {dp.notes}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div style={{ marginTop: '32px', background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '12px' }}>Description</div>
          <div style={{ fontSize: '13px', color: 'var(--text-2,#374151)', lineHeight: 1.7 }}>{product.description}</div>
        </div>
      )}

      {/* Specs */}
      {product.specs?.length > 0 && (
        <div style={{ marginTop: '20px', background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '12px' }}>Specifications</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <tbody>
              {product.specs.map((s, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg,#F9FAFB)' : 'var(--card,#fff)' }}>
                  <td style={{ padding: '8px 12px', border: '1px solid var(--border,#E5E7EB)', fontWeight: 600, color: 'var(--text,#111)', width: '35%' }}>{s.key}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid var(--border,#E5E7EB)', color: 'var(--text-2,#374151)' }}>{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DealerLayout>
  );
}

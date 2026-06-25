import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../services/api';

export default function AdminDealerPricing() {
  const [tab,       setTab]       = useState('priced');
  const [items,     setItems]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [modal,     setModal]     = useState(null); // { mode: 'edit'|'add', pricing, productId, productName }
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState('');
  const [form,      setForm]      = useState({});

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab, page, limit: 20 });
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/dealer-pricing?${params}`);
      if (tab === 'priced') {
        setItems(data.pricings || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      } else {
        setItems(data.products || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [tab, page, search]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (pricing) => {
    setForm({
      productId:        pricing.product?._id || '',
      mrp:              pricing.mrp || '',
      dealerPrice:      pricing.dealerPrice || '',
      distributorPrice: pricing.distributorPrice || '',
      moq:              pricing.moq || 1,
      caseQuantity:     pricing.caseQuantity || 1,
      dealerVisible:    pricing.dealerVisible !== false,
      isActive:         pricing.isActive !== false,
      notes:            pricing.notes || '',
      bulkDiscounts:    pricing.bulkDiscounts || [],
    });
    setModal({ mode: 'edit', id: pricing._id, productName: pricing.product?.name });
  };

  const openAdd = (product) => {
    setForm({
      productId:        product._id,
      mrp:              product.price || '',
      dealerPrice:      '',
      distributorPrice: '',
      moq:              1,
      caseQuantity:     1,
      dealerVisible:    true,
      isActive:         true,
      notes:            '',
      bulkDiscounts:    [],
    });
    setModal({ mode: 'add', productName: product.name });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/admin/dealer-pricing', form);
      showToast('Pricing saved!');
      setModal(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this pricing record?')) return;
    try {
      await api.delete(`/admin/dealer-pricing/${id}`);
      showToast('Deleted');
      load();
    } catch {
      showToast('Delete failed');
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      const { data } = await api.patch(`/admin/dealer-pricing/${id}/visibility`);
      showToast(data.dealerVisible ? 'Now visible to dealers' : 'Hidden from dealers');
      load();
    } catch {
      showToast('Failed to toggle visibility');
    }
  };

  const addBulkTier = () => {
    setForm(f => ({ ...f, bulkDiscounts: [...(f.bulkDiscounts || []), { minQty: '', discountPercent: 0, discountedPrice: '' }] }));
  };
  const removeBulkTier = (i) => {
    setForm(f => ({ ...f, bulkDiscounts: f.bulkDiscounts.filter((_, idx) => idx !== i) }));
  };
  const updateBulkTier = (i, key, val) => {
    setForm(f => {
      const tiers = [...f.bulkDiscounts];
      tiers[i] = { ...tiers[i], [key]: val };
      return { ...f, bulkDiscounts: tiers };
    });
  };

  return (
    <AdminLayout>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: '#111', color: '#fff', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>{toast}</div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}>
          <div style={{ background: 'var(--card,#fff)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text,#111)' }}>
                {modal.mode === 'edit' ? 'Edit Pricing' : 'Set Pricing'} — {modal.productName}
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-4,#9CA3AF)' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              {[['mrp', 'MRP (₹) *'], ['dealerPrice', 'Dealer Price (₹) *'], ['distributorPrice', 'Distributor Price (₹)'], ['moq', 'MOQ (min qty)'], ['caseQuantity', 'Case Quantity']].map(([k, label]) => (
                <div key={k}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-4,#9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>{label}</label>
                  <input type="number" value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
              {[['dealerVisible', 'Visible to Dealers'], ['isActive', 'Active']].map(([k, label]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text,#111)', fontWeight: 500 }}>
                  <input type="checkbox" checked={!!form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.checked }))} />
                  {label}
                </label>
              ))}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-4,#9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Notes</label>
              <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            {/* Bulk discount tiers */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text,#111)' }}>Bulk Discount Tiers</span>
                <button onClick={addBulkTier} style={{ fontSize: '11px', color: 'var(--accent,#FF7A00)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>+ Add Tier</button>
              </div>
              {(form.bulkDiscounts || []).map((tier, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input type="number" placeholder="Min Qty" value={tier.minQty} onChange={e => updateBulkTier(i, 'minQty', e.target.value)}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border,#E5E7EB)', fontSize: '12px' }} />
                  <input type="number" placeholder="Price ₹" value={tier.discountedPrice} onChange={e => updateBulkTier(i, 'discountedPrice', e.target.value)}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border,#E5E7EB)', fontSize: '12px' }} />
                  <input type="number" placeholder="% off" value={tier.discountPercent} onChange={e => updateBulkTier(i, 'discountPercent', e.target.value)}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border,#E5E7EB)', fontSize: '12px' }} />
                  <button onClick={() => removeBulkTier(i)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border,#E5E7EB)', borderRadius: '8px', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '8px', background: 'var(--accent,#FF7A00)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save Pricing'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text,#111)', margin: '0 0 4px' }}>Dealer Pricing</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>Manage dealer prices, MOQ, and bulk discount tiers</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border,#E5E7EB)', marginBottom: '20px' }}>
        {[['priced', 'Priced Products'], ['unpriced', 'Unpriced Products']].map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: tab === t ? 'var(--accent,#FF7A00)' : 'var(--text-4,#9CA3AF)', borderBottom: `2px solid ${tab === t ? 'var(--accent,#FF7A00)' : 'transparent'}`, marginBottom: '-1px' }}>
            {label}
          </button>
        ))}
      </div>

      <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search by name, SKU, brand…"
        style={{ width: '100%', maxWidth: '380px', padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', marginBottom: '16px', background: 'var(--card,#fff)', color: 'var(--text,#111)' }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-4,#9CA3AF)' }}>Loading…</div>
      ) : (
        <>
          <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg,#F9FAFB)' }}>
                  {tab === 'priced'
                    ? ['Product', 'MRP', 'Dealer Price', 'MOQ', 'Case Qty', 'Visible', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-4,#9CA3AF)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border,#E5E7EB)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))
                    : ['Product', 'SKU', 'Brand', 'MRP', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-4,#9CA3AF)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border,#E5E7EB)' }}>{h}</th>
                      ))
                  }
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>No items found</td></tr>
                ) : tab === 'priced' ? (
                  items.map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid var(--border,#E5E7EB)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text,#111)' }}>
                        <div>{p.product?.name || '—'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)' }}>{p.product?.sku}</div>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-2,#374151)' }}>₹{p.mrp?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent,#FF7A00)' }}>₹{p.dealerPrice?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-2,#374151)' }}>{p.moq}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-2,#374151)' }}>{p.caseQuantity}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <button onClick={() => handleToggleVisibility(p._id)}
                          style={{ padding: '3px 10px', borderRadius: '100px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, background: p.dealerVisible ? '#DCFCE7' : '#F3F4F6', color: p.dealerVisible ? '#16A34A' : '#6B7280' }}>
                          {p.dealerVisible ? 'Visible' : 'Hidden'}
                        </button>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => openEdit(p)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--text,#111)' }}>Edit</button>
                          <button onClick={() => handleDelete(p._id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#EF4444' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  items.map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid var(--border,#E5E7EB)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text,#111)' }}>{p.name}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-4,#9CA3AF)', fontSize: '12px' }}>{p.sku || '—'}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-2,#374151)' }}>{p.brand || '—'}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-2,#374151)' }}>₹{p.price?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <button onClick={() => openAdd(p)} style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', background: 'var(--accent,#FF7A00)', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>Set Pricing</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ padding: '7px 16px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '13px', opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>Page {page} of {pagination.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                style={{ padding: '7px 16px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '13px', opacity: page >= pagination.totalPages ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}

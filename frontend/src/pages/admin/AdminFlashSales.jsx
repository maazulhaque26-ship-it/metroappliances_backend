import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiToggleLeft, FiToggleRight, FiSearch } from 'react-icons/fi';

function fmtDt(iso) { return iso ? iso.slice(0, 16) : ''; }

function ProductRow({ entry, onUpdate, onRemove }) {
  return (
    <div className="grid grid-cols-4 gap-2 items-center py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--text)] truncate col-span-1">{entry.name}</span>
      <input
        type="number" placeholder="Sale Price ₹" value={entry.salePrice}
        onChange={e => onUpdate({ ...entry, salePrice: e.target.value })}
        className="bg-[var(--bg)] border border-[var(--border)] px-2 py-1.5 text-sm outline-none"
      />
      <input
        type="number" placeholder="Original ₹" value={entry.originalPrice}
        onChange={e => onUpdate({ ...entry, originalPrice: e.target.value })}
        className="bg-[var(--bg)] border border-[var(--border)] px-2 py-1.5 text-sm outline-none"
      />
      <button onClick={onRemove} className="text-red-400 hover:text-red-600 justify-self-end"><FiTrash2 size={14} /></button>
    </div>
  );
}

function FlashSaleForm({ existing, onClose, onSaved }) {
  const [form, setForm] = useState(
    existing ? { name: existing.name, startDate: fmtDt(existing.startDate), endDate: fmtDt(existing.endDate), isActive: existing.isActive }
    : { name: '', startDate: '', endDate: '', isActive: true }
  );
  const [productRows, setProductRows] = useState(
    existing?.products?.map(p => ({
      productId: p.product?._id || p.product,
      name: p.product?.name || 'Product',
      salePrice: p.salePrice || '',
      originalPrice: p.originalPrice || '',
      stockLimit: p.stockLimit || '',
    })) || []
  );
  const [allProducts, setAllProducts] = useState([]);
  const [prodSearch, setProdSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  useEffect(() => {
    API.get('/admin/products?limit=200').then(({ data }) => setAllProducts(data.products || [])).catch(() => {});
  }, []);

  const filteredProds = allProducts.filter(p =>
    !productRows.find(r => r.productId === p._id) &&
    p.name.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const addProduct = (p) => {
    setProductRows(prev => [...prev, { productId: p._id, name: p.name, salePrice: '', originalPrice: p.price || '', stockLimit: '' }]);
    setProdSearch('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name required');
    if (!form.startDate || !form.endDate) return toast.error('Start and end dates required');
    if (productRows.some(r => !r.salePrice)) return toast.error('Set a sale price for every product');
    try {
      setSaving(true);
      const payload = {
        ...form,
        products: productRows.map(r => ({ product: r.productId, salePrice: Number(r.salePrice), originalPrice: Number(r.originalPrice), stockLimit: Number(r.stockLimit) || 0 })),
      };
      let res;
      if (existing?._id) {
        res = await API.put(`/admin/flash-sales/${existing._id}`, payload);
      } else {
        res = await API.post('/admin/flash-sales', payload);
      }
      toast.success(existing ? 'Updated' : 'Created');
      onSaved(res.data.flashSale);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto" style={{ borderRadius: 'var(--radius-md)' }}>
        <button onClick={onClose} className="absolute top-5 right-5 text-[var(--text-3)] hover:text-[var(--text)]"><FiX size={20} /></button>
        <h2 className="text-2xl font-extrabold text-[var(--text)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>{existing ? 'Edit Flash Sale' : 'New Flash Sale'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Sale Name *</label>
            <input value={form.name} onChange={set('name')} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" placeholder="e.g. Weekend Mega Sale" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Start Date *</label>
              <input type="datetime-local" value={form.startDate} onChange={set('startDate')} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">End Date *</label>
              <input type="datetime-local" value={form.endDate} onChange={set('endDate')} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="w-4 h-4 accent-[var(--accent)]" />
            <span className="text-sm font-medium text-[var(--text)]">Active</span>
          </label>

          {/* Product picker */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Products</label>
            <div className="relative mb-3">
              <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
              <input value={prodSearch} onChange={e => setProdSearch(e.target.value)} placeholder="Search to add product…" className="w-full bg-[var(--bg)] border border-[var(--border)] pl-9 pr-4 py-2.5 text-sm outline-none" />
            </div>
            {prodSearch && filteredProds.length > 0 && (
              <div className="border border-[var(--border)] max-h-40 overflow-y-auto mb-3" style={{ borderRadius: 'var(--radius-sm)' }}>
                {filteredProds.slice(0, 8).map(p => (
                  <button key={p._id} type="button" onClick={() => addProduct(p)} className="w-full text-left px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--bg)] transition-colors border-b border-[var(--border)] last:border-0">
                    {p.name} — ₹{p.price}
                  </button>
                ))}
              </div>
            )}
            {productRows.length > 0 && (
              <div className="border border-[var(--border)] p-3" style={{ borderRadius: 'var(--radius-sm)' }}>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['Product', 'Sale Price ₹', 'Original ₹', ''].map(h => (
                    <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-4)]">{h}</span>
                  ))}
                </div>
                {productRows.map((row, i) => (
                  <ProductRow key={row.productId} entry={row}
                    onUpdate={updated => setProductRows(prev => prev.map((r, j) => j === i ? updated : r))}
                    onRemove={() => setProductRows(prev => prev.filter((_, j) => j !== i))}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest" style={{ opacity: saving ? 0.65 : 1 }}>
              {saving ? 'Saving…' : (existing ? 'Update' : 'Create')}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-bold uppercase tracking-widest border border-[var(--border)] text-[var(--text)]">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminFlashSales() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/flash-sales');
      setItems(data.flashSales || []);
    } catch { toast.error('Failed to load flash sales'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (saved) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i._id === saved._id);
      return idx >= 0 ? prev.map(i => i._id === saved._id ? saved : i) : [saved, ...prev];
    });
    setModal(false);
  };

  const handleToggle = async (item) => {
    try {
      const { data } = await API.put(`/admin/flash-sales/${item._id}/toggle`);
      setItems(prev => prev.map(i => i._id === item._id ? data.flashSale : i));
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await API.delete(`/admin/flash-sales/${item._id}`);
      setItems(prev => prev.filter(i => i._id !== item._id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Flash Sales</h1>
            <p className="text-[var(--text-3)] text-sm mt-1">{items.length} sale{items.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => { setEditing(null); setModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
            <FiPlus size={16} /> New Flash Sale
          </button>
        </div>

        <div className="border border-[var(--border)] overflow-hidden" style={{ borderRadius: 'var(--radius-md)', background: 'var(--card)' }}>
          {loading ? (
            <div className="p-12 text-center text-[var(--text-4)] text-sm">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-4)] text-sm">No flash sales yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                  {['Name', 'Schedule', 'Products', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item._id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="px-5 py-4 font-semibold text-[var(--text)]">{item.name}</td>
                    <td className="px-5 py-4 text-xs text-[var(--text-3)]">
                      {new Date(item.startDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}<br/>
                      → {new Date(item.endDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--text-3)]">{item.products?.length || 0} products</td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleToggle(item)} style={{ color: item.isActive ? '#22c55e' : 'var(--text-4)' }}>
                        {item.isActive ? <FiToggleRight size={22} /> : <FiToggleLeft size={22} />}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditing(item); setModal(true); }} className="p-2 text-[var(--text-3)] hover:text-[var(--text)]"><FiEdit2 size={15} /></button>
                        <button onClick={() => handleDelete(item)} className="p-2 text-[var(--text-3)] hover:text-red-500"><FiTrash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {modal && <FlashSaleForm existing={editing} onClose={() => setModal(false)} onSaved={handleSaved} />}
    </AdminLayout>
  );
}

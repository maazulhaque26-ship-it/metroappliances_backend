import React, { useEffect, useState, useCallback } from 'react';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiX, FiCopy, FiSearch } from 'react-icons/fi';

const BLANK = { code: '', type: 'percentage', value: '', minOrderAmount: '', maxDiscount: '', expiryDate: '', startDate: '', perUserLimit: '', description: '', isActive: true };
const PAGE_SIZE = 10;

export default function AdminCoupons() {
  const [coupons,  setCoupons]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(BLANK);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);

  // Backend GET /admin/coupons has no search/pagination params (confirmed by
  // reading the controller) — filtering client-side here keeps the backend untouched.
  const filtered = coupons.filter(c => c.code.toLowerCase().includes(search.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/coupons');
      setCoupons(data.coupons || []);
    } catch { toast.error('Failed to load coupons'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const openCreate = () => { setForm(BLANK); setEditing(null); setModal(true); };
  const openEdit   = (c) => {
    setForm({
      code: c.code, type: c.type || 'percentage', value: c.value || '',
      minOrderAmount: c.minOrderAmount || '', maxDiscount: c.maxDiscount || '',
      expiryDate: c.expiryDate ? c.expiryDate.split('T')[0] : '',
      startDate: c.startDate ? c.startDate.split('T')[0] : '',
      perUserLimit: c.perUserLimit || '', description: c.description || '',
      isActive: c.isActive,
    });
    setEditing(c._id);
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) {
        const { data } = await API.put(`/admin/coupons/${editing}`, form);
        setCoupons(prev => prev.map(c => c._id === editing ? data.coupon : c));
        toast.success('Coupon updated!');
      } else {
        const { data } = await API.post('/admin/coupons', form);
        setCoupons(prev => [data.coupon, ...prev]);
        toast.success('Coupon created!');
      }
      setModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      setDeleting(id);
      await API.delete(`/admin/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c._id !== id));
      toast.success('Coupon deleted');
    } catch { toast.error('Failed'); }
    finally { setDeleting(null); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Coupons</h1>
            <p className="text-[var(--text-3)] text-sm font-medium mt-1">{coupons.length} active coupons</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">
            <FiPlus size={16} /> Create Coupon
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <FiSearch size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by coupon code…"
            className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] outline-none focus:border-[#111111] text-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-[var(--border)]">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={6} cols={5} /></div>
          ) : filtered.length > 0 ? (
            <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[var(--bg)]">
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Code</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Discount</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Min Order</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Expires</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Status</th>
                    <th className="p-4 border-b border-[var(--border)]"></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(c => {
                    const expired = c.expiryDate && new Date(c.expiryDate) < new Date();
                    return (
                      <tr key={c._id} className="border-b border-[var(--border)] hover:bg-[var(--bg)] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-[var(--text)] text-sm uppercase">{c.code}</span>
                            <button onClick={() => copyCode(c.code)} className="p-2 text-[var(--text-3)] hover:text-[var(--text)] bg-white border border-[var(--border)] hover:border-[#111111] transition-colors">
                              <FiCopy size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-3 py-1 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold uppercase tracking-widest">
                            {c.type === 'free_shipping' ? 'FREE SHIPPING'
                              : c.type === 'first_order' ? `${c.value}% (1st order)`
                              : c.type === 'percentage' ? `${c.value}% OFF`
                              : `₹${c.value} OFF`}
                          </span>
                          {c.maxDiscount > 0 && <p className="text-[var(--text-3)] text-xs font-medium mt-2">Max ₹{c.maxDiscount}</p>}
                        </td>
                        <td className="p-4 text-[var(--text)] text-sm font-bold">
                          {c.minOrderAmount ? `₹${c.minOrderAmount.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className={`p-4 text-sm font-medium ${expired ? 'text-red-600' : 'text-[var(--text-3)]'}`}>
                          {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN') : 'No expiry'}
                          {expired && <span className="inline-block ml-2 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-widest">Expired</span>}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${c.isActive && !expired ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                            {c.isActive && !expired ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(c)} className="p-2 text-[var(--text-3)] hover:text-[var(--text)] hover:bg-white border border-transparent hover:border-[var(--border)] transition-colors">
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(c._id, c.code)}
                              disabled={deleting === c._id}
                              className="p-2 text-[var(--text-3)] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors disabled:opacity-50"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block lg:hidden divide-y divide-[#E5E5E5]">
              {paged.map(c => {
                const expired = c.expiryDate && new Date(c.expiryDate) < new Date();
                return (
                  <div key={c._id} className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[var(--text)] text-sm uppercase">{c.code}</span>
                        <button onClick={() => copyCode(c.code)} className="p-2 text-[var(--text-3)] hover:text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] transition-colors">
                          <FiCopy size={12} />
                        </button>
                      </div>
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${c.isActive && !expired ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {c.isActive && !expired ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="bg-[var(--bg)] border border-[var(--border)] p-3 text-sm grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[var(--text-3)] text-[10px] font-bold uppercase tracking-widest">Discount</p>
                        <p className="font-bold text-[var(--text)]">{c.type === 'free_shipping' ? 'FREE SHIPPING' : c.type === 'first_order' ? `${c.value}% (1st order)` : c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} OFF`}</p>
                        {c.maxDiscount > 0 && <p className="text-[var(--text-3)] text-[10px] mt-0.5">Max ₹{c.maxDiscount}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--text-3)] text-[10px] font-bold uppercase tracking-widest">Min Order</p>
                        <p className="font-bold text-[var(--text)]">{c.minOrderAmount ? `₹${c.minOrderAmount.toLocaleString('en-IN')}` : '—'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[var(--text-3)] text-[10px] font-bold uppercase tracking-widest">Expires</p>
                        <p className={`text-xs font-bold mt-0.5 ${expired ? 'text-red-600' : 'text-[var(--text)]'}`}>
                          {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN') : 'No expiry'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(c)} className="p-2.5 border border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id, c.code)}
                          disabled={deleting === c._id}
                          className="p-2.5 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-[var(--border)] bg-[var(--bg)]">
                <p className="text-[var(--text-3)] text-xs font-bold uppercase tracking-widest">Page {page} of {pages}</p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-white border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase disabled:opacity-50 hover:border-[#111111] transition-colors">Prev</button>
                  <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-white border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase disabled:opacity-50 hover:border-[#111111] transition-colors">Next</button>
                </div>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-24 bg-[var(--bg)]">
              <FiTag size={48} className="mx-auto mb-6 text-[#CCCCCC]" />
              <p className="text-[var(--text-3)] text-sm font-medium">{coupons.length === 0 ? 'No coupons created yet.' : 'No coupons match your search.'}</p>
              {coupons.length === 0 && (
                <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors mt-6 mx-auto">
                  <FiPlus size={14} /> Create First Coupon
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-[var(--text)]/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-[var(--border)] shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <h2 className="text-xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>{editing ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button onClick={() => setModal(false)} className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors"><FiX size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Coupon Code *</label>
                <input value={form.code} onChange={set('code')} placeholder="e.g. METRO1000" className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm font-mono font-bold uppercase outline-none focus:border-[#111111]" required />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Discount Type *</label>
                  <select value={form.type} onChange={set('type')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm font-bold outline-none focus:border-[#111111]" required>
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                    <option value="free_shipping">Free Shipping</option>
                    <option value="first_order">First Order (%)</option>
                  </select>
                </div>
                {!['free_shipping'].includes(form.type) && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">
                    {['percentage','first_order'].includes(form.type) ? 'Discount % *' : 'Discount Amount (₹) *'}
                  </label>
                  <input type="number" value={form.value} onChange={set('value')} min="1" max={['percentage','first_order'].includes(form.type) ? 90 : undefined} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm font-bold outline-none focus:border-[#111111]" required />
                </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Max Discount (₹)</label>
                  <input type="number" value={form.maxDiscount} onChange={set('maxDiscount')} placeholder="Optional" className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm font-bold outline-none focus:border-[#111111]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Min Order (₹)</label>
                  <input type="number" value={form.minOrderAmount} onChange={set('minOrderAmount')} placeholder="0" className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm font-bold outline-none focus:border-[#111111]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Start Date</label>
                  <input type="date" value={form.startDate} onChange={set('startDate')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm font-bold outline-none focus:border-[#111111]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Expires On</label>
                  <input type="date" value={form.expiryDate} onChange={set('expiryDate')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm font-bold outline-none focus:border-[#111111]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Per-User Limit</label>
                  <input type="number" value={form.perUserLimit} onChange={set('perUserLimit')} placeholder="0 = unlimited" min="0" className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm font-bold outline-none focus:border-[#111111]" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Description (shown to customer)</label>
                <input value={form.description} onChange={set('description')} placeholder="e.g. Get 20% off on your first order" className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer py-2">
                <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="w-4 h-4 text-[var(--text)] bg-white border-[var(--border)] rounded focus:ring-[#111111]" />
                <span className="text-sm font-bold text-[var(--text)] uppercase tracking-widest">Active Status</span>
              </label>
              <div className="flex gap-4 pt-4 border-t border-[var(--border)]">
                <button type="button" onClick={() => setModal(false)} className="w-1/3 py-4 border border-[#111111] text-[var(--text)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--bg)] transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="w-2/3 py-4 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50 flex items-center justify-center">
                  {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Saving…</> : editing ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

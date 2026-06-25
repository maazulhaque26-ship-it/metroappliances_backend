import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import ImageUploader from '../../components/ui/ImageUploader';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiToggleLeft, FiToggleRight, FiSearch } from 'react-icons/fi';
import { imgSrc } from '../../utils/imageHelper';

function fmtDt(iso) { return iso ? iso.slice(0, 16) : ''; }

const PAGE_OPTIONS = ['home', 'shop', 'deals', 'about', 'contact'];

const BLANK = {
  title: '', subtitle: '', targetPages: ['home'], showOn: 'all',
  animation: 'none', isActive: true, startDate: '', endDate: '', priority: 0,
};

function CampaignForm({ existing, onClose, onSaved }) {
  const [form, setForm] = useState(
    existing ? { ...existing, startDate: fmtDt(existing.startDate), endDate: fmtDt(existing.endDate) } : { ...BLANK }
  );
  const [bannerData, setBannerData] = useState(existing?.banner ? [existing.banner] : []);
  const [selectedProducts, setSelectedProducts] = useState(
    existing?.products?.map(p => ({ _id: p._id || p, name: p.name || '' })) || []
  );
  const [allProducts, setAllProducts] = useState([]);
  const [prodSearch, setProdSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const togglePage = (page) => {
    setForm(p => ({
      ...p,
      targetPages: p.targetPages.includes(page)
        ? p.targetPages.filter(pg => pg !== page)
        : [...p.targetPages, page],
    }));
  };

  useEffect(() => {
    API.get('/admin/products?limit=200').then(({ data }) => setAllProducts(data.products || [])).catch(() => {});
  }, []);

  const filteredProds = allProducts.filter(p =>
    !selectedProducts.find(s => s._id === p._id) &&
    p.name.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const addProduct = (p) => { setSelectedProducts(prev => [...prev, { _id: p._id, name: p.name }]); setProdSearch(''); };
  const removeProduct = (id) => setSelectedProducts(prev => prev.filter(p => p._id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title required');
    if (form.targetPages.length === 0) return toast.error('Select at least one target page');
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('subtitle', form.subtitle || '');
      fd.append('showOn', form.showOn);
      fd.append('animation', form.animation);
      fd.append('isActive', form.isActive);
      fd.append('priority', form.priority);
      if (form.startDate) fd.append('startDate', form.startDate);
      if (form.endDate) fd.append('endDate', form.endDate);
      fd.append('targetPages', JSON.stringify(form.targetPages));
      fd.append('products', JSON.stringify(selectedProducts.map(p => p._id)));
      const banner = bannerData[0];
      if (banner && typeof banner === 'object' && banner.file) fd.append('banner', banner.file);

      let res;
      if (existing?._id) {
        res = await API.put(`/admin/campaigns/${existing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await API.post('/admin/campaigns', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      toast.success(existing ? 'Updated' : 'Created');
      onSaved(res.data.campaign);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-xl p-6 relative max-h-[90vh] overflow-y-auto" style={{ borderRadius: 'var(--radius-md)' }}>
        <button onClick={onClose} className="absolute top-5 right-5 text-[var(--text-3)] hover:text-[var(--text)]"><FiX size={20} /></button>
        <h2 className="text-2xl font-extrabold text-[var(--text)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>{existing ? 'Edit Campaign' : 'New Campaign'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Banner Image</label>
            <ImageUploader value={bannerData} onChange={setBannerData} maxCount={1} label="Upload Banner" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Title *</label>
              <input value={form.title} onChange={set('title')} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" placeholder="e.g. Summer Appliance Festival" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Subtitle</label>
              <input value={form.subtitle} onChange={set('subtitle')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" placeholder="Optional subtitle" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Start Date</label>
              <input type="datetime-local" value={form.startDate} onChange={set('startDate')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">End Date</label>
              <input type="datetime-local" value={form.endDate} onChange={set('endDate')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Show On</label>
              <select value={form.showOn} onChange={set('showOn')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none">
                <option value="all">All Devices</option>
                <option value="desktop">Desktop Only</option>
                <option value="mobile">Mobile Only</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Animation</label>
              <select value={form.animation} onChange={set('animation')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none">
                <option value="none">None</option>
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Priority</label>
              <input type="number" value={form.priority} onChange={set('priority')} min={0} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Target Pages</label>
            <div className="flex flex-wrap gap-2">
              {PAGE_OPTIONS.map(pg => (
                <button key={pg} type="button" onClick={() => togglePage(pg)}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest border transition-all capitalize"
                  style={{
                    borderColor: form.targetPages.includes(pg) ? 'var(--accent)' : 'var(--border)',
                    color: form.targetPages.includes(pg) ? 'var(--accent)' : 'var(--text-3)',
                    background: form.targetPages.includes(pg) ? 'rgba(255,138,0,0.08)' : 'transparent',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >{pg}</button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="w-4 h-4 accent-[var(--accent)]" />
            <span className="text-sm font-medium text-[var(--text)]">Active</span>
          </label>

          {/* Optional product picker */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Featured Products (optional)</label>
            <div className="relative mb-2">
              <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
              <input value={prodSearch} onChange={e => setProdSearch(e.target.value)} placeholder="Search to add product…" className="w-full bg-[var(--bg)] border border-[var(--border)] pl-9 pr-4 py-2.5 text-sm outline-none" />
            </div>
            {prodSearch && filteredProds.length > 0 && (
              <div className="border border-[var(--border)] max-h-36 overflow-y-auto mb-2" style={{ borderRadius: 'var(--radius-sm)' }}>
                {filteredProds.slice(0, 8).map(p => (
                  <button key={p._id} type="button" onClick={() => addProduct(p)} className="w-full text-left px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--bg)] border-b border-[var(--border)] last:border-0">
                    {p.name} — ₹{p.price}
                  </button>
                ))}
              </div>
            )}
            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map(p => (
                  <span key={p._id} className="flex items-center gap-1 px-3 py-1 text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    {p.name}
                    <button type="button" onClick={() => removeProduct(p._id)} className="ml-1 text-[var(--text-4)] hover:text-red-500"><FiX size={11} /></button>
                  </span>
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

export default function AdminCampaigns() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/campaigns');
      setItems(data.campaigns || []);
    } catch { toast.error('Failed to load campaigns'); }
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
      const { data } = await API.put(`/admin/campaigns/${item._id}/toggle`);
      setItems(prev => prev.map(i => i._id === item._id ? data.campaign : i));
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete campaign "${item.title}"?`)) return;
    try {
      await API.delete(`/admin/campaigns/${item._id}`);
      setItems(prev => prev.filter(i => i._id !== item._id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Homepage Campaigns</h1>
            <p className="text-[var(--text-3)] text-sm mt-1">{items.length} campaign{items.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => { setEditing(null); setModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
            <FiPlus size={16} /> New Campaign
          </button>
        </div>

        <div className="border border-[var(--border)] overflow-hidden" style={{ borderRadius: 'var(--radius-md)', background: 'var(--card)' }}>
          {loading ? (
            <div className="p-12 text-center text-[var(--text-4)] text-sm">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-4)] text-sm">No campaigns yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                  {['Campaign', 'Pages', 'Schedule', 'Priority', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item._id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {item.banner && <img src={imgSrc(item.banner)} alt="" className="w-12 h-8 object-cover rounded" />}
                        <div>
                          <p className="font-semibold text-[var(--text)]">{item.title}</p>
                          {item.subtitle && <p className="text-xs text-[var(--text-4)] truncate max-w-[180px]">{item.subtitle}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--text-3)]">{item.targetPages?.join(', ')}</td>
                    <td className="px-5 py-4 text-xs text-[var(--text-3)]">
                      {item.startDate ? new Date(item.startDate).toLocaleDateString('en-IN') : 'Always'}<br/>
                      {item.endDate ? `→ ${new Date(item.endDate).toLocaleDateString('en-IN')}` : ''}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-[var(--text-3)]">{item.priority}</td>
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
      {modal && <CampaignForm existing={editing} onClose={() => setModal(false)} onSaved={handleSaved} />}
    </AdminLayout>
  );
}

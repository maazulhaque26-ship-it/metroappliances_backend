import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import ImageUploader from '../../components/ui/ImageUploader';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { imgSrc } from '../../utils/imageHelper';

const BLANK = {
  title: '', subtitle: '', type: 'welcome', ctaText: '', ctaLink: '',
  frequency: 'once', showOn: 'all', animation: 'fade',
  delaySeconds: 3, showNewsletter: false, isActive: true,
};

function PopupForm({ existing, onClose, onSaved }) {
  const [form, setForm] = useState(existing ? { ...existing } : { ...BLANK });
  const [imageData, setImageData] = useState(existing?.image ? [existing.image] : []);
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, typeof v === 'boolean' ? String(v) : v));
      const img = imageData[0];
      if (img && typeof img === 'object' && img.file) fd.append('image', img.file);

      let res;
      if (existing?._id) {
        res = await API.put(`/admin/popups/${existing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await API.post('/admin/popups', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      toast.success(existing ? 'Updated' : 'Created');
      onSaved(res.data.popup);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-xl p-6 relative max-h-[90vh] overflow-y-auto" style={{ borderRadius: 'var(--radius-md)' }}>
        <button onClick={onClose} className="absolute top-5 right-5 text-[var(--text-3)] hover:text-[var(--text)]"><FiX size={20} /></button>
        <h2 className="text-2xl font-extrabold text-[var(--text)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
          {existing ? 'Edit Popup' : 'New Popup'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Popup Image (optional)</label>
            <ImageUploader value={imageData} onChange={setImageData} maxCount={1} label="Upload Popup Image" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Title *</label>
              <input value={form.title} onChange={set('title')} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[var(--text)]" placeholder="e.g. Welcome to Metro!" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Subtitle</label>
              <textarea value={form.subtitle} onChange={set('subtitle')} rows={2} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none resize-none" placeholder="Optional supporting text" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Type</label>
              <select value={form.type} onChange={set('type')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none">
                <option value="welcome">Welcome</option>
                <option value="offer">Offer / Promo</option>
                <option value="newsletter">Newsletter</option>
                <option value="festival">Festival</option>
                <option value="exit_intent">Exit Intent</option>
                <option value="delay">Delay / Timed</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Frequency</label>
              <select value={form.frequency} onChange={set('frequency')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none">
                <option value="once">Show Once</option>
                <option value="every_visit">Every Visit</option>
                <option value="once_per_day">Once Per Day</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">CTA Text</label>
              <input value={form.ctaText} onChange={set('ctaText')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" placeholder="e.g. Claim Offer" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">CTA Link</label>
              <input value={form.ctaLink} onChange={set('ctaLink')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" placeholder="/deals" />
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
                <option value="fade">Fade</option>
                <option value="slide_up">Slide Up</option>
                <option value="zoom">Zoom</option>
                <option value="flip">Flip</option>
              </select>
            </div>
            {form.type === 'delay' && (
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Delay (seconds)</label>
                <input type="number" value={form.delaySeconds} onChange={set('delaySeconds')} min={1} max={120} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" />
              </div>
            )}
          </div>
          <div className="flex gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.showNewsletter} onChange={set('showNewsletter')} className="w-4 h-4 accent-[var(--accent)]" />
              <span className="text-sm font-medium text-[var(--text)]">Show newsletter form</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="w-4 h-4 accent-[var(--accent)]" />
              <span className="text-sm font-medium text-[var(--text)]">Active</span>
            </label>
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

export default function AdminPopups() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/popups');
      setItems(data.popups || []);
    } catch { toast.error('Failed to load popups'); }
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
      const { data } = await API.put(`/admin/popups/${item._id}/toggle`);
      setItems(prev => prev.map(i => i._id === item._id ? data.popup : i));
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete popup "${item.title}"?`)) return;
    try {
      await API.delete(`/admin/popups/${item._id}`);
      setItems(prev => prev.filter(i => i._id !== item._id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const TYPE_LABEL = { welcome: 'Welcome', offer: 'Offer', newsletter: 'Newsletter', festival: 'Festival', exit_intent: 'Exit Intent', delay: 'Delay' };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Marketing Popups</h1>
            <p className="text-[var(--text-3)] text-sm mt-1">{items.length} popup{items.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => { setEditing(null); setModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
            <FiPlus size={16} /> New Popup
          </button>
        </div>

        <div className="border border-[var(--border)] overflow-hidden" style={{ borderRadius: 'var(--radius-md)', background: 'var(--card)' }}>
          {loading ? (
            <div className="p-12 text-center text-[var(--text-4)] text-sm">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-4)] text-sm">No popups yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                  {['Popup', 'Type', 'Frequency', 'CTA', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item._id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {item.image && <img src={imgSrc(item.image)} alt="" className="w-10 h-10 object-cover rounded" />}
                        <div>
                          <p className="font-semibold text-[var(--text)]">{item.title}</p>
                          {item.subtitle && <p className="text-xs text-[var(--text-4)] truncate max-w-[200px]">{item.subtitle}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className="text-xs font-medium text-[var(--text-3)]">{TYPE_LABEL[item.type] || item.type}</span></td>
                    <td className="px-5 py-4 text-xs text-[var(--text-3)] capitalize">{item.frequency?.replace('_', ' ')}</td>
                    <td className="px-5 py-4 text-xs text-[var(--text-3)]">{item.ctaText || '—'}</td>
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
      {modal && <PopupForm existing={editing} onClose={() => setModal(false)} onSaved={handleSaved} />}
    </AdminLayout>
  );
}

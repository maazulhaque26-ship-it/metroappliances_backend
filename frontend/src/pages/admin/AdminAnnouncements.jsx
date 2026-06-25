import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

const BLANK = {
  title: '', icon: '', bgColor: '#FF8A00', textColor: '#ffffff',
  ctaText: '', ctaLink: '', startDate: '', endDate: '',
  priority: 0, isActive: true, displayOn: 'all', animation: 'none',
};

function fmtDt(iso) {
  if (!iso) return '';
  return iso.slice(0, 16); // "2024-06-01T14:00"
}

function AnnouncementForm({ existing, onClose, onSaved }) {
  const [form, setForm] = useState(
    existing
      ? { ...existing, startDate: fmtDt(existing.startDate), endDate: fmtDt(existing.endDate) }
      : { ...BLANK }
  );
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    try {
      setSaving(true);
      let res;
      if (existing?._id) {
        res = await API.put(`/admin/announcements/${existing._id}`, form);
      } else {
        res = await API.post('/admin/announcements', form);
      }
      toast.success(existing ? 'Updated' : 'Created');
      onSaved(res.data.announcement);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-xl p-6 relative max-h-[90vh] overflow-y-auto" style={{ borderRadius: 'var(--radius-md)' }}>
        <button onClick={onClose} className="absolute top-5 right-5 text-[var(--text-3)] hover:text-[var(--text)]"><FiX size={20} /></button>
        <h2 className="text-2xl font-extrabold text-[var(--text)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
          {existing ? 'Edit Announcement' : 'New Announcement'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Title *</label>
              <input value={form.title} onChange={set('title')} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[var(--text)]" placeholder="e.g. Free shipping on orders over ₹999" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Icon / Emoji</label>
              <input value={form.icon} onChange={set('icon')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" placeholder="🚀  or leave empty" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Priority</label>
              <input type="number" value={form.priority} onChange={set('priority')} min={0} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Background Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.bgColor} onChange={set('bgColor')} className="w-10 h-10 border border-[var(--border)] rounded cursor-pointer p-0.5" />
                <input value={form.bgColor} onChange={set('bgColor')} className="flex-1 bg-[var(--bg)] border border-[var(--border)] px-3 py-3 text-sm outline-none font-mono" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Text Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.textColor} onChange={set('textColor')} className="w-10 h-10 border border-[var(--border)] rounded cursor-pointer p-0.5" />
                <input value={form.textColor} onChange={set('textColor')} className="flex-1 bg-[var(--bg)] border border-[var(--border)] px-3 py-3 text-sm outline-none font-mono" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">CTA Text</label>
              <input value={form.ctaText} onChange={set('ctaText')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" placeholder="e.g. Shop Now" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">CTA Link</label>
              <input value={form.ctaLink} onChange={set('ctaLink')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" placeholder="/shop" />
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
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Display On</label>
              <select value={form.displayOn} onChange={set('displayOn')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none">
                <option value="all">All Devices</option>
                <option value="desktop">Desktop Only</option>
                <option value="mobile">Mobile Only</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Animation</label>
              <select value={form.animation} onChange={set('animation')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none">
                <option value="none">None</option>
                <option value="slide">Slide</option>
                <option value="fade">Fade</option>
                <option value="marquee">Marquee (ticker)</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer mt-2">
            <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="w-4 h-4 accent-[var(--accent)]" />
            <span className="text-sm font-medium text-[var(--text)]">Active</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest transition-opacity" style={{ opacity: saving ? 0.65 : 1 }}>
              {saving ? 'Saving…' : (existing ? 'Update' : 'Create')}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-bold uppercase tracking-widest border border-[var(--border)] text-[var(--text)]">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/announcements');
      setItems(data.announcements || []);
    } catch { toast.error('Failed to load announcements'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setModal(true); };
  const openEdit = (item) => { setEditing(item); setModal(true); };

  const handleSaved = (saved) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i._id === saved._id);
      return idx >= 0 ? prev.map(i => i._id === saved._id ? saved : i) : [saved, ...prev];
    });
    setModal(false);
  };

  const handleToggle = async (item) => {
    try {
      const { data } = await API.put(`/admin/announcements/${item._id}/toggle`);
      setItems(prev => prev.map(i => i._id === item._id ? data.announcement : i));
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await API.delete(`/admin/announcements/${item._id}`);
      setItems(prev => prev.filter(i => i._id !== item._id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Announcement Bar</h1>
            <p className="text-[var(--text-3)] text-sm mt-1">{items.length} announcement{items.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
            <FiPlus size={16} /> New Announcement
          </button>
        </div>

        <div className="border border-[var(--border)] overflow-hidden" style={{ borderRadius: 'var(--radius-md)', background: 'var(--card)' }}>
          {loading ? (
            <div className="p-12 text-center text-[var(--text-4)] text-sm">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-4)] text-sm">No announcements yet. Create one above.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                  {['Title', 'Colors', 'Schedule', 'Display', 'Priority', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item._id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {item.icon && <span>{item.icon}</span>}
                        <div>
                          <p className="font-semibold text-[var(--text)]">{item.title}</p>
                          {item.ctaText && <p className="text-xs text-[var(--text-4)]">{item.ctaText} → {item.ctaLink}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-5 h-5 rounded border border-[var(--border)]" style={{ background: item.bgColor }} title={item.bgColor} />
                        <span className="w-5 h-5 rounded border border-[var(--border)]" style={{ background: item.textColor }} title={item.textColor} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--text-3)]">
                      {item.startDate ? new Date(item.startDate).toLocaleDateString('en-IN') : '—'}<br/>
                      {item.endDate ? new Date(item.endDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--text-3)]">
                      <span className="capitalize">{item.displayOn}</span><br/>
                      <span className="text-[var(--text-4)]">{item.animation}</span>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-[var(--text-3)]">{item.priority}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleToggle(item)} className="transition-colors" style={{ color: item.isActive ? '#22c55e' : 'var(--text-4)' }}>
                        {item.isActive ? <FiToggleRight size={22} /> : <FiToggleLeft size={22} />}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)} className="p-2 text-[var(--text-3)] hover:text-[var(--text)] transition-colors"><FiEdit2 size={15} /></button>
                        <button onClick={() => handleDelete(item)} className="p-2 text-[var(--text-3)] hover:text-red-500 transition-colors"><FiTrash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {modal && <AnnouncementForm existing={editing} onClose={() => setModal(false)} onSaved={handleSaved} />}
    </AdminLayout>
  );
}

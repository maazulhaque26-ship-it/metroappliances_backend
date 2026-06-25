import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiX, FiBell } from 'react-icons/fi';

const TYPES = ['order', 'offer', 'coupon', 'wishlist', 'price_drop', 'back_in_stock', 'admin', 'system'];

const BLANK = { title: '', body: '', type: 'admin', isBroadcast: true, link: '' };

const TYPE_COLOR = {
  order: '#3b82f6', offer: '#f59e0b', coupon: '#22c55e', wishlist: '#ef4444',
  price_drop: '#f97316', back_in_stock: '#8b5cf6', admin: '#6b7280', system: '#6b7280',
};

function BroadcastForm({ onClose, onSent }) {
  const [form, setForm] = useState({ ...BLANK });
  const [sending, setSending] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return toast.error('Title and body required');
    try {
      setSending(true);
      await API.post('/admin/notifications/broadcast', form);
      toast.success('Broadcast sent to all users');
      onSent();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-md p-6 relative" style={{ borderRadius: 'var(--radius-md)' }}>
        <button onClick={onClose} className="absolute top-5 right-5 text-[var(--text-3)] hover:text-[var(--text)]"><FiX size={20} /></button>
        <h2 className="text-2xl font-extrabold text-[var(--text)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>Broadcast Notification</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Title *</label>
            <input value={form.title} onChange={set('title')} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" placeholder="e.g. Weekend Sale — Up to 40% Off" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Body *</label>
            <textarea value={form.body} onChange={set('body')} required rows={3} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none resize-none" placeholder="Notification message…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Type</label>
              <select value={form.type} onChange={set('type')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none capitalize">
                {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Deep Link (optional)</label>
              <input value={form.link} onChange={set('link')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none" placeholder="/deals" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={sending} className="flex-1 py-3 bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2" style={{ opacity: sending ? 0.65 : 1 }}>
              <FiBell size={13} /> {sending ? 'Sending…' : 'Broadcast to All Users'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-3 text-xs font-bold uppercase tracking-widest border border-[var(--border)] text-[var(--text)]">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/notifications');
      setItems(data.notifications || []);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSent = () => { setModal(false); load(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await API.delete(`/admin/notifications/${id}`);
      setItems(prev => prev.filter(n => n._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Notifications</h1>
            <p className="text-[var(--text-3)] text-sm mt-1">{items.length} notification{items.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setModal(true)} className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
            <FiPlus size={16} /> Broadcast
          </button>
        </div>

        <div className="border border-[var(--border)] overflow-hidden" style={{ borderRadius: 'var(--radius-md)', background: 'var(--card)' }}>
          {loading ? (
            <div className="p-12 text-center text-[var(--text-4)] text-sm">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-4)] text-sm">No notifications. Use Broadcast to send to all users.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                  {['Type', 'Title', 'Body', 'Scope', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((n, i) => (
                  <tr key={n._id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full" style={{ background: `${TYPE_COLOR[n.type] || '#6b7280'}18`, color: TYPE_COLOR[n.type] || '#6b7280' }}>
                        {n.type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[var(--text)] max-w-[160px] truncate">{n.title}</td>
                    <td className="px-5 py-4 text-[var(--text-3)] max-w-[200px] truncate">{n.body}</td>
                    <td className="px-5 py-4 text-xs text-[var(--text-3)]">
                      {n.isBroadcast ? <span className="text-[var(--accent)] font-medium">Broadcast</span> : 'User'}
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--text-3)]">{new Date(n.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleDelete(n._id)} className="p-2 text-[var(--text-3)] hover:text-red-500 transition-colors"><FiTrash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {modal && <BroadcastForm onClose={() => setModal(false)} onSent={handleSent} />}
    </AdminLayout>
  );
}

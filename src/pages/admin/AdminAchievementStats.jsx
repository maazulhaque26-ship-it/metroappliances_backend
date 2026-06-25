import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import { FiTrash2, FiEdit2, FiPlus, FiX, FiHash, FiToggleLeft, FiToggleRight, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { toast } from 'react-toastify';

const BLANK = { title: '', count: '', suffix: '+', displayOrder: 0, isActive: true };

function StatForm({ existing, onClose, onSaved }) {
  const [form,   setForm]   = useState(existing ? {
    title: existing.title,
    count: String(existing.count),
    suffix: existing.suffix || '+',
    displayOrder: existing.displayOrder,
    isActive: existing.isActive,
  } : BLANK);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (form.count === '' || isNaN(Number(form.count))) return toast.error('Count must be a number');
    try {
      setSaving(true);
      const payload = {
        title:        form.title.trim(),
        count:        Number(form.count),
        suffix:       form.suffix.trim(),
        displayOrder: Number(form.displayOrder),
        isActive:     form.isActive,
      };
      const url    = existing?._id ? `/admin/achievement-stats/${existing._id}` : '/admin/achievement-stats';
      const method = existing?._id ? 'put' : 'post';
      const res    = await API[method](url, payload);
      toast.success(existing ? 'Stat updated' : 'Stat added');
      onSaved(res.data.stat);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving stat');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white border border-[var(--border)] w-full max-w-lg p-6 sm:p-8 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
          <FiX size={22} />
        </button>
        <h2 className="text-2xl font-extrabold text-[var(--text)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
          {existing ? 'Edit Counter' : 'Add Counter'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Label / Title *</label>
            <input
              type="text" required
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
              placeholder="e.g. Happy Customers"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Count *</label>
              <input
                type="number" required min="0"
                value={form.count}
                onChange={e => setForm(p => ({ ...p, count: e.target.value }))}
                className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
                placeholder="e.g. 5000"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Suffix</label>
              <input
                type="text"
                value={form.suffix}
                onChange={e => setForm(p => ({ ...p, suffix: e.target.value }))}
                className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
                placeholder="e.g. + or %"
              />
              <p className="text-[10px] text-[var(--text-4)] mt-1">Shown after the number (e.g. "5000+")</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Display Order</label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={e => setForm(p => ({ ...p, displayOrder: Number(e.target.value) }))}
                className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Status</label>
              <select
                value={String(form.isActive)}
                onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}
                className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
              >
                <option value="true">Active — visible</option>
                <option value="false">Inactive — hidden</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="p-5 bg-[var(--bg)] border border-[var(--border)] text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-3">Preview</p>
            <div className="text-4xl font-extrabold text-[#FF7A00]" style={{ fontFamily: 'var(--font-display)' }}>
              {form.count || '0'}{form.suffix}
            </div>
            <div className="text-sm font-bold text-[var(--text)] mt-1">{form.title || 'Label'}</div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-6 py-3 border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--bg)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : existing ? 'Update' : 'Add Counter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminAchievementStats() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);

  const fetchItems = async () => {
    try {
      const res = await API.get('/admin/achievement-stats');
      setItems(res.data.stats);
    } catch { toast.error('Failed to load stats'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit   = (item) => { setEditing(item); setShowForm(true); };

  const handleSaved = (stat) => {
    setItems(prev => {
      const exists = prev.find(s => s._id === stat._id);
      const next   = exists
        ? prev.map(s => s._id === stat._id ? stat : s)
        : [...prev, stat];
      return next.sort((a, b) => a.displayOrder - b.displayOrder);
    });
    setShowForm(false);
  };

  const toggleItem = async (id) => {
    try {
      const res = await API.put(`/admin/achievement-stats/${id}/toggle`);
      setItems(prev => prev.map(s => s._id === id ? res.data.stat : s));
    } catch { toast.error('Error updating status'); }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this counter?')) return;
    try {
      await API.delete(`/admin/achievement-stats/${id}`);
      toast.success('Deleted');
      setItems(prev => prev.filter(s => s._id !== id));
    } catch { toast.error('Error deleting'); }
  };

  const moveOrder = async (id, direction) => {
    const idx     = items.findIndex(s => s._id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const next = [...items];
    const tmp  = next[idx].displayOrder;
    next[idx].displayOrder    = next[swapIdx].displayOrder;
    next[swapIdx].displayOrder = tmp;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setItems(next);

    try {
      await API.put('/admin/achievement-stats/reorder', {
        order: next.map((s, i) => ({ id: s._id, displayOrder: i })),
      });
    } catch { toast.error('Error saving order'); fetchItems(); }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>
              Achievement Counters
            </h1>
            <p className="text-[var(--text-3)] text-sm font-medium mt-1">
              Animated number counters shown on the About page (e.g. "5000+ Happy Customers").
            </p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">
            <FiPlus size={15} /> Add Counter
          </button>
        </div>

        {/* Info banner */}
        <div className="p-4 bg-[#FFF8F3] border border-[#FFD4AA] text-sm text-[#8B4513] flex gap-3 items-start">
          <FiHash size={16} className="flex-shrink-0 mt-0.5 text-[#FF7A00]" />
          <div>
            <span className="font-bold">Animated Counters</span> — these numbers animate up from 0 when visitors scroll to them on the About page.
            The <span className="font-bold">suffix</span> appears right after the number (e.g. "+", "%" or " yrs").
          </div>
        </div>

        <div className="bg-white border border-[var(--border)]">
          {loading ? (
            <div className="p-10 text-center text-[var(--text-3)] text-sm">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center bg-[var(--bg)]">
              <FiHash size={48} className="mx-auto text-[#CCCCCC] mb-4" />
              <p className="text-[var(--text-3)] text-sm font-medium">No counters yet. Add your first achievement stat.</p>
              <button onClick={openCreate}
                className="mt-6 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">
                Add Counter
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {items.map((item, idx) => (
                <div key={item._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg)] transition-colors">
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    {/* Counter preview */}
                    <div className="w-24 h-16 flex-shrink-0 bg-[var(--bg)] border border-[var(--border)] flex flex-col items-center justify-center">
                      <span className="text-xl font-extrabold text-[#FF7A00]" style={{ fontFamily: 'var(--font-display)' }}>
                        {item.count}{item.suffix}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--text)] text-sm leading-tight">{item.title}</p>
                      <p className="text-[var(--text-3)] text-xs mt-0.5">
                        Count: <span className="font-bold text-[var(--text)]">{item.count}</span> &nbsp;·&nbsp; Suffix: <span className="font-bold text-[var(--text)]">"{item.suffix}"</span>
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                          item.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-[var(--text-4)] text-[10px] font-medium">Order: {item.displayOrder}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => moveOrder(item._id, 'up')} disabled={idx === 0}
                      className="p-2.5 text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-2)] transition-colors disabled:opacity-25" title="Move up">
                      <FiArrowUp size={15} />
                    </button>
                    <button onClick={() => moveOrder(item._id, 'down')} disabled={idx === items.length - 1}
                      className="p-2.5 text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-2)] transition-colors disabled:opacity-25" title="Move down">
                      <FiArrowDown size={15} />
                    </button>
                    <button onClick={() => toggleItem(item._id)}
                      className={`p-2.5 transition-colors ${item.isActive ? 'text-green-600 hover:bg-green-50' : 'text-[var(--text-3)] hover:bg-[var(--bg-2)]'}`}
                      title={item.isActive ? 'Deactivate' : 'Activate'}>
                      {item.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="p-2.5 text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-2)] transition-colors" title="Edit">
                      <FiEdit2 size={16} />
                    </button>
                    <button onClick={() => deleteItem(item._id)}
                      className="p-2.5 text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <StatForm existing={editing} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </AdminLayout>
  );
}

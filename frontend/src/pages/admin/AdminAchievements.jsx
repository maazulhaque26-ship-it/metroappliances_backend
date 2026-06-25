import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import ImageUploader from '../../components/ui/ImageUploader';
import { FiTrash2, FiEdit2, FiPlus, FiX, FiImage, FiToggleLeft, FiToggleRight, FiArrowUp, FiArrowDown, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { imgSrc } from '../../utils/imageHelper';

const PAGE_SIZE = 12;

const BLANK = { title: '', description: '', displayOrder: 0, isActive: true };

function AchievementForm({ existing, onClose, onSaved }) {
  const [form,      setForm]      = useState(existing ? {
    title: existing.title, description: existing.description,
    displayOrder: existing.displayOrder, isActive: existing.isActive,
  } : BLANK);
  const [imageData, setImageData] = useState(existing?.image ? [existing.image] : []);
  const [saving,    setSaving]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!existing && imageData.length === 0) return toast.error('Please upload an image');
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const img = imageData[0];
      if (img && typeof img === 'object' && img.file) fd.append('image', img.file);

      const url = existing?._id
        ? `/admin/achievements/${existing._id}`
        : '/admin/achievements';
      const method = existing?._id ? 'put' : 'post';
      const res = await API[method](url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(existing ? 'Achievement updated' : 'Achievement added');
      onSaved(res.data.achievement);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving achievement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white border border-[var(--border)] w-full max-w-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
          <FiX size={22} />
        </button>
        <h2 className="text-2xl font-extrabold text-[var(--text)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
          {existing ? 'Edit Achievement' : 'Add Achievement'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Image</label>
            <ImageUploader value={imageData} onChange={setImageData} maxCount={1} label="Upload Image" />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Title *</label>
            <input
              type="text" required
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
              placeholder="e.g. Best Home Appliance Brand 2024"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">
              Description * <span className="normal-case font-normal">(max 150 characters shown on card)</span>
            </label>
            <textarea
              required rows={3} maxLength={200}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111] resize-none"
              placeholder="Brief description of this achievement"
            />
            <p className="text-[10px] text-[var(--text-4)] mt-1">{form.description.length} / 200 characters</p>
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
                value={form.isActive}
                onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}
                className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
              >
                <option value="true">Active — visible on About page</option>
                <option value="false">Inactive — hidden</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-6 py-3 border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--bg)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : existing ? 'Update' : 'Add Achievement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminAchievements() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all'); // 'all' | 'active' | 'inactive'
  const [page,     setPage]     = useState(1);

  const fetchItems = async () => {
    try {
      const res = await API.get('/admin/achievements');
      setItems(res.data.achievements);
    } catch { toast.error('Failed to load achievements'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { setPage(1); }, [search, filter]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filter === 'active')   list = list.filter(a => a.isActive);
    if (filter === 'inactive') list = list.filter(a => !a.isActive);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a => a.title?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q));
    }
    return list;
  }, [items, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit   = (item) => { setEditing(item); setShowForm(true); };

  const handleSaved = (achievement) => {
    setItems(prev => {
      const exists = prev.find(a => a._id === achievement._id);
      const next   = exists
        ? prev.map(a => a._id === achievement._id ? achievement : a)
        : [...prev, achievement];
      return next.sort((a, b) => a.displayOrder - b.displayOrder);
    });
    setShowForm(false);
  };

  const toggleItem = async (id) => {
    try {
      const res = await API.put(`/admin/achievements/${id}/toggle`);
      setItems(prev => prev.map(a => a._id === id ? res.data.achievement : a));
    } catch { toast.error('Error updating status'); }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this achievement?')) return;
    try {
      await API.delete(`/admin/achievements/${id}`);
      toast.success('Deleted');
      setItems(prev => prev.filter(a => a._id !== id));
    } catch { toast.error('Error deleting'); }
  };

  const moveOrder = async (id, direction) => {
    const idx  = items.findIndex(a => a._id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const next = [...items];
    const tmp  = next[idx].displayOrder;
    next[idx].displayOrder = next[swapIdx].displayOrder;
    next[swapIdx].displayOrder = tmp;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setItems(next);

    try {
      await API.put('/admin/achievements/reorder', {
        order: next.map((a, i) => ({ id: a._id, displayOrder: i })),
      });
    } catch { toast.error('Error saving order'); fetchItems(); }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Achievements</h1>
            <p className="text-[var(--text-3)] text-sm font-medium mt-1">
              Manage achievement cards shown on the About page.
            </p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">
            <FiPlus size={15} /> Add Achievement
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or description…"
              className="w-full pl-10 pr-4 py-3 bg-white border border-[var(--border)] text-sm outline-none focus:border-[#111111]"
            />
          </div>
          <div className="flex gap-2">
            {[['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest border transition-colors ${
                  filter === val
                    ? 'bg-[var(--text)] text-white border-[var(--text)]'
                    : 'bg-white text-[var(--text-3)] border-[var(--border)] hover:border-[var(--text)] hover:text-[var(--text)]'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[var(--border)]">
          {loading ? (
            <div className="p-10 text-center text-[var(--text-3)] text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center bg-[var(--bg)]">
              <FiImage size={48} className="mx-auto text-[#CCCCCC] mb-4" />
              <p className="text-[var(--text-3)] text-sm font-medium">
                {search || filter !== 'all' ? 'No achievements match your filters.' : 'No achievements yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {paginated.map(item => {
                const itemIdx = items.findIndex(a => a._id === item._id);
                return (
                <div key={item._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg)] transition-colors">
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="w-20 h-20 flex-shrink-0 bg-[var(--bg)] border border-[var(--border)] overflow-hidden">
                      {item.image
                        ? <img src={imgSrc(item.image)} alt={item.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><FiImage size={22} className="text-[#CCCCCC]" /></div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--text)] text-sm leading-tight truncate">{item.title}</p>
                      <p className="text-[var(--text-3)] text-xs mt-0.5 line-clamp-2 max-w-xs">{item.description}</p>
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
                    <button onClick={() => moveOrder(item._id, 'up')} disabled={itemIdx === 0}
                      className="p-2.5 text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-2)] transition-colors disabled:opacity-25" title="Move up">
                      <FiArrowUp size={15} />
                    </button>
                    <button onClick={() => moveOrder(item._id, 'down')} disabled={itemIdx === items.length - 1}
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
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-[var(--text-4)] text-xs font-medium">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 border border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)] disabled:opacity-30 transition-colors">
                <FiChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={`px-3 py-2 text-xs font-bold border transition-colors ${
                    n === page ? 'bg-[var(--text)] text-white border-[var(--text)]' : 'border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)]'
                  }`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 border border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)] disabled:opacity-30 transition-colors">
                <FiChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <AchievementForm existing={editing} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </AdminLayout>
  );
}

import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import ImageUploader from '../../components/ui/ImageUploader';
import {
  FiTrash2, FiPlus, FiX, FiImage, FiEdit2,
  FiToggleLeft, FiToggleRight, FiArrowUp, FiArrowDown,
  FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { imgSrc } from '../../utils/imageHelper';

const PAGE_SIZE = 24;

function GalleryForm({ existing, onClose, onSaved }) {
  const [imageData,    setImageData]    = useState(existing?.image ? [existing.image] : []);
  const [displayOrder, setDisplayOrder] = useState(existing?.displayOrder ?? 0);
  const [isActive,     setIsActive]     = useState(existing?.isActive ?? true);
  const [saving,       setSaving]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!existing && imageData.length === 0) return toast.error('Please upload an image');
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('displayOrder', displayOrder);
      fd.append('isActive', isActive);
      const img = imageData[0];
      if (img && typeof img === 'object' && img.file) fd.append('image', img.file);

      const url    = existing?._id ? `/admin/gallery/${existing._id}` : '/admin/gallery';
      const method = existing?._id ? 'put' : 'post';
      const res    = await API[method](url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(existing ? 'Image updated' : 'Image added');
      onSaved(res.data.image);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving image');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white border border-[var(--border)] w-full max-w-lg p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
          <FiX size={22} />
        </button>
        <h2 className="text-2xl font-extrabold text-[var(--text)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
          {existing ? 'Edit Gallery Image' : 'Add Gallery Image'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Image</label>
            <ImageUploader value={imageData} onChange={setImageData} maxCount={1} label="Upload Image" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Display Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={e => setDisplayOrder(Number(e.target.value))}
                className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Status</label>
              <select
                value={String(isActive)}
                onChange={e => setIsActive(e.target.value === 'true')}
                className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
              >
                <option value="true">Active — visible</option>
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
              {saving ? 'Saving…' : existing ? 'Update' : 'Add Image'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminGallery() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [filter,   setFilter]   = useState('all'); // 'all' | 'active' | 'inactive'
  const [page,     setPage]     = useState(1);

  const fetchItems = async () => {
    try {
      const res = await API.get('/admin/gallery');
      setItems(res.data.images);
    } catch { toast.error('Failed to load gallery'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { setPage(1); }, [filter]);

  const filtered = useMemo(() => {
    if (filter === 'active')   return items.filter(i => i.isActive);
    if (filter === 'inactive') return items.filter(i => !i.isActive);
    return items;
  }, [items, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSaved = (image) => {
    setItems(prev => {
      const exists = prev.find(i => i._id === image._id);
      const next   = exists
        ? prev.map(i => i._id === image._id ? image : i)
        : [...prev, image];
      return next.sort((a, b) => a.displayOrder - b.displayOrder);
    });
    setShowForm(false);
  };

  const toggleItem = async (id) => {
    try {
      const res = await API.put(`/admin/gallery/${id}/toggle`);
      setItems(prev => prev.map(i => i._id === id ? res.data.image : i));
    } catch { toast.error('Error updating status'); }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this gallery image?')) return;
    try {
      await API.delete(`/admin/gallery/${id}`);
      toast.success('Deleted');
      setItems(prev => prev.filter(i => i._id !== id));
    } catch { toast.error('Error deleting'); }
  };

  const moveOrder = async (id, direction) => {
    const idx     = items.findIndex(i => i._id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const next = [...items];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setItems(next);

    try {
      await API.put('/admin/gallery/reorder', {
        order: next.map((item, i) => ({ id: item._id, displayOrder: i })),
      });
    } catch { toast.error('Error saving order'); fetchItems(); }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Gallery</h1>
            <p className="text-[var(--text-3)] text-sm font-medium mt-1">
              {items.length} images total · {items.filter(i => i.isActive).length} active
            </p>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">
            <FiPlus size={15} /> Add Image
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {[['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest border transition-colors ${
                filter === val
                  ? 'bg-[var(--text)] text-white border-[var(--text)]'
                  : 'bg-white text-[var(--text-3)] border-[var(--border)] hover:border-[var(--text)] hover:text-[var(--text)]'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="p-10 text-center text-[var(--text-3)] text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center bg-white border border-[var(--border)]">
            <FiImage size={48} className="mx-auto text-[#CCCCCC] mb-4" />
            <p className="text-[var(--text-3)] text-sm font-medium">
              {filter !== 'all' ? 'No images match this filter.' : 'No gallery images yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {paginated.map(item => {
              const itemIdx = items.findIndex(i => i._id === item._id);
              return (
                <div key={item._id} className="group relative bg-white border border-[var(--border)] overflow-hidden">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={imgSrc(item.image)}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none" />

                  {/* Status badge */}
                  <div className="absolute top-1.5 left-1.5">
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 border ${
                      item.isActive ? 'bg-green-50/90 text-green-700 border-green-200' : 'bg-red-50/90 text-red-700 border-red-200'
                    }`}>
                      {item.isActive ? '✓' : '✕'}
                    </span>
                  </div>

                  {/* Action buttons — shown on hover */}
                  <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-1.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/70 to-transparent">
                    <div className="flex gap-0.5">
                      <button onClick={() => moveOrder(item._id, 'up')} disabled={itemIdx === 0}
                        className="p-1.5 bg-white/90 hover:bg-white text-[#111111] transition-colors disabled:opacity-30" title="Move up">
                        <FiArrowUp size={11} />
                      </button>
                      <button onClick={() => moveOrder(item._id, 'down')} disabled={itemIdx === items.length - 1}
                        className="p-1.5 bg-white/90 hover:bg-white text-[#111111] transition-colors disabled:opacity-30" title="Move down">
                        <FiArrowDown size={11} />
                      </button>
                    </div>
                    <div className="flex gap-0.5">
                      <button onClick={() => toggleItem(item._id)}
                        className={`p-1.5 transition-colors ${item.isActive ? 'bg-green-100/90 text-green-700 hover:bg-green-100' : 'bg-white/90 text-[var(--text-3)] hover:bg-white'}`}
                        title={item.isActive ? 'Deactivate' : 'Activate'}>
                        {item.isActive ? <FiToggleRight size={12} /> : <FiToggleLeft size={12} />}
                      </button>
                      <button onClick={() => { setEditing(item); setShowForm(true); }}
                        className="p-1.5 bg-white/90 hover:bg-white text-[#111111] transition-colors" title="Edit">
                        <FiEdit2 size={11} />
                      </button>
                      <button onClick={() => deleteItem(item._id)}
                        className="p-1.5 bg-red-100/90 hover:bg-red-100 text-red-600 transition-colors" title="Delete">
                        <FiTrash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
        <GalleryForm existing={editing} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </AdminLayout>
  );
}

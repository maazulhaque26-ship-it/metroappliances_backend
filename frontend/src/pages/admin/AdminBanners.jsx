import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import ImageUploader from '../../components/ui/ImageUploader';
import { FiTrash2, FiEdit2, FiPlus, FiX, FiImage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { imgSrc } from '../../utils/imageHelper';

function BannerForm({ existing, onClose, onSaved }) {
  const [form, setForm] = useState(
    existing || {
      eyebrow: '', title1: '', title2: '', subtitle: '',
      cta: '', ctaPath: '', badge: '', displayOrder: 0, isActive: true
    }
  );
  const [imageData, setImageData] = useState(existing?.image ? [existing.image] : []);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const img = imageData[0];
      if (img && typeof img === 'object' && img.file) fd.append('image', img.file);

      let res;
      if (existing?._id) {
        res = await API.put(`/admin/banners/${existing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        if (imageData.length === 0) return toast.error('Banner image is required');
        res = await API.post('/admin/banners', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      toast.success(existing ? 'Updated' : 'Created');
      onSaved(res.data.banner);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving banner');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--text)]/80 flex items-center justify-center p-4">
      <div className="bg-white border border-[var(--border)] w-full max-w-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-[var(--text-3)] hover:text-[var(--text)] transition-colors"><FiX size={24} /></button>
        <h2 className="text-2xl font-extrabold text-[var(--text)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>{existing ? 'Edit Banner' : 'Add Banner'}</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Banner Image</label>
            <ImageUploader value={imageData} onChange={setImageData} maxCount={1} label="Upload Banner Image" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Eyebrow text</label>
              <input type="text" value={form.eyebrow} onChange={e => setForm(p => ({ ...p, eyebrow: e.target.value }))} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="e.g. Introducing the X-Series" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Badge</label>
              <input type="text" value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="e.g. New Collection" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Title Line 1 *</label>
              <input type="text" value={form.title1} onChange={e => setForm(p => ({ ...p, title1: e.target.value }))} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="e.g. Engineering" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Title Line 2</label>
              <input type="text" value={form.title2} onChange={e => setForm(p => ({ ...p, title2: e.target.value }))} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="e.g. Perfection (Accent color)" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Subtitle *</label>
            <textarea value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} required rows={2} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111] resize-none" placeholder="Description under the title"></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">CTA Button Text *</label>
              <input type="text" value={form.cta} onChange={e => setForm(p => ({ ...p, cta: e.target.value }))} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="e.g. Explore Now" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">CTA Button Path *</label>
              <input type="text" value={form.ctaPath} onChange={e => setForm(p => ({ ...p, ctaPath: e.target.value }))} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="e.g. /shop" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Display Order</label>
              <input type="number" value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: e.target.value }))} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Status</label>
              <select value={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-3 border border-[#111111] text-[var(--text)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--bg)] transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BannerManager() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchBanners = async () => {
    try {
      const res = await API.get('/banners');
      setBanners(res.data.banners);
    } catch (err) {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const deleteBanner = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await API.delete(`/admin/banners/${id}`);
      toast.success('Deleted');
      setBanners(prev => prev.filter(b => b._id !== id));
    } catch (err) {
      toast.error('Error deleting');
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Hero Banners</h1>
            <p className="text-[var(--text-3)] text-sm font-medium mt-1">Manage the hero sliders displayed on the homepage.</p>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">
            <FiPlus size={16} /> Add Banner
          </button>
        </div>

        <div className="bg-white border border-[var(--border)]">
          {loading ? (
            <div className="p-8 text-center text-[var(--text-3)]">Loading...</div>
          ) : banners.length === 0 ? (
            <div className="p-16 text-center bg-[var(--bg)]">
              <FiImage size={48} className="mx-auto text-[#CCCCCC] mb-4" />
              <div className="text-[var(--text-3)] text-sm font-medium">No banners found. The homepage will fallback to default ones.</div>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E5E5]">
              {banners.map(b => (
                <div key={b._id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-[var(--bg)] transition-colors">
                  <div className="flex items-center gap-6 w-full max-w-xl">
                    <img src={imgSrc(b.image)} alt="" className="w-32 aspect-video object-cover bg-[#E5E5E5] border border-[var(--border)]" />
                    <div className="flex-1">
                      <h3 className="text-[var(--text)] font-bold text-lg leading-none mb-1">{b.title1} {b.title2}</h3>
                      <p className="text-[var(--text-3)] text-sm line-clamp-1">{b.subtitle}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${b.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{b.isActive ? 'Active' : 'Inactive'}</span>
                        <span className="text-[var(--text-3)] text-xs font-medium">Order: {b.displayOrder}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <button onClick={() => { setEditing(b); setShowForm(true); }} className="p-3 text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[#E5E5E5] transition-colors" title="Edit">
                      <FiEdit2 size={18} />
                    </button>
                    <button onClick={() => deleteBanner(b._id)} className="p-3 text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {showForm && (
        <BannerForm 
          existing={editing} 
          onClose={() => setShowForm(false)} 
          onSaved={(banner) => {
            if (editing) setBanners(prev => prev.map(m => m._id === banner._id ? banner : m).sort((a, b) => a.displayOrder - b.displayOrder));
            else setBanners(prev => [...prev, banner].sort((a, b) => a.displayOrder - b.displayOrder));
            setShowForm(false);
          }}
        />
      )}
    </>
  );
}

export default function AdminBanners() {
  return (
    <AdminLayout>
      <BannerManager />
    </AdminLayout>
  );
}

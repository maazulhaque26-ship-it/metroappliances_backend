import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import {
  FiPlus, FiX, FiTrash2, FiEdit2, FiToggleLeft, FiToggleRight,
  FiArrowUp, FiArrowDown, FiImage, FiEye,
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const MAX_SLIDES   = 4;
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_BYTES    = 5 * 1024 * 1024;

function validateFile(file) {
  if (!file) return null;
  const ext = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) return `File type .${ext} is not allowed. Use jpg, jpeg, png or webp.`;
  if (file.size > MAX_BYTES) return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum 5 MB.`;
  return null;
}

function SlideForm({ existing, totalCount, onClose, onSaved }) {
  const [file,         setFile]         = useState(null);
  const [preview,      setPreview]      = useState(existing?.image || null);
  const [title,        setTitle]        = useState(existing?.title || '');
  const [subtitle,     setSubtitle]     = useState(existing?.subtitle || '');
  const [displayOrder, setDisplayOrder] = useState(existing?.displayOrder ?? totalCount);
  const [isActive,     setIsActive]     = useState(existing?.isActive ?? true);
  const [saving,       setSaving]       = useState(false);
  const [fileError,    setFileError]    = useState('');

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) { setFileError(err); return; }
    setFileError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!existing && !file) { setFileError('Please select an image.'); return; }
    try {
      setSaving(true);
      const fd = new FormData();
      if (file)            fd.append('image', file);
      fd.append('title',        title);
      fd.append('subtitle',     subtitle);
      fd.append('displayOrder', displayOrder);
      fd.append('isActive',     isActive);

      const url    = existing?._id ? `/admin/login-slides/${existing._id}` : '/admin/login-slides';
      const method = existing?._id ? 'put' : 'post';
      const res    = await API[method](url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(existing ? 'Slide updated' : 'Slide added');
      onSaved(res.data.slide);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving slide');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-lg p-6 sm:p-8 relative max-h-[92vh] overflow-y-auto"
        style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
        >
          <FiX size={20} />
        </button>

        <h2
          className="text-2xl font-extrabold mb-6"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          {existing ? 'Edit Slide' : 'Add Slide'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image upload */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
              Image {!existing && <span className="text-red-500">*</span>}
            </label>

            {/* Preview */}
            {preview && (
              <div
                className="relative mb-3 overflow-hidden"
                style={{ aspectRatio: '16/9', background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)' }}
              >
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                {file && (
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(existing?.image || null); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full"
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>
            )}

            <label
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed cursor-pointer transition-colors text-[12px] font-semibold uppercase tracking-widest"
              style={{ borderColor: 'var(--border)', color: 'var(--text-3)', borderRadius: 'var(--radius-sm)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
            >
              <FiImage size={15} />
              {file ? 'Change Image' : existing ? 'Replace Image' : 'Upload Image'}
              <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFile} />
            </label>
            {fileError && (
              <p className="mt-1.5 text-[11px] font-medium" style={{ color: '#DC2626' }}>{fileError}</p>
            )}
            <p className="mt-1.5 text-[10px]" style={{ color: 'var(--text-4)' }}>
              jpg · jpeg · png · webp — max 5 MB
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
              Title <span className="font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Premium Appliances"
              className="w-full border px-4 py-3 text-sm outline-none"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                borderRadius: 'var(--radius-sm)',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#111111'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
              Subtitle <span className="font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="e.g. Engineered for Modern Living"
              className="w-full border px-4 py-3 text-sm outline-none"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                borderRadius: 'var(--radius-sm)',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#111111'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Order + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={e => setDisplayOrder(Number(e.target.value))}
                className="w-full px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius-sm)' }}
                onFocus={e => e.currentTarget.style.borderColor = '#111111'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>Status</label>
              <select
                value={String(isActive)}
                onChange={e => setIsActive(e.target.value === 'true')}
                className="w-full px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text)', background: 'transparent', borderRadius: 'var(--radius-sm)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-white text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
              style={{ background: 'var(--text)', borderRadius: 'var(--radius-sm)' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#333'; }}
              onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--text)'; }}
            >
              {saving ? 'Saving…' : existing ? 'Update' : 'Add Slide'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PreviewModal({ slides, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const prev = () => setIdx(i => (i - 1 + slides.length) % slides.length);
  const next = () => setIdx(i => (i + 1) % slides.length);
  const s = slides[idx];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl mx-4">
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors">
          <FiX size={24} />
        </button>
        <div className="relative overflow-hidden bg-black" style={{ aspectRatio: '9/16', maxHeight: '80vh', borderRadius: 'var(--radius-md)' }}>
          <img src={s.image} alt={s.title || 'Slide preview'} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
          <div className="absolute bottom-8 left-8 right-8">
            {s.title && <p className="text-white text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{s.title}</p>}
            {s.subtitle && <p className="text-white/65 text-sm">{s.subtitle}</p>}
          </div>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} style={{ height: '2px', width: i === idx ? '24px' : '12px', background: i === idx ? '#fff' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', transition: 'all 0.25s', borderRadius: '2px', padding: 0 }} />
            ))}
          </div>
        </div>
        {slides.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
              <FiArrowUp size={16} style={{ transform: 'rotate(-90deg)' }} />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
              <FiArrowDown size={16} style={{ transform: 'rotate(-90deg)' }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginSlider() {
  const [slides,     setSlides]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [previewing, setPreviewing] = useState(null);

  const fetchSlides = async () => {
    try {
      const res = await API.get('/admin/login-slides');
      setSlides(res.data.slides);
    } catch { toast.error('Failed to load slides'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSlides(); }, []);

  const handleSaved = (slide) => {
    setSlides(prev => {
      const exists = prev.find(s => s._id === slide._id);
      const next   = exists
        ? prev.map(s => s._id === slide._id ? slide : s)
        : [...prev, slide];
      return next.sort((a, b) => a.displayOrder - b.displayOrder);
    });
    setShowForm(false);
    setEditing(null);
  };

  const toggleSlide = async (id) => {
    try {
      const res = await API.put(`/admin/login-slides/${id}/toggle`);
      setSlides(prev => prev.map(s => s._id === id ? res.data.slide : s));
      toast.success('Status updated');
    } catch { toast.error('Error updating status'); }
  };

  const deleteSlide = async (id) => {
    if (!window.confirm('Delete this slide?')) return;
    try {
      await API.delete(`/admin/login-slides/${id}`);
      setSlides(prev => prev.filter(s => s._id !== id));
      toast.success('Slide deleted');
    } catch { toast.error('Error deleting slide'); }
  };

  const moveOrder = async (id, direction) => {
    const idx     = slides.findIndex(s => s._id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= slides.length) return;
    const next = [...slides];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setSlides(next);
    try {
      await API.put('/admin/login-slides/reorder', {
        order: next.map((s, i) => ({ id: s._id, displayOrder: i })),
      });
    } catch { toast.error('Error saving order'); fetchSlides(); }
  };

  const canAdd = slides.length < MAX_SLIDES;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-3xl font-extrabold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
            >
              Login Page Slider
            </h1>
            <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-3)' }}>
              {slides.length} / {MAX_SLIDES} slides · {slides.filter(s => s.isActive).length} active
              {' · '}jpg · jpeg · png · webp · max 5 MB
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            disabled={!canAdd}
            className="flex items-center gap-2 px-6 py-3 text-white text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: canAdd ? 'var(--text)' : '#888', borderRadius: 'var(--radius-sm)' }}
            title={canAdd ? 'Add slide' : `Maximum ${MAX_SLIDES} slides reached`}
            onMouseEnter={e => { if (canAdd) e.currentTarget.style.background = '#333'; }}
            onMouseLeave={e => { if (canAdd) e.currentTarget.style.background = 'var(--text)'; }}
          >
            <FiPlus size={15} /> Add Slide
          </button>
        </div>

        {!canAdd && (
          <div
            className="px-4 py-3 text-sm font-medium"
            style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.22)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)' }}
          >
            Maximum {MAX_SLIDES} slides reached. Delete an existing slide to add a new one.
          </div>
        )}

        {/* Slides list */}
        {loading ? (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--text-3)' }}>Loading…</div>
        ) : slides.length === 0 ? (
          <div
            className="p-16 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
          >
            <FiImage size={48} className="mx-auto mb-4" style={{ color: 'var(--text-5)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>No slides yet.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Add up to {MAX_SLIDES} images for the login page.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {slides.map((slide, i) => (
              <div
                key={slide._id}
                className="group relative overflow-hidden"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
              >
                {/* Image */}
                <div className="relative overflow-hidden" style={{ aspectRatio: '9/14' }}>
                  <img
                    src={slide.image}
                    alt={slide.title || `Slide ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Gradient */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent 50%)' }} />

                  {/* Status badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5"
                      style={{
                        background: slide.isActive ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
                        color: '#fff',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {slide.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Order badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className="text-[9px] font-bold px-2 py-0.5"
                      style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 'var(--radius-sm)' }}
                    >
                      #{i + 1}
                    </span>
                  </div>

                  {/* Text overlay */}
                  {(slide.title || slide.subtitle) && (
                    <div className="absolute bottom-3 left-3 right-3">
                      {slide.title && (
                        <p className="text-white text-sm font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                          {slide.title}
                        </p>
                      )}
                      {slide.subtitle && (
                        <p className="text-white/65 text-[11px] mt-0.5">{slide.subtitle}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action bar */}
                <div
                  className="flex items-center justify-between px-3 py-2.5 gap-1"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  {/* Reorder */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveOrder(slide._id, 'up')}
                      disabled={i === 0}
                      className="p-1.5 transition-colors disabled:opacity-25"
                      style={{ color: 'var(--text-3)' }}
                      title="Move left"
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                    >
                      <FiArrowUp size={13} />
                    </button>
                    <button
                      onClick={() => moveOrder(slide._id, 'down')}
                      disabled={i === slides.length - 1}
                      className="p-1.5 transition-colors disabled:opacity-25"
                      style={{ color: 'var(--text-3)' }}
                      title="Move right"
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                    >
                      <FiArrowDown size={13} />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPreviewing(i)}
                      className="p-1.5 transition-colors"
                      style={{ color: 'var(--text-3)' }}
                      title="Preview"
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                    >
                      <FiEye size={13} />
                    </button>
                    <button
                      onClick={() => toggleSlide(slide._id)}
                      className="p-1.5 transition-colors"
                      style={{ color: slide.isActive ? '#22C55E' : 'var(--text-3)' }}
                      title={slide.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {slide.isActive ? <FiToggleRight size={14} /> : <FiToggleLeft size={14} />}
                    </button>
                    <button
                      onClick={() => { setEditing(slide); setShowForm(true); }}
                      className="p-1.5 transition-colors"
                      style={{ color: 'var(--text-3)' }}
                      title="Edit"
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                    >
                      <FiEdit2 size={13} />
                    </button>
                    <button
                      onClick={() => deleteSlide(slide._id)}
                      className="p-1.5 transition-colors"
                      style={{ color: 'var(--text-3)' }}
                      title="Delete"
                      onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <SlideForm
          existing={editing}
          totalCount={slides.length}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}

      {previewing !== null && (
        <PreviewModal
          slides={slides}
          startIdx={previewing}
          onClose={() => setPreviewing(null)}
        />
      )}
    </AdminLayout>
  );
}

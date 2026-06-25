import React, { useEffect, useState, useRef } from 'react';
import API from '../../services/api';
import { FiTrash2, FiEdit2, FiPlus, FiX, FiUpload, FiImage, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { imgSrc } from '../../utils/imageHelper';

const MAX_ACTIVE_OFFERS = 5;

function toDatetimeLocal(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function OfferForm({ existing, activeCount, onClose, onSaved }) {
  const [form, setForm] = useState(
    existing
      ? { ...existing, countdownEndDate: toDatetimeLocal(existing.countdownEndDate) }
      : {
          title: '', badge: 'LIMITED TIME OFFER', salePrice: '', originalPrice: '',
          countdownEndDate: '', buttonText: 'Secure Deal', buttonLink: '/shop',
          displayOrder: 0, isActive: true,
        }
  );
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(existing?.image ? imgSrc(existing.image) : null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const atLimit = !existing && form.isActive && activeCount >= MAX_ACTIVE_OFFERS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);

      let res;
      if (existing?._id) {
        res = await API.put(`/admin/offers/${existing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        if (!image) return toast.error('Offer image is required');
        res = await API.post('/admin/offers', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      toast.success(existing ? 'Updated' : 'Created');
      onSaved(res.data.offer);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving offer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--text)]/80 flex items-center justify-center p-4">
      <div className="bg-white border border-[var(--border)] w-full max-w-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-[var(--text-3)] hover:text-[var(--text)] transition-colors"><FiX size={24} /></button>
        <h2 className="text-2xl font-extrabold text-[var(--text)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>{existing ? 'Edit Offer' : 'Add Offer'}</h2>

        {atLimit && (
          <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
            Maximum {MAX_ACTIVE_OFFERS} active offers reached. Saving as Active will be rejected — set Status to Inactive, or disable another offer first.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="w-full aspect-[4/3] bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
              {preview ? (
                <img src={preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <FiImage size={48} className="text-[#CCCCCC]" />
              )}
            </div>
            <div>
              <button type="button" onClick={() => fileRef.current?.click()} className="px-6 py-3 border border-[#111111] text-xs font-bold uppercase tracking-widest text-[var(--text)] hover:bg-[var(--text)] hover:text-white transition-colors flex items-center gap-2 w-max">
                <FiUpload size={14} /> {preview ? 'Change Image' : 'Upload Image'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files[0];
                if (f) { setImage(f); setPreview(URL.createObjectURL(f)); }
              }} />
            </div>
          </div>

          {/* Live preview */}
          <div className="bg-[var(--text)] text-white p-6 border border-white/10">
            <span className="inline-block px-4 py-2 bg-[var(--text)] border-2 border-[#FF7A00] text-[#FF7A00] text-[10px] font-black uppercase tracking-[0.2em] mb-3">
              {form.badge || 'LIMITED TIME OFFER'}
            </span>
            <h3 className="text-xl font-extrabold mb-2">{form.title || 'Offer Title'}</h3>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-extrabold text-[#FF7A00]">₹{Number(form.salePrice || 0).toLocaleString('en-IN')}</span>
              {Number(form.originalPrice) > Number(form.salePrice) && (
                <span className="text-sm text-[#888888] line-through">₹{Number(form.originalPrice).toLocaleString('en-IN')}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="e.g. Metro 3 Burner Gas Stove" />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Badge</label>
            <input type="text" value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="e.g. LIMITED TIME OFFER" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Sale Price *</label>
              <input type="number" min="0" value={form.salePrice} onChange={e => setForm(p => ({ ...p, salePrice: e.target.value }))} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Original Price *</label>
              <input type="number" min="0" value={form.originalPrice} onChange={e => setForm(p => ({ ...p, originalPrice: e.target.value }))} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2"><FiClock size={12} /> Countdown End Date *</label>
            <input type="datetime-local" value={form.countdownEndDate} onChange={e => setForm(p => ({ ...p, countdownEndDate: e.target.value }))} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Button Text</label>
              <input type="text" value={form.buttonText} onChange={e => setForm(p => ({ ...p, buttonText: e.target.value }))} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="e.g. Secure Deal" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Button URL *</label>
              <input type="text" value={form.buttonLink} onChange={e => setForm(p => ({ ...p, buttonLink: e.target.value }))} required className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="e.g. /products/gas-stove" />
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
              {saving ? 'Saving...' : 'Save Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function OfferManager() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchOffers = async () => {
    try {
      const res = await API.get('/homepage-offers');
      setOffers(res.data.offers);
    } catch (err) {
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOffers(); }, []);

  const activeCount = offers.filter(o => o.isActive).length;

  const deleteOffer = async (id) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
      await API.delete(`/admin/offers/${id}`);
      toast.success('Deleted');
      setOffers(prev => prev.filter(o => o._id !== id));
    } catch (err) {
      toast.error('Error deleting');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Limited Time Offers</h1>
          <p className="text-[var(--text-3)] text-sm font-medium mt-1">
            Manage homepage offers. {activeCount}/{MAX_ACTIVE_OFFERS} active.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          disabled={activeCount >= MAX_ACTIVE_OFFERS}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={activeCount >= MAX_ACTIVE_OFFERS ? `Maximum ${MAX_ACTIVE_OFFERS} active offers reached` : ''}
        >
          <FiPlus size={16} /> Add Offer
        </button>
      </div>

      <div className="bg-white border border-[var(--border)]">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-3)]">Loading...</div>
        ) : offers.length === 0 ? (
          <div className="p-16 text-center bg-[var(--bg)]">
            <FiImage size={48} className="mx-auto text-[#CCCCCC] mb-4" />
            <div className="text-[var(--text-3)] text-sm font-medium">No offers found. The homepage offers slider will stay hidden.</div>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E5]">
            {offers.map(o => (
              <div key={o._id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-[var(--bg)] transition-colors">
                <div className="flex items-center gap-6 w-full max-w-xl">
                  <img src={imgSrc(o.image)} alt="" className="w-32 aspect-video object-cover bg-[#E5E5E5] border border-[var(--border)]" />
                  <div className="flex-1">
                    <h3 className="text-[var(--text)] font-bold text-lg leading-none mb-1">{o.title}</h3>
                    <p className="text-[var(--text-3)] text-sm">₹{o.salePrice?.toLocaleString('en-IN')} <span className="line-through text-[var(--text-4)]">₹{o.originalPrice?.toLocaleString('en-IN')}</span></p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${o.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{o.isActive ? 'Active' : 'Inactive'}</span>
                      <span className="text-[var(--text-3)] text-xs font-medium">Order: {o.displayOrder}</span>
                      <span className="text-[var(--text-3)] text-xs font-medium">Ends: {new Date(o.countdownEndDate).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  <button onClick={() => { setEditing(o); setShowForm(true); }} className="p-3 text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[#E5E5E5] transition-colors" title="Edit">
                    <FiEdit2 size={18} />
                  </button>
                  <button onClick={() => deleteOffer(o._id)} className="p-3 text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <OfferForm
          existing={editing}
          activeCount={activeCount}
          onClose={() => setShowForm(false)}
          onSaved={(offer) => {
            if (editing) setOffers(prev => prev.map(m => m._id === offer._id ? offer : m).sort((a, b) => a.displayOrder - b.displayOrder));
            else setOffers(prev => [...prev, offer].sort((a, b) => a.displayOrder - b.displayOrder));
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

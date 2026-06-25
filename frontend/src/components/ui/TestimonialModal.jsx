import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUploadCloud, FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../../services/api';

export default function TestimonialModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', city: '', rating: 5, text: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.rating < 1 || form.rating > 5) return toast.error('Rating must be between 1 and 5');
    if (!form.text.trim()) return toast.error('Review text is required');
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.city.trim()) return toast.error('City is required');

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('city', form.city);
      fd.append('rating', form.rating);
      fd.append('text', form.text);
      if (image) fd.append('image', image);

      const { data } = await API.post('/testimonials', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Thank you! Your story has been posted.');
      if (onSuccess && data.testimonial) onSuccess(data.testimonial);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-[#111111]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white border border-[#E5E5E5] w-[95vw] md:max-w-[700px] lg:max-w-[900px] shadow-2xl animate-fadeInUp flex flex-col max-h-[90vh]">
        
        <div className="p-4 sm:p-6 md:p-8 border-b border-[#E5E5E5] flex items-center justify-between shrink-0">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>Share Your Experience</h2>
          <button type="button" onClick={onClose} className="p-2 text-[#666666] hover:text-[#111111] transition-colors hover:bg-[#F7F6F3]">
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-2">Name</label>
              <input type="text" className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111]" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. John Doe" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-2">City</label>
              <input type="text" className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111]" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="e.g. Mumbai" required />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-2">Rating</label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button type="button" key={star} onClick={() => setForm({...form, rating: star})} className="focus:outline-none transition-transform hover:scale-110">
                  <FiStar size={28} fill={star <= form.rating ? '#FF7A00' : 'transparent'} stroke={star <= form.rating ? '#FF7A00' : '#CCCCCC'} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-widest">Your Review</label>
              <span className={`text-[10px] font-bold tracking-widest ${form.text.length >= 150 ? 'text-amber-600' : 'text-[#666666]'}`}>
                {form.text.length}/150
              </span>
            </div>
            <textarea className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111] min-h-[120px] resize-y" maxLength={150} value={form.text} onChange={e => setForm({...form, text: e.target.value})} placeholder="Tell us what you love about Metro Appliances (max 150 chars)..." required />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-3">Profile Picture (Optional)</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              {preview ? (
                <div className="relative w-20 h-20 bg-[#F7F6F3] border border-[#E5E5E5] shrink-0 p-1">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover mix-blend-multiply" />
                  <button type="button" onClick={() => {setImage(null); setPreview(null);}} className="absolute inset-0 bg-white/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[#111111]">
                    <FiX size={20} />
                  </button>
                </div>
              ) : (
                <label className="w-20 h-20 bg-[#F7F6F3] border border-dashed border-[#CCCCCC] flex flex-col items-center justify-center text-[#666666] hover:text-[#111111] hover:border-[#111111] cursor-pointer transition-colors shrink-0">
                  <FiUploadCloud size={24} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              )}
              <div className="text-[10px] font-medium text-[#666666] uppercase tracking-widest leading-relaxed">
                Upload a clear picture of yourself.<br/>Formats: JPG, PNG. Max size: 2MB.
              </div>
            </div>
          </div>

          <div className="pt-6 sm:pt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 border-t border-[#E5E5E5]">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-8 py-4 border border-[#111111] text-[#111111] text-xs font-bold uppercase tracking-widest hover:bg-[#F7F6F3] transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="w-full sm:w-auto px-8 py-4 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Story'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

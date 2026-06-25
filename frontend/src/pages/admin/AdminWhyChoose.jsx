import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiUpload, FiArrowUp, FiArrowDown, FiX } from 'react-icons/fi';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import { imgSrc } from '../../utils/imageHelper';

export default function AdminWhyChoose() {
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [badge, setBadge] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  
  const [cardTitle, setCardTitle] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [cardImage, setCardImage] = useState(null);
  const [cardImagePreview, setCardImagePreview] = useState('');
  const [cardActive, setCardActive] = useState(true);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await API.get('/why-choose');
      setSection(data);
      setBadge(data.sectionBadge || '');
      setTitle(data.sectionTitle || '');
      setDescription(data.sectionDescription || '');
    } catch (err) {
      toast.error('Failed to load Why Choose section');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSubmitting(true);
      await API.put('/admin/why-choose', {
        sectionBadge: badge,
        sectionTitle: title,
        sectionDescription: description
      });
      toast.success('Settings updated');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  const openCardModal = (card = null) => {
    if (card) {
      setEditingCard(card);
      setCardTitle(card.title);
      setCardDesc(card.description);
      setCardActive(card.isActive);
      setCardImage(null);
      setCardImagePreview(card.image?.url || '');
    } else {
      setEditingCard(null);
      setCardTitle('');
      setCardDesc('');
      setCardActive(true);
      setCardImage(null);
      setCardImagePreview('');
    }
    setIsModalOpen(true);
  };

  const closeCardModal = () => {
    setIsModalOpen(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return toast.error('Image must be less than 5MB');
      }
      setCardImage(file);
      setCardImagePreview(URL.createObjectURL(file));
    }
  };

  const saveCard = async (e) => {
    e.preventDefault();
    if (!cardTitle || !cardDesc) return toast.error('Title and description are required');
    if (!editingCard && !cardImage) return toast.error('Image is required');

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('title', cardTitle);
      fd.append('description', cardDesc);
      fd.append('isActive', cardActive);
      if (cardImage) fd.append('image', cardImage);

      if (editingCard) {
        await API.put(`/admin/why-choose/cards/${editingCard._id}`, fd);
        toast.success('Card updated');
      } else {
        await API.post('/admin/why-choose/cards', fd);
        toast.success('Card created');
      }
      closeCardModal();
      fetchData();
    } catch (err) {
      toast.error('Failed to save card');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCard = async (id) => {
    if (!window.confirm('Delete this feature card?')) return;
    try {
      await API.delete(`/admin/why-choose/cards/${id}`);
      toast.success('Card deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete card');
    }
  };

  const moveCard = async (index, direction) => {
    if (!section?.cards) return;
    const newCards = [...section.cards];
    if (direction === 'up' && index > 0) {
      [newCards[index - 1], newCards[index]] = [newCards[index], newCards[index - 1]];
    } else if (direction === 'down' && index < newCards.length - 1) {
      [newCards[index + 1], newCards[index]] = [newCards[index], newCards[index + 1]];
    } else {
      return;
    }
    
    setSection({ ...section, cards: newCards });
    
    try {
      await API.put('/admin/why-choose/cards/reorder', {
        orderedIds: newCards.map(c => c._id)
      });
    } catch (err) {
      toast.error('Failed to reorder');
      fetchData();
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="h-64 bg-white border border-[#E5E5E5] animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>Why Choose Metro</h1>
        </div>

        <div className="bg-white border border-[#E5E5E5] p-8">
          <h2 className="text-xl font-bold text-[#111111] mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Section Settings</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">Section Badge</label>
              <input value={badge} onChange={e => setBadge(e.target.value)} className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="e.g. THE METRO PROMISE" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">Section Heading</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="e.g. Why Choose Metro" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">Section Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111] min-h-[100px] resize-none" placeholder="Brief description..." />
            </div>
            <button onClick={saveSettings} disabled={submitting} className="flex items-center gap-2 px-8 py-4 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50">
              <FiSave size={16} /> Save Settings
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E5] p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>Feature Cards</h2>
            <button onClick={() => openCardModal()} className="flex items-center gap-2 px-6 py-3 border border-[#111111] text-[#111111] text-[10px] font-bold uppercase tracking-widest hover:bg-[#F7F6F3] transition-colors">
              <FiPlus size={14} /> Add Feature
            </button>
          </div>

          <div className="space-y-4">
            {section?.cards?.sort((a,b) => a.order - b.order).map((card, index) => (
              <div key={card._id} className="flex items-center gap-6 p-6 bg-[#F7F6F3] border border-[#E5E5E5]">
                <div className="flex flex-col gap-2 text-[#666666]">
                  <button onClick={() => moveCard(index, 'up')} disabled={index === 0} className="p-1 hover:text-[#111111] disabled:opacity-30"><FiArrowUp size={16} /></button>
                  <button onClick={() => moveCard(index, 'down')} disabled={index === section.cards.length - 1} className="p-1 hover:text-[#111111] disabled:opacity-30"><FiArrowDown size={16} /></button>
                </div>

                <div className="w-32 h-20 bg-white border border-[#E5E5E5] flex-shrink-0 flex items-center justify-center p-2">
                  {card.image ? (
                    <img src={imgSrc(card.image)} alt={card.title} className="w-full h-full object-contain mix-blend-multiply" />
                  ) : (
                    <span className="text-[#CCCCCC] text-[10px]">No Image</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-[#111111] truncate">{card.title}</h3>
                    {!card.isActive && <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-widest">Inactive</span>}
                  </div>
                  <p className="text-sm text-[#666666] truncate">{card.description}</p>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => openCardModal(card)} className="px-4 py-2 border border-[#E5E5E5] text-[#111111] hover:bg-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                    <FiEdit2 size={12} /> Edit
                  </button>
                  <button onClick={() => deleteCard(card._id)} className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                    <FiTrash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
            {(!section?.cards || section?.cards?.length === 0) && (
              <div className="text-center py-16 text-[#666666] bg-[#F7F6F3] border border-[#E5E5E5]">No feature cards added yet.</div>
            )}
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#111111]/80 flex items-center justify-center p-4">
            <div className="bg-white border border-[#E5E5E5] w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E5E5E5]">
                <h2 className="text-xl font-bold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>{editingCard ? 'Edit Feature Card' : 'Add Feature Card'}</h2>
                <button onClick={closeCardModal} className="text-[#666666] hover:text-[#111111]"><FiX size={24} /></button>
              </div>
              <form onSubmit={saveCard} className="space-y-6">
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-3">Feature Image (16:9 Ratio)</label>
                  <div className="flex gap-6 items-start">
                    {cardImagePreview ? (
                      <div className="w-48 aspect-video bg-[#F7F6F3] border border-[#E5E5E5] p-2 flex-shrink-0">
                        <img src={cardImagePreview} alt="Preview" className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                    ) : (
                      <div className="w-48 aspect-video bg-[#F7F6F3] border border-[#E5E5E5] flex flex-col items-center justify-center text-[#666666] flex-shrink-0">
                        <FiUpload size={24} className="mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">No image</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <input type="file" id="cardImage" accept="image/jpeg, image/png, image/webp" onChange={handleImageChange} className="hidden" />
                      <label htmlFor="cardImage" className="flex items-center gap-2 px-6 py-3 border border-[#111111] text-[#111111] text-[10px] font-bold uppercase tracking-widest hover:bg-[#111111] hover:text-white transition-colors cursor-pointer w-max">
                        <FiUpload size={14} /> Choose Image
                      </label>
                      <p className="text-xs text-[#666666] mt-4 font-medium leading-relaxed">Accepted: JPG, PNG, WEBP. Max 5MB.<br/>Recommended ratio: 16:9</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">Title</label>
                  <input value={cardTitle} onChange={e => setCardTitle(e.target.value)} className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="e.g. Free Delivery" required />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">Description</label>
                  <textarea value={cardDesc} onChange={e => setCardDesc(e.target.value)} className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111] min-h-[100px] resize-none" placeholder="Feature description..." required />
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input type="checkbox" id="isActive" checked={cardActive} onChange={e => setCardActive(e.target.checked)} className="w-4 h-4 text-[#111111] bg-white border-[#E5E5E5] rounded focus:ring-[#111111]" />
                  <label htmlFor="isActive" className="text-sm font-bold text-[#111111] uppercase tracking-widest cursor-pointer">Active</label>
                </div>

                <div className="flex items-center gap-4 pt-8 border-t border-[#E5E5E5]">
                  <button type="button" onClick={closeCardModal} className="w-1/3 py-4 border border-[#111111] text-[#111111] text-xs font-bold uppercase tracking-widest hover:bg-[#F7F6F3] transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="w-2/3 py-4 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Save Card'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

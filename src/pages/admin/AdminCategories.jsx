import React, { useEffect, useState, useCallback, useRef } from 'react';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import useAdminSocket from '../../hooks/useAdminSocket';
import { toast } from 'react-toastify';
import { imgSrc } from '../../utils/imageHelper';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUpload,
  FiList, FiToggleLeft, FiToggleRight, FiRefreshCw,
} from 'react-icons/fi';

const BLANK = {
  name: '', description: '', sortOrder: 0, isActive: true,
};

function CategoryModal({ category, onClose, onSaved }) {
  const [form, setForm] = useState(category ? {
    name:        category.name        || '',
    description: category.description || '',
    sortOrder:   category.sortOrder   ?? 0,
    isActive:    category.isActive    ?? true,
  } : BLANK);
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(category?.image ? imgSrc({ url: category.image }) : '');
  const [saving,       setSaving]       = useState(false);
  const fileRef      = useRef(null);
  const inFlightRef  = useRef(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (!form.name.trim()) {
      inFlightRef.current = false;
      return toast.error('Category name is required');
    }

    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);

      let data;
      if (category) {
        ({ data } = await API.put(`/categories/${category._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }));
      } else {
        ({ data } = await API.post('/categories', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }));
      }

      onSaved(data.category, !!category);
      onClose();
      toast.success(`Category ${category ? 'updated' : 'created'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
      inFlightRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--text)]/80">
      <div className="w-full max-w-lg bg-white border border-[var(--border)] shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>{category ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors"><FiX size={20} /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-6">

          {/* Image upload */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-3">Category Image</label>
            <div className="flex items-center gap-6">
              <div
                className="w-24 h-24 bg-[var(--bg)] border border-[var(--border)] flex flex-col items-center justify-center text-[var(--text-3)] cursor-pointer hover:border-[#111111] hover:text-[var(--text)] transition-colors"
                onClick={() => fileRef.current?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <FiUpload size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-widest mt-2">Upload</span>
                  </>
                )}
              </div>
              <div>
                <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-[#111111] text-[var(--text)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--text)] hover:text-white transition-colors">
                  <FiUpload size={14} /> {imageFile ? 'Change Image' : 'Upload Image'}
                </button>
                {imageFile && <p className="text-[var(--text-3)] text-xs font-medium mt-2 truncate max-w-[180px]">{imageFile.name}</p>}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
              placeholder="e.g. Refrigerators"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111] resize-none h-24"
              placeholder="Short description…"
            />
          </div>

          {/* Sort Order + Active */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
                min={0}
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Status</label>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                className={`flex items-center gap-2 px-4 py-3 border text-sm font-bold uppercase tracking-widest transition-colors w-full justify-center ${
                  form.isActive
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-3)]'
                }`}>
                {form.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                {form.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-[var(--border)]">
            <button type="button" onClick={onClose} className="w-1/3 py-4 border border-[#111111] text-[var(--text)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--bg)] transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="w-2/3 py-4 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50 flex items-center justify-center">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Saving…</>
                : category ? 'Save Changes' : 'Create Category'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [deleting,   setDeleting]   = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/categories/all');
      setCategories(data.categories || []);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useAdminSocket({
    'category:created': (data) => {
      if (!data?.category?._id) return;
      setCategories(prev => {
        if (prev.some(c => c._id === data.category._id)) return prev;
        return [data.category, ...prev];
      });
    },
    'category:updated': (data) => {
      if (!data?.category?._id) return;
      setCategories(prev => prev.map(c => c._id === data.category._id ? data.category : c));
    },
    'category:deleted': (data) => {
      if (!data?.categoryId) return;
      setCategories(prev => prev.filter(c => c._id !== data.categoryId));
    },
  });

  const filtered = categories.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaved = (category, isEdit) => {
    if (isEdit) {
      setCategories(prev => prev.map(c => c._id === category._id ? category : c));
    } else {
      setCategories(prev => {
        if (prev.some(c => c._id === category._id)) return prev;
        return [category, ...prev];
      });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    try {
      setDeleting(id);
      await API.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c._id !== id));
      toast.success('Category deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const toggleActive = async (cat) => {
    try {
      const fd = new FormData();
      fd.append('isActive', !cat.isActive);
      const { data } = await API.put(`/categories/${cat._id}`, fd);
      setCategories(prev => prev.map(c => c._id === cat._id ? data.category : c));
    } catch { toast.error('Failed to update category'); }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Categories</h1>
            <p className="text-[var(--text-3)] text-sm font-medium mt-1">{categories.length} categories</p>
          </div>
          <div className="flex gap-4">
            <button onClick={fetchCategories} className="flex items-center gap-2 px-6 py-3 bg-white border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase tracking-widest hover:border-[#111111] transition-colors">
              <FiRefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => { setEditing(null); setModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">
              <FiPlus size={16} /> New Category
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
          <input
            type="text"
            placeholder="Search categories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-[var(--border)] text-sm outline-none focus:border-[#111111]"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="animate-pulse h-64 bg-white border border-[var(--border)]" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white border border-[var(--border)]">
            <FiList size={48} className="mx-auto text-[#CCCCCC] mb-6" />
            <p className="text-[var(--text-3)] font-medium text-sm">No categories found</p>
            <button onClick={() => { setEditing(null); setModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors mt-6 mx-auto">
              <FiPlus size={14} /> Create First Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(cat => (
              <div key={cat._id} className="bg-white border border-[var(--border)] group flex flex-col">

                {/* Category Image */}
                <div className="relative h-48 overflow-hidden bg-[var(--bg)] flex-shrink-0">
                  {cat.image ? (
                    <img
                      src={imgSrc({ url: cat.image })}
                      alt={cat.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#CCCCCC]">
                      <FiList size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 border ${
                      cat.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white border border-[var(--border)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text)]">
                    {cat.productCount || 0} products
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-[var(--text)] font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>{cat.name}</h3>
                    <span className="text-[var(--text-3)] text-xs font-bold uppercase tracking-widest">#{cat.sortOrder}</span>
                  </div>
                  {cat.description && (
                    <p className="text-[var(--text-3)] text-sm line-clamp-2 mb-6 flex-1">{cat.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-auto">
                    <button
                      onClick={() => { setEditing(cat); setModal(true); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 border border-[var(--border)] text-[var(--text)] text-[10px] font-bold uppercase tracking-widest hover:border-[#111111] transition-colors">
                      <FiEdit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => toggleActive(cat)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 border text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        cat.isActive ? 'border-green-600 text-green-700 hover:bg-green-50' : 'border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg)]'
                      }`}>
                      {cat.isActive ? <FiToggleRight size={14} /> : <FiToggleLeft size={14} />}
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id, cat.name)}
                      disabled={deleting === cat._id}
                      className="p-3 text-[var(--text-3)] hover:text-red-600 hover:bg-red-50 border border-[var(--border)] hover:border-red-200 transition-colors disabled:opacity-50">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <CategoryModal
          category={editing}
          onClose={() => { setModal(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </AdminLayout>
  );
}

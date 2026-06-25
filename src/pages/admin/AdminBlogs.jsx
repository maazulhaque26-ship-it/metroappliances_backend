import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import ImageUploader from '../../components/ui/ImageUploader';
import RichTextEditor from '../../components/ui/RichTextEditor';
import {
  FiTrash2, FiEdit2, FiPlus, FiX, FiImage,
  FiToggleLeft, FiToggleRight, FiSearch, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { imgSrc } from '../../utils/imageHelper';

const PAGE_SIZE = 12;

function makeSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const BLANK = { title: '', slug: '', description: '', excerpt: '', content: '', isActive: true };

function BlogForm({ existing, onClose, onSaved }) {
  const [form, setForm] = useState(existing ? {
    title:       existing.title,
    slug:        existing.slug || '',
    description: existing.description,
    excerpt:     existing.excerpt || '',
    content:     existing.content  || '',
    isActive:    existing.isActive,
  } : BLANK);
  const [imageData,  setImageData]  = useState(existing?.image ? [existing.image] : []);
  const [saving,     setSaving]     = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [activeTab,  setActiveTab]  = useState('basic'); // 'basic' | 'content'

  const handleTitleChange = (val) => {
    setForm(p => ({ ...p, title: val, slug: slugEdited ? p.slug : makeSlug(val) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!existing && imageData.length === 0) return toast.error('Please upload a cover image');
    if (!form.title.trim())       return toast.error('Title is required');
    if (!form.description.trim()) return toast.error('Description is required');
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('title',       form.title.trim());
      fd.append('slug',        form.slug.trim());
      fd.append('description', form.description.trim());
      fd.append('excerpt',     form.excerpt.trim());
      fd.append('content',     form.content);
      fd.append('isActive',    String(form.isActive));

      const img = imageData[0];
      if (img && typeof img === 'object' && img.file) fd.append('image', img.file);

      const url    = existing?._id ? `/admin/blogs/${existing._id}` : '/admin/blogs';
      const method = existing?._id ? 'put' : 'post';
      const res    = await API[method](url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(existing ? 'Blog updated' : 'Blog created');
      onSaved(res.data.blog);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving blog');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white border border-[var(--border)] w-full max-w-3xl relative flex flex-col" style={{ maxHeight: '92vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="text-xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>
            {existing ? 'Edit Blog Post' : 'New Blog Post'}
          </h2>
          <button onClick={onClose} className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
            <FiX size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] flex-shrink-0">
          {[['basic', 'Basic Info'], ['content', 'Rich Content']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                activeTab === id
                  ? 'text-[var(--text)] border-b-2 border-[#FF7A00]'
                  : 'text-[var(--text-3)] hover:text-[var(--text)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 sm:px-8 py-6">

            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Cover Image</label>
                  <ImageUploader value={imageData} onChange={setImageData} maxCount={1} label="Upload Cover Image" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Title *</label>
                  <input
                    type="text" required
                    value={form.title}
                    onChange={e => handleTitleChange(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
                    placeholder="e.g. 5 Tips for Choosing the Right Kitchen Appliance"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">
                    Slug <span className="normal-case font-normal text-[var(--text-4)]">(auto-generated, editable)</span>
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => { setSlugEdited(true); setForm(p => ({ ...p, slug: e.target.value })); }}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111] font-mono"
                    placeholder="e.g. 5-tips-kitchen-appliance"
                  />
                  <p className="text-[10px] text-[var(--text-4)] mt-1">URL: /blog/<strong>{form.slug || 'your-slug'}</strong></p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">
                    Excerpt <span className="normal-case font-normal text-[var(--text-4)]">(shown on cards — 180 chars max)</span>
                  </label>
                  <textarea
                    rows={3} maxLength={300}
                    value={form.excerpt}
                    onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111] resize-none"
                    placeholder="Short summary shown in blog card previews…"
                  />
                  <p className="text-[10px] text-[var(--text-4)] mt-1">{form.excerpt.length} / 300 characters</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">
                    Description * <span className="normal-case font-normal text-[var(--text-4)]">(fallback if no rich content)</span>
                  </label>
                  <textarea
                    required rows={5} maxLength={2000}
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111] resize-none"
                    placeholder="Plain-text description shown if no rich content is added…"
                  />
                  <p className="text-[10px] text-[var(--text-4)] mt-1">{form.description.length} / 2000 characters</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Status</label>
                  <select
                    value={String(form.isActive)}
                    onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
                  >
                    <option value="true">Published — visible on About page</option>
                    <option value="false">Draft — hidden</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#FFF8F3] border border-[#FFD4AA] text-xs text-[#8B4513]">
                  Rich content overrides the plain description on the blog detail page.
                  Use the toolbar to format text, add headings, lists and blockquotes.
                </div>
                <RichTextEditor
                  value={form.content}
                  onChange={html => setForm(p => ({ ...p, content: html }))}
                  placeholder="Write rich blog content here…"
                  minHeight={380}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 sm:px-8 py-4 border-t border-[var(--border)] flex-shrink-0">
            <button type="button" onClick={onClose}
              className="px-6 py-3 border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--bg)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : existing ? 'Update Post' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBlogs() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all'); // 'all' | 'published' | 'draft'
  const [page,     setPage]     = useState(1);

  const fetchItems = async () => {
    try {
      const res = await API.get('/admin/blogs');
      setItems(res.data.blogs);
    } catch { toast.error('Failed to load blogs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  // Reset to page 1 when search/filter changes
  useEffect(() => { setPage(1); }, [search, filter]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filter === 'published') list = list.filter(b => b.isActive);
    if (filter === 'draft')     list = list.filter(b => !b.isActive);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(b => b.title?.toLowerCase().includes(q) || b.slug?.toLowerCase().includes(q));
    }
    return list;
  }, [items, filter, search]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSaved = (blog) => {
    setItems(prev => {
      const exists = prev.find(b => b._id === blog._id);
      return exists ? prev.map(b => b._id === blog._id ? blog : b) : [blog, ...prev];
    });
    setShowForm(false);
  };

  const toggleItem = async (id) => {
    try {
      const res = await API.put(`/admin/blogs/${id}/toggle`);
      setItems(prev => prev.map(b => b._id === id ? res.data.blog : b));
    } catch { toast.error('Error updating status'); }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this blog post?')) return;
    try {
      await API.delete(`/admin/blogs/${id}`);
      toast.success('Deleted');
      setItems(prev => prev.filter(b => b._id !== id));
    } catch { toast.error('Error deleting'); }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Blog Posts</h1>
            <p className="text-[var(--text-3)] text-sm font-medium mt-1">
              {items.length} posts total · {items.filter(b => b.isActive).length} published
            </p>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">
            <FiPlus size={15} /> New Blog Post
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or slug…"
              className="w-full pl-10 pr-4 py-3 bg-white border border-[var(--border)] text-sm outline-none focus:border-[#111111]"
            />
          </div>
          <div className="flex gap-2">
            {[['all', 'All'], ['published', 'Published'], ['draft', 'Drafts']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest border transition-colors ${
                  filter === val
                    ? 'bg-[var(--text)] text-white border-[var(--text)]'
                    : 'bg-white text-[var(--text-3)] border-[var(--border)] hover:border-[var(--text)] hover:text-[var(--text)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[var(--border)]">
          {loading ? (
            <div className="p-10 text-center text-[var(--text-3)] text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center bg-[var(--bg)]">
              <FiImage size={48} className="mx-auto text-[#CCCCCC] mb-4" />
              <p className="text-[var(--text-3)] text-sm font-medium">
                {search || filter !== 'all' ? 'No posts match your filters.' : 'No blog posts yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {paginated.map(item => (
                <div key={item._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg)] transition-colors">
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="w-24 h-16 flex-shrink-0 bg-[var(--bg)] border border-[var(--border)] overflow-hidden">
                      {item.image
                        ? <img src={imgSrc(item.image)} alt={item.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><FiImage size={20} className="text-[#CCCCCC]" /></div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--text)] text-sm leading-tight truncate">{item.title}</p>
                      <p className="text-[var(--text-4)] text-[10px] font-mono mt-0.5 truncate">/blog/{item.slug}</p>
                      <p className="text-[var(--text-3)] text-xs mt-1 line-clamp-1 max-w-xs">
                        {(item.excerpt || item.description)?.substring(0, 100)}
                        {(item.excerpt || item.description)?.length > 100 ? '…' : ''}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                          item.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {item.isActive ? 'Published' : 'Draft'}
                        </span>
                        {item.content && (
                          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border bg-blue-50 text-blue-700 border-blue-200">
                            Rich Content
                          </span>
                        )}
                        <span className="text-[var(--text-4)] text-[10px]">
                          {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggleItem(item._id)}
                      className={`p-2.5 transition-colors ${item.isActive ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}`}
                      title={item.isActive ? 'Unpublish' : 'Publish'}>
                      {item.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                    </button>
                    <button onClick={() => { setEditing(item); setShowForm(true); }}
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
        <BlogForm existing={editing} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </AdminLayout>
  );
}

import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, publishAnnouncement } from '../../services/performanceAPI';
import { FiPlus, FiEdit2, FiTrash2, FiSend } from 'react-icons/fi';

const BLANK = { title: '', content: '', priority: 'normal', targetAudience: 'all' };

const priorityBadge = (p) => {
  const map = { urgent: 'bg-red-100 text-red-800', high: 'bg-yellow-100 text-yellow-800', normal: 'bg-blue-100 text-blue-800', low: 'bg-gray-100 text-gray-600' };
  return map[p] || map.normal;
};

export default function AdminPerformanceAnnouncements() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(BLANK);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);

  const load = () => {
    setLoading(true);
    fetchAnnouncements({ limit: 50 })
      .then(r => setItems(r.data.data || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(BLANK); setEditId(null); setModal(true); };
  const openEdit   = (a) => { setForm({ title: a.title, content: a.content || '', priority: a.priority, targetAudience: a.targetAudience }); setEditId(a._id); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) await updateAnnouncement(editId, form);
      else await createAnnouncement(form);
      setModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handlePublish = async (id) => {
    try { await publishAnnouncement(id); load(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try { await deleteAnnouncement(id); load(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HR Announcements</h1>
            <p className="text-sm text-gray-500 mt-1">Create and publish employee announcements</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <FiPlus size={16} /> New Announcement
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center py-10">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-400 text-center py-10">No announcements yet.</p>
        ) : (
          <div className="space-y-4">
            {items.map(a => (
              <div key={a._id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityBadge(a.priority)}`}>{a.priority}</span>
                      {a.isPublished && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">Published</span>}
                    </div>
                    {a.content && <p className="text-sm text-gray-600 line-clamp-2">{a.content}</p>}
                    <p className="text-xs text-gray-400 mt-2">{a.annCode} · {a.targetAudience} · {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!a.isPublished && (
                      <button onClick={() => handlePublish(a._id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Publish">
                        <FiSend size={16} />
                      </button>
                    )}
                    <button onClick={() => openEdit(a)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><FiEdit2 size={16} /></button>
                    <button onClick={() => handleDelete(a._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {modal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{editId ? 'Edit' : 'New'} Announcement</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                    <select value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="all">All Employees</option>
                      <option value="department">Department</option>
                      <option value="designation">Designation</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

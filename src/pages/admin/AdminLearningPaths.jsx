import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchLearningPaths, createLearningPath, updateLearningPath, deleteLearningPath, fetchCourses } from '../../services/performanceAPI';
import { FiPlus, FiX, FiEdit2, FiTrash } from 'react-icons/fi';

const BLANK = { name: '', description: '', courses: [], isActive: true, estimatedDuration: '' };

export default function AdminLearningPaths() {
  const [paths, setPaths]       = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({ ...BLANK });
  const [saving, setSaving]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchLearningPaths({ limit: 100 }),
      fetchCourses({ limit: 200 }),
    ])
      .then(([lp, cr]) => {
        setPaths(lp.data.data || lp.data.paths || []);
        setAllCourses(cr.data.data || cr.data.courses || []);
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ ...BLANK }); setModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', courses: (p.courses || []).map(c => c._id || c), isActive: p.isActive !== false, estimatedDuration: p.estimatedDuration || '' });
    setModal(true);
  };

  const set = k => e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [k]: val }));
  };

  const toggleCourse = (id) => {
    setForm(p => ({
      ...p,
      courses: p.courses.includes(id) ? p.courses.filter(c => c !== id) : [...p.courses, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) await updateLearningPath(editing._id, form);
      else await createLearningPath(form);
      setModal(false);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this learning path?')) return;
    try { await deleteLearningPath(id); load(); } catch { alert('Failed to delete'); }
  };

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learning Paths</h1>
            <p className="text-sm text-gray-500 mt-1">{paths.length} learning paths</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <FiPlus size={15} /> Create Path
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Code', 'Name', 'Courses', 'Est. Duration', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paths.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No learning paths yet</td></tr>
              ) : paths.map(p => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.lpCode || p.code || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{(p.courses || []).length}</td>
                  <td className="px-4 py-3 text-gray-600">{p.estimatedDuration ? `${p.estimatedDuration} hrs` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-indigo-600" title="Edit"><FiEdit2 size={14} /></button>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 text-gray-400 hover:text-red-500" title="Delete"><FiTrash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit' : 'Create'} Learning Path</h2>
              <button onClick={() => setModal(false)}><FiX size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Name *</label>
                <input value={form.name} onChange={set('name')} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Path name" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Estimated Duration (hours)</label>
                <input type="number" value={form.estimatedDuration} onChange={set('estimatedDuration')} min={0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Courses</label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {allCourses.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No courses available</p>}
                  {allCourses.map(c => (
                    <label key={c._id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={form.courses.includes(c._id)} onChange={() => toggleCourse(c._id)} className="accent-indigo-600" />
                      <span className="text-sm text-gray-700">{c.title}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="accent-indigo-600" />
                Active
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving…' : editing ? 'Update Path' : 'Create Path'}
                </button>
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

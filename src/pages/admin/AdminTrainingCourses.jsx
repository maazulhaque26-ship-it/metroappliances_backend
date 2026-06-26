import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchCourses, createCourse, deleteCourse, fetchSessions, createSession } from '../../services/performanceAPI';
import { FiPlus, FiX, FiTrash } from 'react-icons/fi';

const BLANK_COURSE = { title: '', courseCode: '', mode: 'online', level: 'beginner', duration: 1, maxEnrollments: 20, description: '' };
const BLANK_SESSION = { course: '', startDate: '', endDate: '', venue: '', trainer: '', maxParticipants: 20 };
const MODES   = ['online', 'offline', 'hybrid'];
const LEVELS  = ['beginner', 'intermediate', 'advanced'];

export default function AdminTrainingCourses() {
  const [courses, setCourses]     = useState([]);
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [tab, setTab]             = useState('courses');
  const [modal, setModal]         = useState(false);
  const [sesModal, setSesModal]   = useState(false);
  const [form, setForm]           = useState({ ...BLANK_COURSE });
  const [sesForm, setSesForm]     = useState({ ...BLANK_SESSION });
  const [saving, setSaving]       = useState(false);
  const [sesSaving, setSesSaving] = useState(false);
  const [sesLoading, setSesLoading] = useState(false);

  const loadCourses = useCallback(() => {
    setLoading(true);
    fetchCourses({ limit: 100 })
      .then(r => setCourses(r.data.data || r.data.courses || []))
      .catch(e => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const loadSessions = useCallback(() => {
    setSesLoading(true);
    fetchSessions({ limit: 100 })
      .then(r => setSessions(r.data.data || r.data.sessions || []))
      .catch(() => {})
      .finally(() => setSesLoading(false));
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { if (tab === 'sessions') loadSessions(); }, [tab, loadSessions]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setSes = k => e => setSesForm(p => ({ ...p, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await createCourse(form);
      setModal(false);
      loadCourses();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try { await deleteCourse(id); loadCourses(); } catch { alert('Failed to delete'); }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      setSesSaving(true);
      await createSession(sesForm);
      setSesModal(false);
      loadSessions();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSesSaving(false); }
  };

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Training Courses</h1>
            <p className="text-sm text-gray-500 mt-1">Manage training catalog and sessions</p>
          </div>
          <button
            onClick={() => tab === 'courses' ? (setForm({ ...BLANK_COURSE }), setModal(true)) : (setSesForm({ ...BLANK_SESSION }), setSesModal(true))}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <FiPlus size={15} /> {tab === 'courses' ? 'Add Course' : 'Add Session'}
          </button>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {[['courses', 'Courses'], ['sessions', 'Sessions']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'courses' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Code', 'Title', 'Mode', 'Level', 'Duration (hrs)', 'Max Enrollments', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No courses yet</td></tr>
                ) : courses.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.courseCode || c.code || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.title}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{c.mode || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{c.level || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.duration ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.maxEnrollments ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(c._id)} className="p-1.5 text-gray-400 hover:text-red-500" title="Delete"><FiTrash size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'sessions' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {sesLoading ? (
              <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Course', 'Start Date', 'End Date', 'Venue', 'Trainer', 'Max Participants'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sessions.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No sessions yet</td></tr>
                  ) : sessions.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{s.course?.title || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{s.startDate ? new Date(s.startDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{s.endDate ? new Date(s.endDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{s.venue || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{s.trainer?.name || s.trainer || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{s.maxParticipants ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Course</h2>
              <button onClick={() => setModal(false)}><FiX size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Title *</label>
                <input value={form.title} onChange={set('title')} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Course title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Mode</label>
                  <select value={form.mode} onChange={set('mode')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    {MODES.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Level</label>
                  <select value={form.level} onChange={set('level')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    {LEVELS.map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Duration (hours)</label>
                  <input type="number" value={form.duration} onChange={set('duration')} min={1} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Max Enrollments</label>
                  <input type="number" value={form.maxEnrollments} onChange={set('maxEnrollments')} min={1} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Create Course'}
                </button>
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Session</h2>
              <button onClick={() => setSesModal(false)}><FiX size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Course *</label>
                <select value={sesForm.course} onChange={setSes('course')} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Start Date *</label>
                  <input type="date" value={sesForm.startDate} onChange={setSes('startDate')} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">End Date</label>
                  <input type="date" value={sesForm.endDate} onChange={setSes('endDate')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Venue</label>
                <input value={sesForm.venue} onChange={setSes('venue')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Location or URL" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Max Participants</label>
                <input type="number" value={sesForm.maxParticipants} onChange={setSes('maxParticipants')} min={1} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={sesSaving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {sesSaving ? 'Saving…' : 'Create Session'}
                </button>
                <button type="button" onClick={() => setSesModal(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

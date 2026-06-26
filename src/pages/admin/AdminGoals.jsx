import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchGoals, createGoal, approveGoal, deleteGoal, fetchGoalCategories, fetchCycles } from '../../services/performanceAPI';
import { fetchEmployees } from '../../services/hrmsAPI';
import { FiPlus, FiX, FiCheckCircle, FiTrash, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-blue-100 text-blue-700',
  achieved: 'bg-green-100 text-green-700',
  partially_achieved: 'bg-yellow-100 text-yellow-700',
  not_achieved: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const BLANK = { employee: '', title: '', description: '', category: '', cycle: '', targetDate: '', weightage: 10, type: 'individual' };

export default function AdminGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cycles, setCycles] = useState([]);

  const limit = 15;

  const load = useCallback(() => {
    setLoading(true);
    fetchGoals({ page, limit })
      .then(r => { setGoals(r.data.data || r.data.goals || []); setTotal(r.data.total || 0); })
      .catch(e => setError(e.response?.data?.message || 'Failed to load goals'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openModal = () => {
    setForm({ ...BLANK });
    setModal(true);
    if (!employees.length) fetchEmployees({ limit: 200 }).then(r => setEmployees(r.data.data || r.data.employees || []));
    if (!categories.length) fetchGoalCategories().then(r => setCategories(r.data.data || r.data.categories || []));
    if (!cycles.length) fetchCycles({ limit: 50 }).then(r => setCycles(r.data.data || r.data.cycles || []));
  };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await createGoal(form);
      setModal(false);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try { await approveGoal(id); load(); } catch { alert('Failed to approve'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try { await deleteGoal(id); load(); } catch { alert('Failed to delete'); }
  };

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
            <p className="text-sm text-gray-500 mt-1">{total} goals total</p>
          </div>
          <button onClick={openModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <FiPlus size={15} /> Add Goal
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Employee', 'Title', 'Category', 'Cycle', 'Progress', 'Status', 'Target Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {goals.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-400">No goals found</td></tr>
              ) : goals.map((g, i) => (
                <tr key={g._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{(page - 1) * limit + i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{g.employee?.name || g.employee?.firstName || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">{g.title}</td>
                  <td className="px-4 py-3 text-gray-500">{g.category?.name || g.category || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{g.cycle?.name || g.cycle || '—'}</td>
                  <td className="px-4 py-3 w-36">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${g.progressPercent || 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{g.progressPercent || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[g.status] || 'bg-gray-100 text-gray-600'}`}>
                      {(g.status || '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{g.targetDate ? new Date(g.targetDate).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!g.isApproved && (
                        <button onClick={() => handleApprove(g._id)} className="p-1.5 text-green-600 hover:text-green-800" title="Approve"><FiCheckCircle size={15} /></button>
                      )}
                      <button onClick={() => handleDelete(g._id)} className="p-1.5 text-gray-400 hover:text-red-500" title="Delete"><FiTrash size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><FiChevronLeft size={14} /></button>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><FiChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Goal</h2>
              <button onClick={() => setModal(false)}><FiX size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Employee</label>
                <select value={form.employee} onChange={set('employee')} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.name || `${e.firstName} ${e.lastName}`}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Title</label>
                <input value={form.title} onChange={set('title')} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Goal title" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
                  <select value={form.category} onChange={set('category')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Cycle</label>
                  <select value={form.cycle} onChange={set('cycle')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select Cycle</option>
                    {cycles.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Target Date</label>
                  <input type="date" value={form.targetDate} onChange={set('targetDate')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Weightage (%)</label>
                  <input type="number" value={form.weightage} onChange={set('weightage')} min={0} max={100} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
                <select value={form.type} onChange={set('type')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="individual">Individual</option>
                  <option value="team">Team</option>
                  <option value="department">Department</option>
                  <option value="organizational">Organizational</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Create Goal'}
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

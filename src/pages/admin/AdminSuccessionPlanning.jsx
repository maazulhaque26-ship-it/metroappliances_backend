import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchSuccessionPlans, createSuccessionPlan } from '../../services/performanceAPI';
import { fetchEmployees } from '../../services/hrmsAPI';
import { FiPlus, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const READINESS = ['ready_now', 'ready_1_2_years', 'ready_3_5_years', 'needs_development'];
const BLANK = { position: '', department: '', successors: [] };

export default function AdminSuccessionPlanning() {
  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [expanded, setExpanded]   = useState({});
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({ ...BLANK });
  const [saving, setSaving]       = useState(false);
  const [employees, setEmployees] = useState([]);
  const [successorRow, setSuccessorRow] = useState({ employee: '', readinessLevel: 'ready_1_2_years' });

  const load = useCallback(() => {
    setLoading(true);
    fetchSuccessionPlans({ limit: 100 })
      .then(r => setPlans(r.data.data || r.data.plans || []))
      .catch(e => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = () => {
    setForm({ ...BLANK });
    setModal(true);
    if (!employees.length) fetchEmployees({ limit: 200 }).then(r => setEmployees(r.data.data || r.data.employees || []));
  };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const addSuccessor = () => {
    if (!successorRow.employee) return;
    setForm(p => ({ ...p, successors: [...p.successors, { ...successorRow }] }));
    setSuccessorRow({ employee: '', readinessLevel: 'ready_1_2_years' });
  };

  const removeSuccessor = (idx) => {
    setForm(p => ({ ...p, successors: p.successors.filter((_, i) => i !== idx) }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await createSuccessionPlan(form);
      setModal(false);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Succession Planning</h1>
            <p className="text-sm text-gray-500 mt-1">{plans.length} succession plans</p>
          </div>
          <button onClick={openModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <FiPlus size={15} /> Create Plan
          </button>
        </div>

        <div className="space-y-3">
          {plans.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">No succession plans yet</div>
          ) : plans.map(plan => (
            <div key={plan._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleExpand(plan._id)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 text-left">
                  <div>
                    <p className="font-semibold text-gray-900">{plan.position || plan.positionTitle || '—'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{plan.department || '—'} · {(plan.successors || []).length} successors</p>
                  </div>
                </div>
                {expanded[plan._id] ? <FiChevronUp size={16} className="text-gray-400" /> : <FiChevronDown size={16} className="text-gray-400" />}
              </button>

              {expanded[plan._id] && (
                <div className="border-t border-gray-100">
                  {(plan.successors || []).length === 0 ? (
                    <p className="px-5 py-4 text-sm text-gray-400">No successors added yet</p>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Successor', 'Department', 'Readiness', 'Notes'].map(h => (
                            <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {plan.successors.map((s, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-5 py-3 font-medium text-gray-800">{s.employee?.name || s.employee?.firstName || '—'}</td>
                            <td className="px-5 py-3 text-gray-600">{s.employee?.department?.name || '—'}</td>
                            <td className="px-5 py-3">
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                {(s.readinessLevel || '').replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-gray-500 text-xs">{s.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Create Succession Plan</h2>
              <button onClick={() => setModal(false)}><FiX size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Position *</label>
                <input value={form.position} onChange={set('position')} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="e.g. VP Engineering" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Department</label>
                <input value={form.department} onChange={set('department')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Department name" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Add Successors</label>
                <div className="flex gap-2 mb-2">
                  <select value={successorRow.employee} onChange={e => setSuccessorRow(p => ({ ...p, employee: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select Employee</option>
                    {employees.map(e => <option key={e._id} value={e._id}>{e.name || `${e.firstName} ${e.lastName}`}</option>)}
                  </select>
                  <select value={successorRow.readinessLevel} onChange={e => setSuccessorRow(p => ({ ...p, readinessLevel: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    {READINESS.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                  <button type="button" onClick={addSuccessor} className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Add</button>
                </div>
                {form.successors.length > 0 && (
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {form.successors.map((s, i) => {
                      const emp = employees.find(e => e._id === s.employee);
                      return (
                        <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="text-gray-700">{emp?.name || emp?.firstName || s.employee}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">{s.readinessLevel.replace(/_/g, ' ')}</span>
                            <button type="button" onClick={() => removeSuccessor(i)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Create Plan'}
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

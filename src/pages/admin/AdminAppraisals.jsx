import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchAppraisals, createAppraisal } from '../../services/performanceAPI';
import { fetchEmployees } from '../../services/hrmsAPI';
import { fetchCycles } from '../../services/performanceAPI';
import { FiPlus, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const RATING_COLORS = {
  outstanding:          'bg-purple-100 text-purple-700',
  exceeds_expectations: 'bg-blue-100 text-blue-700',
  meets_expectations:   'bg-green-100 text-green-700',
  needs_improvement:    'bg-yellow-100 text-yellow-700',
  unsatisfactory:       'bg-red-100 text-red-700',
};

const BLANK = {
  employee: '', cycle: '', finalRating: '', increment: '', incrementType: 'percentage',
  promotionRecommended: false, remarks: '',
};

export default function AdminAppraisals() {
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState({ ...BLANK });
  const [saving, setSaving]         = useState(false);
  const [employees, setEmployees]   = useState([]);
  const [cycles, setCycles]         = useState([]);
  const limit = 15;

  const load = useCallback(() => {
    setLoading(true);
    fetchAppraisals({ page, limit })
      .then(r => { setAppraisals(r.data.data || r.data.appraisals || []); setTotal(r.data.total || 0); })
      .catch(e => setError(e.response?.data?.message || 'Failed to load appraisals'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openModal = () => {
    setForm({ ...BLANK });
    setModal(true);
    if (!employees.length) fetchEmployees({ limit: 200 }).then(r => setEmployees(r.data.data || r.data.employees || []));
    if (!cycles.length) fetchCycles({ limit: 50 }).then(r => setCycles(r.data.data || r.data.cycles || []));
  };

  const set = k => e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [k]: val }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await createAppraisal(form);
      setModal(false);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appraisals</h1>
            <p className="text-sm text-gray-500 mt-1">{total} appraisals total</p>
          </div>
          <button onClick={openModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <FiPlus size={15} /> Create Appraisal
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Code', 'Employee', 'Cycle', 'Final Rating', 'Increment', 'Increment Type', 'Promotion', 'Remarks'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appraisals.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400">No appraisals found</td></tr>
              ) : appraisals.map(a => (
                <tr key={a._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.aprCode || a.appraisalCode || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{a.employee?.name || a.employee?.firstName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{a.cycle?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {a.finalRating ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${RATING_COLORS[a.finalRating] || 'bg-gray-100 text-gray-600'}`}>
                        {a.finalRating.replace(/_/g, ' ')}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.increment ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{a.incrementType || '—'}</td>
                  <td className="px-4 py-3">
                    {a.promotionRecommended
                      ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Yes</span>
                      : <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">No</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">{a.remarks || '—'}</td>
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
              <h2 className="text-lg font-bold text-gray-900">Create Appraisal</h2>
              <button onClick={() => setModal(false)}><FiX size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Employee *</label>
                <select value={form.employee} onChange={set('employee')} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.name || `${e.firstName} ${e.lastName}`}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Cycle</label>
                <select value={form.cycle} onChange={set('cycle')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Cycle</option>
                  {cycles.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Final Rating</label>
                  <select value={form.finalRating} onChange={set('finalRating')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select Rating</option>
                    {['outstanding', 'exceeds_expectations', 'meets_expectations', 'needs_improvement', 'unsatisfactory'].map(r => (
                      <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Increment</label>
                  <input type="number" value={form.increment} onChange={set('increment')} step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Increment Type</label>
                <select value={form.incrementType} onChange={set('incrementType')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.promotionRecommended} onChange={set('promotionRecommended')} className="accent-indigo-600" />
                Promotion Recommended
              </label>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Remarks</label>
                <textarea value={form.remarks} onChange={set('remarks')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Create Appraisal'}
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

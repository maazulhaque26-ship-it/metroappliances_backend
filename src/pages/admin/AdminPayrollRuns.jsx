import React, { useEffect, useState } from 'react';
import { FiPlus, FiZap, FiCheckSquare, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchRuns, createRun, calculateRun, approveRun, postRun, payRun, fetchPeriods } from '../../services/payrollAPI';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  calculated: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-purple-100 text-purple-700',
  posted: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
};

const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

export default function AdminPayrollRuns() {
  const [runs, setRuns]       = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ period: '', runType: 'regular', narration: '' });
  const [saving, setSaving]   = useState(false);
  const [actionId, setActionId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([fetchRuns(), fetchPeriods({ status: 'open', limit: 50 })])
      .then(([r, p]) => { setRuns(r.data.data || []); setPeriods(p.data.data || []); })
      .catch(e => setError(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    setSaving(true);
    try { await createRun(form); setShowModal(false); load(); }
    catch (e) { alert(e.response?.data?.message || 'Create failed'); }
    finally { setSaving(false); }
  };

  const action = async (fn, id) => {
    setActionId(id);
    try { await fn(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Action failed'); }
    finally { setActionId(null); }
  };

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll Runs</h1>
            <p className="text-sm text-gray-500 mt-1">Manage monthly payroll processing runs</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            <FiPlus size={16} /> New Run
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Run #','Period','Type','Employees','Gross','Net Pay','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runs.map(r => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.runNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{r.period?.name}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{r.runType}</td>
                  <td className="px-4 py-3 text-gray-600">{r.totalEmployees}</td>
                  <td className="px-4 py-3 text-gray-700">₹{fmt(r.totalGross)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">₹{fmt(r.totalNetPay)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.status === 'draft' && (
                        <button disabled={actionId === r._id} onClick={() => action(calculateRun, r._id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Calculate">
                          <FiZap size={14} />
                        </button>
                      )}
                      {r.status === 'calculated' && (
                        <button disabled={actionId === r._id} onClick={() => action(id => approveRun(id, {}), r._id)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Approve">
                          <FiCheckSquare size={14} />
                        </button>
                      )}
                      {r.status === 'approved' && (
                        <button disabled={actionId === r._id} onClick={() => action(postRun, r._id)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Post to GL">
                          <FiRefreshCw size={14} />
                        </button>
                      )}
                      {r.status === 'posted' && (
                        <button disabled={actionId === r._id} onClick={() => action(id => payRun(id, {}), r._id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mark Paid">
                          <FiDollarSign size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!runs.length && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No payroll runs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create Payroll Run</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Period</label>
                <select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select period</option>
                  {periods.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Run Type</label>
                <select value={form.runType} onChange={e => setForm(f => ({ ...f, runType: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {['regular','supplementary','correction','off_cycle'].map(t => (
                    <option key={t} value={t} className="capitalize">{t.replace('_',' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Narration</label>
                <input value={form.narration} onChange={e => setForm(f => ({ ...f, narration: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.period}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

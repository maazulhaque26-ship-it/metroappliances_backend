import React, { useEffect, useState } from 'react';
import { FiPlus, FiCheckSquare } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchLoans, createLoan, approveLoan, closeLoan } from '../../services/payrollAPI';
import { fetchEmployees } from '../../services/hrmsAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN').format(n || 0);
const STATUS_COLORS = { applied:'bg-yellow-100 text-yellow-700', approved:'bg-blue-100 text-blue-700', active:'bg-indigo-100 text-indigo-700', closed:'bg-green-100 text-green-700', rejected:'bg-red-100 text-red-700' };

export default function AdminLoans() {
  const [items, setItems]     = useState([]);
  const [employees, setEmps]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employee: '', loanType: 'personal', principal: '', interestRate: 0, tenure: 12, reason: '' });
  const [saving, setSaving]   = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([fetchLoans(), fetchEmployees({ limit: 200 })])
      .then(([l, e]) => { setItems(l.data.data || []); setEmps(e.data.data || []); })
      .catch(e => setError(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    setSaving(true);
    try { await createLoan(form); setShowModal(false); load(); }
    catch (e) { alert(e.response?.data?.message || 'Create failed'); }
    finally { setSaving(false); }
  };

  const approve = async (id) => {
    try { await approveLoan(id, { disbursementDate: new Date().toISOString(), firstEmiDate: new Date().toISOString() }); load(); }
    catch (e) { alert(e.response?.data?.message || 'Approve failed'); }
  };

  const close = async (id) => {
    if (!confirm('Close this loan?')) return;
    try { await closeLoan(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Close failed'); }
  };

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Loans</h1>
            <p className="text-sm text-gray-500 mt-1">Manage employee loan applications and repayments</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            <FiPlus size={16} /> New Loan
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Loan #','Employee','Type','Principal','Rate','Tenure','EMI','Outstanding','Status','Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(l => (
                <tr key={l._id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-mono text-xs text-gray-500">{l.loanNumber}</td>
                  <td className="px-3 py-3 font-medium text-gray-900">{l.employee?.displayName || l.employee?.firstName}</td>
                  <td className="px-3 py-3 text-gray-500 capitalize">{l.loanType}</td>
                  <td className="px-3 py-3 text-gray-700">₹{fmt(l.principal)}</td>
                  <td className="px-3 py-3 text-gray-600">{l.interestRate}%</td>
                  <td className="px-3 py-3 text-gray-600">{l.tenure}m</td>
                  <td className="px-3 py-3 text-gray-700">₹{fmt(l.emi)}</td>
                  <td className="px-3 py-3 font-semibold text-gray-900">₹{fmt(l.outstandingBalance)}</td>
                  <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[l.status] || 'bg-gray-100 text-gray-500'}`}>{l.status}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      {l.status === 'applied' && (
                        <button onClick={() => approve(l._id)} className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700">Approve</button>
                      )}
                      {['approved','active','disbursed'].includes(l.status) && (
                        <button onClick={() => close(l._id)} className="px-2 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700">Close</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No loans</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create Loan</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-gray-600">Employee</label>
                <select value={form.employee} onChange={e => setForm(f => ({ ...f, employee: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.displayName || e.firstName}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600">Loan Type</label>
                  <select value={form.loanType} onChange={e => setForm(f => ({ ...f, loanType: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {['personal','home','vehicle','education','emergency','other'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select></div>
                <div><label className="text-xs font-medium text-gray-600">Principal (₹)</label>
                  <input type="number" value={form.principal} onChange={e => setForm(f => ({ ...f, principal: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600">Interest Rate (%)</label>
                  <input type="number" step="0.1" value={form.interestRate} onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-gray-600">Tenure (months)</label>
                  <input type="number" value={form.tenure} onChange={e => setForm(f => ({ ...f, tenure: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="text-xs font-medium text-gray-600">Reason</label>
                <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  rows={2} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.employee || !form.principal}
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

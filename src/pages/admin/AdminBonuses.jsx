import React, { useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchBonuses, createBonus, approveBonus } from '../../services/payrollAPI';
import { fetchEmployees } from '../../services/hrmsAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN').format(n || 0);
const STATUS_COLORS = { draft:'bg-gray-100 text-gray-600', approved:'bg-green-100 text-green-700', paid:'bg-blue-100 text-blue-700', cancelled:'bg-red-100 text-red-700' };

export default function AdminBonuses() {
  const [items, setItems]     = useState([]);
  const [employees, setEmps]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employee: '', bonusType: 'performance', amount: '', effectiveDate: '', reason: '', taxable: true });
  const [saving, setSaving]   = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([fetchBonuses(), fetchEmployees({ limit: 200 })])
      .then(([b, e]) => { setItems(b.data.data || []); setEmps(e.data.data || []); })
      .catch(e => setError(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    setSaving(true);
    try { await createBonus(form); setShowModal(false); load(); }
    catch (e) { alert(e.response?.data?.message || 'Create failed'); }
    finally { setSaving(false); }
  };

  const approve = async (id) => {
    try { await approveBonus(id, {}); load(); }
    catch (e) { alert(e.response?.data?.message || 'Approve failed'); }
  };

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bonuses</h1>
            <p className="text-sm text-gray-500 mt-1">Employee bonus management and approvals</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            <FiPlus size={16} /> Add Bonus
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Bonus #','Employee','Type','Amount','Effective Date','Taxable','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(b => (
                <tr key={b._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.bonusNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{b.employee?.displayName || b.employee?.firstName}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{b.bonusType}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">₹{fmt(b.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{b.effectiveDate ? new Date(b.effectiveDate).toLocaleDateString() : '–'}</td>
                  <td className="px-4 py-3">{b.taxable ? <span className="text-xs text-orange-600">Yes</span> : <span className="text-xs text-gray-400">No</span>}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[b.status] || 'bg-gray-100'}`}>{b.status}</span></td>
                  <td className="px-4 py-3">
                    {b.status === 'draft' && (
                      <button onClick={() => approve(b._id)} className="px-2 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700">Approve</button>
                    )}
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No bonuses</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create Bonus</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-gray-600">Employee</label>
                <select value={form.employee} onChange={e => setForm(f => ({ ...f, employee: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.displayName || e.firstName}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600">Bonus Type</label>
                  <select value={form.bonusType} onChange={e => setForm(f => ({ ...f, bonusType: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {['performance','festival','annual','referral','joining','retention','other'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select></div>
                <div><label className="text-xs font-medium text-gray-600">Amount (₹)</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="text-xs font-medium text-gray-600">Effective Date</label>
                <input type="date" value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium text-gray-600">Reason</label>
                <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.taxable} onChange={e => setForm(f => ({ ...f, taxable: e.target.checked }))} />
                Taxable
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.employee || !form.amount || !form.effectiveDate}
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

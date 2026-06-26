import React, { useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchEmployeeSalaries, assignEmployeeSalary } from '../../services/payrollAPI';
import { fetchEmployees } from '../../services/hrmsAPI';
import { fetchStructures } from '../../services/payrollAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

export default function AdminEmployeeSalary() {
  const [items, setItems]       = useState([]);
  const [employees, setEmps]    = useState([]);
  const [structures, setStruct] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState({ employee: '', structure: '', effectiveFrom: '', ctc: '', basicSalary: '', hra: '', travelAllowance: '', medicalAllowance: '', specialAllowance: '', paymentMode: 'bank_transfer' });
  const [saving, setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([fetchEmployeeSalaries(), fetchEmployees({ limit: 200 }), fetchStructures({ isActive: true })])
      .then(([s, e, st]) => {
        setItems(s.data.data || []);
        setEmps(e.data.data || []);
        setStruct(st.data.data || []);
      })
      .catch(e => setError(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAssign = async () => {
    setSaving(true);
    try { await assignEmployeeSalary(form); setShowModal(false); load(); }
    catch (e) { alert(e.response?.data?.message || 'Assign failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Salary</h1>
            <p className="text-sm text-gray-500 mt-1">Assign salary structures and CTC to employees</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            <FiPlus size={16} /> Assign Salary
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Employee','Structure','CTC','Basic','HRA','TA','Medical','Special','Payment','Status'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium text-gray-900">{s.employee?.displayName || s.employee?.firstName}</td>
                  <td className="px-3 py-3 text-gray-500">{s.structure?.name}</td>
                  <td className="px-3 py-3 text-gray-700">₹{fmt(s.ctc)}</td>
                  <td className="px-3 py-3 text-gray-700">₹{fmt(s.basicSalary)}</td>
                  <td className="px-3 py-3 text-gray-600">₹{fmt(s.hra)}</td>
                  <td className="px-3 py-3 text-gray-600">₹{fmt(s.travelAllowance)}</td>
                  <td className="px-3 py-3 text-gray-600">₹{fmt(s.medicalAllowance)}</td>
                  <td className="px-3 py-3 text-gray-600">₹{fmt(s.specialAllowance)}</td>
                  <td className="px-3 py-3 text-gray-500 capitalize">{s.paymentMode?.replace('_',' ')}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No salary assignments</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg overflow-y-auto max-h-screen">
            <h2 className="text-lg font-semibold mb-4">Assign Salary Structure</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600">Employee</label>
                  <select value={form.employee} onChange={e => setForm(f => ({ ...f, employee: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select</option>
                    {employees.map(e => <option key={e._id} value={e._id}>{e.displayName || e.firstName}</option>)}
                  </select></div>
                <div><label className="text-xs font-medium text-gray-600">Structure</label>
                  <select value={form.structure} onChange={e => setForm(f => ({ ...f, structure: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select</option>
                    {structures.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select></div>
              </div>
              <div><label className="text-xs font-medium text-gray-600">Effective From</label>
                <input type="date" value={form.effectiveFrom} onChange={e => setForm(f => ({ ...f, effectiveFrom: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                {[['ctc','CTC (Annual)'],['basicSalary','Basic'],['hra','HRA'],['travelAllowance','Travel Allowance'],['medicalAllowance','Medical'],['specialAllowance','Special Allowance']].map(([k, label]) => (
                  <div key={k}><label className="text-xs font-medium text-gray-600">{label}</label>
                    <input type="number" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                ))}
              </div>
              <div><label className="text-xs font-medium text-gray-600">Payment Mode</label>
                <select value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select></div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleAssign} disabled={saving || !form.employee || !form.structure || !form.effectiveFrom}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchComponents, createComponent, updateComponent, deleteComponent } from '../../services/payrollAPI';

const TYPE_COLORS = {
  earning: 'bg-green-100 text-green-700',
  deduction: 'bg-red-100 text-red-700',
  employer_contribution: 'bg-blue-100 text-blue-700',
};

export default function AdminSalaryComponents() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({ name: '', type: 'earning', calculationType: 'fixed', value: 0, isStatutory: false, taxable: false, sortOrder: 0 });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchComponents({ limit: 100 })
      .then(r => setItems(r.data.data || []))
      .catch(e => setError(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setForm({ name: '', type: 'earning', calculationType: 'fixed', value: 0, isStatutory: false, taxable: false, sortOrder: 0 }); setModal('create'); };
  const openEdit   = (item) => { setForm({ name: item.name, type: item.type, calculationType: item.calculationType, value: item.value, isStatutory: item.isStatutory, taxable: item.taxable, sortOrder: item.sortOrder }); setModal(item); };

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'create') await createComponent(form);
      else await updateComponent(modal._id, form);
      setModal(null); load();
    } catch (e) { alert(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this component?')) return;
    try { await deleteComponent(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Delete failed'); }
  };

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Salary Components</h1>
            <p className="text-sm text-gray-500 mt-1">Configure earnings, deductions and employer contributions</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            <FiPlus size={16} /> Add Component
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Code','Name','Type','Calc. Type','Value','Statutory','Taxable',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(c => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.componentCode}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${TYPE_COLORS[c.type] || 'bg-gray-100 text-gray-600'}`}>
                      {c.type.replace('_',' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{c.calculationType.replace(/_/g,' ')}</td>
                  <td className="px-4 py-3 text-gray-700">{c.calculationType === 'fixed' ? `₹${c.value}` : `${c.value}%`}</td>
                  <td className="px-4 py-3">{c.isStatutory ? <span className="text-xs text-indigo-600 font-medium">Yes</span> : '–'}</td>
                  <td className="px-4 py-3">{c.taxable ? <span className="text-xs text-orange-600 font-medium">Yes</span> : '–'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"><FiEdit2 size={13} /></button>
                      <button onClick={() => remove(c._id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><FiTrash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No components defined</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{modal === 'create' ? 'Create' : 'Edit'} Salary Component</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-gray-600">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="earning">Earning</option>
                    <option value="deduction">Deduction</option>
                    <option value="employer_contribution">Employer Contribution</option>
                  </select></div>
                <div><label className="text-xs font-medium text-gray-600">Calculation</label>
                  <select value={form.calculationType} onChange={e => setForm(f => ({ ...f, calculationType: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="fixed">Fixed</option>
                    <option value="percentage_of_basic">% of Basic</option>
                    <option value="percentage_of_gross">% of Gross</option>
                  </select></div>
              </div>
              <div><label className="text-xs font-medium text-gray-600">Value</label>
                <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.isStatutory} onChange={e => setForm(f => ({ ...f, isStatutory: e.target.checked }))} />
                  Statutory
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.taxable} onChange={e => setForm(f => ({ ...f, taxable: e.target.checked }))} />
                  Taxable
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={save} disabled={saving || !form.name}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

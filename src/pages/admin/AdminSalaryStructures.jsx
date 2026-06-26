import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchStructures, createStructure, updateStructure, deleteStructure } from '../../services/payrollAPI';

export default function AdminSalaryStructures() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [modal, setModal]     = useState(null); // null | 'create' | item
  const [form, setForm]       = useState({ name: '', description: '', isDefault: false });
  const [saving, setSaving]   = useState(false);

  const load = () => {
    setLoading(true);
    fetchStructures()
      .then(r => setItems(r.data.data || []))
      .catch(e => setError(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setForm({ name: '', description: '', isDefault: false }); setModal('create'); };
  const openEdit   = (item) => { setForm({ name: item.name, description: item.description, isDefault: item.isDefault }); setModal(item); };

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'create') await createStructure(form);
      else await updateStructure(modal._id, form);
      setModal(null); load();
    } catch (e) { alert(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this structure?')) return;
    try { await deleteStructure(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Delete failed'); }
  };

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Salary Structures</h1>
            <p className="text-sm text-gray-500 mt-1">Define salary templates for employee groups</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            <FiPlus size={16} /> Add Structure
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(s => (
            <div key={s._id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{s.structureCode}</p>
                  {s.isDefault && <span className="mt-1 inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">Default</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"><FiEdit2 size={14} /></button>
                  <button onClick={() => remove(s._id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><FiTrash2 size={14} /></button>
                </div>
              </div>
              {s.description && <p className="text-sm text-gray-500 mt-2">{s.description}</p>}
              <p className="text-xs text-gray-400 mt-2">{s.components?.length || 0} components</p>
            </div>
          ))}
          {!items.length && <div className="col-span-3 text-center py-12 text-gray-400">No salary structures defined</div>}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{modal === 'create' ? 'Create' : 'Edit'} Salary Structure</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-gray-600">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium text-gray-600">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
                Set as default structure
              </label>
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

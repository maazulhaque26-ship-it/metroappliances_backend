import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchAccountGroups, createAccountGroup, updateAccountGroup, deleteAccountGroup } from '../../services/financeAPI';

const BLANK = { groupName: '', groupType: 'asset', nature: 'debit', description: '' };

export default function AdminAccountGroups() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(BLANK);
  const [editing,  setEditing]  = useState(null);
  const [delId,    setDelId]    = useState(null);
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAccountGroups({ page, limit: LIMIT });
      setItems(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editing) await updateAccountGroup(editing._id, form);
      else         await createAccountGroup(form);
      setShowForm(false); setEditing(null); setForm(BLANK); load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleDelete = async () => {
    try { await deleteAccountGroup(delId); setDelId(null); load(); } catch {}
  };

  const columns = [
    { key: 'groupCode', label: 'Code',   render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'groupName', label: 'Name' },
    { key: 'groupType', label: 'Type',   render: v => <span className="capitalize">{v}</span> },
    { key: 'nature',    label: 'Nature', render: v => <span className={`text-xs font-medium ${v === 'debit' ? 'text-blue-600' : 'text-green-600'}`}>{v}</span> },
    { key: 'isActive',  label: 'Active', render: v => <span className={`text-xs ${v ? 'text-green-600' : 'text-red-500'}`}>{v ? 'Yes' : 'No'}</span> },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-1">
          <button onClick={() => { setEditing(row); setForm({ groupName: row.groupName, groupType: row.groupType, nature: row.nature, description: row.description || '' }); setShowForm(true); }} className="text-xs text-blue-600 hover:underline">Edit</button>
          <button onClick={() => setDelId(v)} className="text-xs text-red-500 hover:underline">Del</button>
        </div>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Account Groups" subtitle={`${total} groups`}>
        <button onClick={() => { setEditing(null); setForm(BLANK); setShowForm(true); }} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Group</button>
      </SectionHeader>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No account groups found" /> :
        <><DataTable columns={columns} data={items} /><Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} /></>
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-semibold">{editing ? 'Edit' : 'New'} Account Group</h3>
            <input required placeholder="Group Name" value={form.groupName} onChange={e => setForm(f=>({...f,groupName:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <select value={form.groupType} onChange={e => setForm(f=>({...f,groupType:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm">
                {['asset','liability','equity','revenue','expense'].map(t=><option key={t}>{t}</option>)}
              </select>
              <select value={form.nature} onChange={e => setForm(f=>({...f,nature:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm">
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!delId} title="Delete Group" message="Delete this account group?" onConfirm={handleDelete} onCancel={() => setDelId(null)} />
    </div>
  );
}

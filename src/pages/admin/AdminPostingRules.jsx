import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import FilterToolbar from '../../components/shared/FilterToolbar';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchPostingRules, createPostingRule, updatePostingRule, deletePostingRule } from '../../services/financeAPI';

const MODULES = ['','sales','purchase','inventory','manufacturing','warehouse','service','dealer','installation','maintenance','payroll','manual'];
const MOD_OPTS = MODULES.map(v => ({ value: v, label: v || 'All Modules' }));
const BLANK = { name: '', sourceModule: 'sales', eventType: '', debitAccount: '', creditAccount: '', description: '' };

export default function AdminPostingRules() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [modFilter, setMod]     = useState('');
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
      const res = await fetchPostingRules({ page, limit: LIMIT, sourceModule: modFilter });
      setItems(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, modFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editing) await updatePostingRule(editing._id, form);
      else         await createPostingRule(form);
      setShowForm(false); setEditing(null); setForm(BLANK); load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleDelete = async () => {
    try { await deletePostingRule(delId); setDelId(null); load(); } catch {}
  };

  const columns = [
    { key: 'ruleCode',     label: 'Code',         render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'name',         label: 'Name' },
    { key: 'sourceModule', label: 'Module',        render: v => <span className="capitalize text-xs">{v}</span> },
    { key: 'eventType',    label: 'Event' },
    { key: 'debitAccount', label: 'Dr Account',   render: v => v ? <span className="text-xs text-blue-600">{v.accountName || v}</span> : '—' },
    { key: 'creditAccount',label: 'Cr Account',   render: v => v ? <span className="text-xs text-green-600">{v.accountName || v}</span> : '—' },
    { key: 'isActive',     label: 'Active',        render: v => <span className={`text-xs ${v ? 'text-green-600' : 'text-red-500'}`}>{v ? 'Yes' : 'No'}</span> },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-1">
          <button onClick={() => { setEditing(row); setForm({ name:row.name, sourceModule:row.sourceModule, eventType:row.eventType, debitAccount:row.debitAccount?._id||row.debitAccount||'', creditAccount:row.creditAccount?._id||row.creditAccount||'', description:row.description||'' }); setShowForm(true); }} className="text-xs text-blue-600 hover:underline">Edit</button>
          <button onClick={() => setDelId(v)} className="text-xs text-red-500 hover:underline">Del</button>
        </div>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Posting Rules" subtitle={`${total} rules`}>
        <button onClick={() => { setEditing(null); setForm(BLANK); setShowForm(true); }} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Rule</button>
      </SectionHeader>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <FilterToolbar filters={[{ label: 'Module', value: modFilter, onChange: v => { setMod(v); setPage(1); }, options: MOD_OPTS }]} />
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No posting rules found" /> :
        <><DataTable columns={columns} data={items} /><Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} /></>
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-lg space-y-3">
            <h3 className="text-lg font-semibold">{editing ? 'Edit' : 'New'} Posting Rule</h3>
            <input required placeholder="Rule Name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <select value={form.sourceModule} onChange={e => setForm(f=>({...f,sourceModule:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm">
                {MODULES.slice(1).map(m=><option key={m}>{m}</option>)}
              </select>
              <input required placeholder="Event Type" value={form.eventType} onChange={e => setForm(f=>({...f,eventType:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <input required placeholder="Debit Account ID" value={form.debitAccount} onChange={e => setForm(f=>({...f,debitAccount:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input required placeholder="Credit Account ID" value={form.creditAccount} onChange={e => setForm(f=>({...f,creditAccount:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!delId} title="Delete Rule" message="Delete this posting rule?" onConfirm={handleDelete} onCancel={() => setDelId(null)} />
    </div>
  );
}

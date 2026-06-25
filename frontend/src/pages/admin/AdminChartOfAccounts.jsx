import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchAccounts, createAccount, updateAccount, deleteAccount } from '../../services/financeAPI';

const TYPE_OPTS = ['','asset','liability','equity','revenue','expense','contra'].map(v => ({ value: v, label: v || 'All Types' }));
const NAT_OPTS  = ['','debit','credit'].map(v => ({ value: v, label: v || 'All Natures' }));

const BLANK = { accountName:'', accountType:'asset', accountNature:'debit', accountCode:'', postingAllowed:true, openingBalance:0, description:'' };

export default function AdminChartOfAccounts() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [typeFilter, setType]   = useState('');
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
      const res = await fetchAccounts({ page, limit: LIMIT, search, accountType: typeFilter });
      setItems(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editing) await updateAccount(editing._id, form);
      else         await createAccount(form);
      setShowForm(false); setEditing(null); setForm(BLANK); load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleDelete = async () => {
    try { await deleteAccount(delId); setDelId(null); load(); } catch {}
  };

  const columns = [
    { key: 'accountCode', label: 'Code',   render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'accountName', label: 'Name' },
    { key: 'accountType', label: 'Type',   render: v => <span className="capitalize">{v}</span> },
    { key: 'accountNature', label: 'Nature', render: v => <span className={`text-xs font-medium ${v === 'debit' ? 'text-blue-600' : 'text-green-600'}`}>{v}</span> },
    { key: 'postingAllowed', label: 'Posting', render: v => <span className={`text-xs ${v ? 'text-green-600' : 'text-gray-400'}`}>{v ? 'Yes' : 'No'}</span> },
    { key: 'openingBalance', label: 'Opening Bal.', render: v => `₹${Number(v || 0).toLocaleString('en-IN')}` },
    { key: 'isActive', label: 'Active', render: v => <span className={`text-xs ${v ? 'text-green-600' : 'text-red-500'}`}>{v ? 'Yes' : 'No'}</span> },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-1">
          <button onClick={() => { setEditing(row); setForm({ accountName: row.accountName, accountType: row.accountType, accountNature: row.accountNature, accountCode: row.accountCode, postingAllowed: row.postingAllowed, openingBalance: row.openingBalance || 0, description: row.description || '' }); setShowForm(true); }} className="text-xs text-blue-600 hover:underline">Edit</button>
          <button onClick={() => setDelId(v)} className="text-xs text-red-500 hover:underline">Del</button>
        </div>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Chart of Accounts" subtitle={`${total} accounts`}>
        <button onClick={() => { setEditing(null); setForm(BLANK); setShowForm(true); }} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Account</button>
      </SectionHeader>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search accounts..." />
        <FilterToolbar filters={[{ label: 'Type', value: typeFilter, onChange: v => { setType(v); setPage(1); }, options: TYPE_OPTS }]} />
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No accounts found" /> :
        <><DataTable columns={columns} data={items} /><Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} /></>
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-lg space-y-3">
            <h3 className="text-lg font-semibold">{editing ? 'Edit' : 'New'} Account</h3>
            <input required placeholder="Account Name" value={form.accountName} onChange={e => setForm(f=>({...f,accountName:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Account Code (auto-generated)" value={form.accountCode} onChange={e => setForm(f=>({...f,accountCode:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <select value={form.accountType} onChange={e => setForm(f=>({...f,accountType:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm">
                {['asset','liability','equity','revenue','expense','contra'].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <select value={form.accountNature} onChange={e => setForm(f=>({...f,accountNature:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm">
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            <input type="number" placeholder="Opening Balance" value={form.openingBalance} onChange={e => setForm(f=>({...f,openingBalance:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.postingAllowed} onChange={e=>setForm(f=>({...f,postingAllowed:e.target.checked}))} /> Allow posting</label>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!delId} title="Delete Account" message="Delete this account? This cannot be undone." onConfirm={handleDelete} onCancel={() => setDelId(null)} />
    </div>
  );
}

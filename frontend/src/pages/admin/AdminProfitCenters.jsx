import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchProfitCenters, createProfitCenter, updateProfitCenter, deleteProfitCenter } from '../../services/financeAPI';

const BLANK = { name: '', segment: '', region: '', description: '' };

export default function AdminProfitCenters() {
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
      const res = await fetchProfitCenters({ page, limit: LIMIT });
      setItems(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editing) await updateProfitCenter(editing._id, form);
      else         await createProfitCenter(form);
      setShowForm(false); setEditing(null); setForm(BLANK); load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleDelete = async () => {
    try { await deleteProfitCenter(delId); setDelId(null); load(); } catch {}
  };

  const columns = [
    { key: 'centerCode', label: 'Code',    render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'name',       label: 'Name' },
    { key: 'segment',    label: 'Segment', render: v => v || '—' },
    { key: 'region',     label: 'Region',  render: v => v || '—' },
    { key: 'isActive',   label: 'Active',  render: v => <span className={`text-xs ${v ? 'text-green-600' : 'text-red-500'}`}>{v ? 'Yes' : 'No'}</span> },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-1">
          <button onClick={() => { setEditing(row); setForm({ name: row.name, segment: row.segment||'', region: row.region||'', description: row.description||'' }); setShowForm(true); }} className="text-xs text-blue-600 hover:underline">Edit</button>
          <button onClick={() => setDelId(v)} className="text-xs text-red-500 hover:underline">Del</button>
        </div>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Profit Centers" subtitle={`${total} profit centers`}>
        <button onClick={() => { setEditing(null); setForm(BLANK); setShowForm(true); }} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Profit Center</button>
      </SectionHeader>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No profit centers found" /> :
        <><DataTable columns={columns} data={items} /><Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} /></>
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-semibold">{editing ? 'Edit' : 'New'} Profit Center</h3>
            <input required placeholder="Name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Segment" value={form.segment} onChange={e => setForm(f=>({...f,segment:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Region" value={form.region} onChange={e => setForm(f=>({...f,region:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!delId} title="Delete Profit Center" message="Delete this profit center?" onConfirm={handleDelete} onCancel={() => setDelId(null)} />
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge   from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchContracts, createContract, updateContract, deleteContract } from '../../services/eamAPI';

const STATUS_OPTS = ['','active','draft','expired','cancelled'].map(v=>({value:v,label:v||'All Status'}));
const TYPE_OPTS   = ['','amc','preventive_maintenance','corrective_maintenance','full_service','spare_parts','inspection','calibration'].map(v=>({value:v,label:v||'All Types'}));

export default function AdminMaintenanceContracts() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ title:'', contractType:'amc', startDate:'', endDate:'' });
  const [editing,  setEditing]  = useState(null);
  const [delId,    setDelId]    = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchContracts({ page, limit: LIMIT, status });
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editing) await updateContract(editing._id, form);
      else await createContract(form);
      setShowForm(false); setEditing(null); setForm({ title:'', contractType:'amc', startDate:'', endDate:'' });
      load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleDelete = async () => {
    try { await deleteContract(delId); setDelId(null); load(); } catch {}
  };

  const isExpiring = endDate => {
    if (!endDate) return false;
    const days = (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  };

  const columns = [
    { key: 'contractNumber', label: 'Contract No.' },
    { key: 'title',         label: 'Title' },
    { key: 'vendor',        label: 'Vendor',   render: (v, row) => row.vendor?.name || '—' },
    { key: 'contractType',  label: 'Type',     render: v => <span className="text-sm uppercase">{v}</span> },
    { key: 'startDate',     label: 'Start',    render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'endDate',       label: 'Expiry',   render: v => {
        if (!v) return '—';
        const label = new Date(v).toLocaleDateString();
        return isExpiring(v) ? <span className="text-yellow-600 font-medium">{label} ⚠</span> : label;
      }},
    { key: 'contractValue', label: 'Value',    render: v => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—' },
    { key: 'status',        label: 'Status',   render: v => <StatusBadge status={v} /> },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-1">
          <button onClick={() => { setEditing(row); setForm({ title:row.title, contractType:row.contractType, startDate:row.startDate?.slice(0,10)||'', endDate:row.endDate?.slice(0,10)||'' }); setShowForm(true); }} className="text-xs text-blue-600 hover:underline">Edit</button>
          <button onClick={() => setDelId(v)} className="text-xs text-red-500 hover:underline">Del</button>
        </div>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Maintenance Contracts" subtitle={`${total} contracts`}>
        <button onClick={() => { setEditing(null); setForm({ title:'', contractType:'amc', startDate:'', endDate:'' }); setShowForm(true); }} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Contract</button>
      </SectionHeader>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search contracts..." />
        <FilterToolbar filters={[{ label: 'Status', value: status, onChange: v => { setStatus(v); setPage(1); }, options: STATUS_OPTS }]} />
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No contracts found" /> :
        <>
          <DataTable columns={columns} data={items} />
          <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
        </>
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-semibold">{editing ? 'Edit' : 'New'} Contract</h3>
            <input required placeholder="Title" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Vendor ID" value={form.vendor||''} onChange={e => setForm(f=>({...f,vendor:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <select value={form.contractType} onChange={e => setForm(f=>({...f,contractType:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
              {TYPE_OPTS.slice(1).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="flex gap-2">
              <input required type="date" value={form.startDate} onChange={e => setForm(f=>({...f,startDate:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <input required type="date" value={form.endDate} onChange={e => setForm(f=>({...f,endDate:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <input type="number" placeholder="Contract value (₹)" value={form.contractValue||''} onChange={e => setForm(f=>({...f,contractValue:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!delId} title="Delete Contract" message="Delete this contract?" onConfirm={handleDelete} onCancel={() => setDelId(null)} />
    </div>
  );
}

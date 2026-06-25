import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge  from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchWorkOrders, createWorkOrder, transitionWorkOrder, deleteWorkOrder } from '../../services/eamAPI';

const STATUS_OPTS   = ['','draft','planned','approved','assigned','in_progress','paused','completed','verified','closed','cancelled'].map(v=>({value:v,label:v||'All Status'}));
const PRIORITY_OPTS = ['','low','medium','high','critical','emergency'].map(v=>({value:v,label:v||'All Priority'}));
const TYPE_OPTS     = ['','preventive','corrective','predictive','inspection','calibration','emergency'].map(v=>({value:v,label:v||'All Types'}));

const PRIORITY_COLOR = { low:'bg-gray-100 text-gray-700', medium:'bg-blue-100 text-blue-700', high:'bg-yellow-100 text-yellow-700', critical:'bg-red-100 text-red-700', emergency:'bg-red-600 text-white' };

export default function AdminMaintenanceWorkOrders() {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,    setForm]    = useState({ title:'', maintenanceType:'corrective', priority:'medium' });
  const [delId,   setDelId]   = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWorkOrders({ page, limit: LIMIT, search, status, priority });
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, search, status, priority]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async e => {
    e.preventDefault();
    try { await createWorkOrder(form); setShowForm(false); setForm({ title:'', maintenanceType:'corrective', priority:'medium' }); load(); } catch {}
  };

  const handleTransition = async (id, newStatus) => {
    try { await transitionWorkOrder(id, { newStatus }); load(); } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleDelete = async () => {
    try { await deleteWorkOrder(delId); setDelId(null); load(); } catch {}
  };

  const columns = [
    { key: 'workOrderNumber', label: 'WO No.' },
    { key: 'title',    label: 'Title' },
    { key: 'asset',    label: 'Asset',    render: (v, row) => row.asset?.name || '—' },
    { key: 'maintenanceType', label: 'Type', render: v => <span className="capitalize text-sm">{v}</span> },
    { key: 'priority', label: 'Priority', render: v => <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLOR[v]||''}`}>{v}</span> },
    { key: 'status',   label: 'Status',   render: v => <StatusBadge status={v} /> },
    { key: 'scheduledDate', label: 'Scheduled', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-1 flex-wrap">
          {row.status === 'planned'     && <button onClick={() => handleTransition(v, 'approved')}    className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">Approve</button>}
          {row.status === 'approved'    && <button onClick={() => handleTransition(v, 'assigned')}    className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Assign</button>}
          {row.status === 'assigned'    && <button onClick={() => handleTransition(v, 'in_progress')} className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">Start</button>}
          {row.status === 'in_progress' && <button onClick={() => handleTransition(v, 'completed')}   className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded">Complete</button>}
          {row.status === 'completed'   && <button onClick={() => handleTransition(v, 'verified')}    className="text-xs bg-teal-500 text-white px-2 py-0.5 rounded">Verify</button>}
          <button onClick={() => setDelId(v)} className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Del</button>
        </div>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Maintenance Work Orders" subtitle={`${total} work orders`}>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New WO</button>
      </SectionHeader>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search work orders..." />
        <FilterToolbar filters={[
          { label: 'Status',   value: status,   onChange: v => { setStatus(v);   setPage(1); }, options: STATUS_OPTS   },
          { label: 'Priority', value: priority, onChange: v => { setPriority(v); setPage(1); }, options: PRIORITY_OPTS },
        ]} />
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No work orders found" /> :
        <>
          <DataTable columns={columns} data={items} />
          <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
        </>
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">New Work Order</h3>
            <input required placeholder="Title" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Asset ID" value={form.asset||''} onChange={e => setForm(f=>({...f,asset:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <select value={form.maintenanceType} onChange={e => setForm(f=>({...f,maintenanceType:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
              {TYPE_OPTS.slice(1).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={form.priority} onChange={e => setForm(f=>({...f,priority:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
              {PRIORITY_OPTS.slice(1).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Create</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!delId} title="Delete Work Order" message="Delete this work order?" onConfirm={handleDelete} onCancel={() => setDelId(null)} />
    </div>
  );
}

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
import { fetchMaintenanceRequests, updateMaintenanceRequest, convertRequestToWorkOrder } from '../../services/eamAPI';

const STATUS_OPTS = ['','open','acknowledged','in_review','approved','rejected','converted','closed'].map(v=>({value:v,label:v||'All Status'}));

export default function AdminMaintenanceRequests() {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [convertId, setConvertId] = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMaintenanceRequests({ page, limit: LIMIT, search, status });
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, newStatus) => {
    try { await updateMaintenanceRequest(id, { status: newStatus }); load(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleConvert = async () => {
    try { await convertRequestToWorkOrder(convertId); setConvertId(null); load(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const columns = [
    { key: 'requestNumber', label: 'Request No.' },
    { key: 'title',   label: 'Title' },
    { key: 'asset',   label: 'Asset', render: (v, row) => row.asset?.name || '—' },
    { key: 'priority',label: 'Priority', render: v => <span className="capitalize text-sm">{v}</span> },
    { key: 'status',  label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'createdAt', label: 'Raised', render: v => new Date(v).toLocaleDateString() },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-1 flex-wrap">
          {row.status === 'open'      && <button onClick={() => handleStatusChange(v,'acknowledged')} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Acknowledge</button>}
          {row.status === 'acknowledged' && <button onClick={() => handleStatusChange(v,'approved')} className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">Approve</button>}
          {row.status === 'approved'  && <button onClick={() => setConvertId(v)} className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">→ WO</button>}
          {!['closed','converted'].includes(row.status) && <button onClick={() => handleStatusChange(v,'rejected')} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Reject</button>}
        </div>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Maintenance Requests" subtitle={`${total} requests`} />
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search requests..." />
        <FilterToolbar filters={[{ label: 'Status', value: status, onChange: v => { setStatus(v); setPage(1); }, options: STATUS_OPTS }]} />
      </div>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No requests found" /> :
        <>
          <DataTable columns={columns} data={items} />
          <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
        </>
      }
      <ConfirmDialog open={!!convertId} title="Convert to Work Order" message="This will create a new maintenance work order from this request. Continue?" onConfirm={handleConvert} onCancel={() => setConvertId(null)} />
    </div>
  );
}

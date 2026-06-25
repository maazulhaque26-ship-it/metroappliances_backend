import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye, FiTrash2 } from 'react-icons/fi';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge  from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import SectionHeader from '../../components/shared/SectionHeader';
import { getWorkOrders, deleteWorkOrder } from '../../services/mesAPI';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft',     label: 'Draft' },
  { value: 'released',  label: 'Released' },
  { value: 'started',   label: 'Started' },
  { value: 'paused',    label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priority' },
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function AdminWorkOrders() {
  const navigate = useNavigate();
  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [priority,setPriority]= useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [deleteId,setDeleteId]= useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getWorkOrders({ page, limit: 20, search, status, priority })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.meta?.total || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, status, priority]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    await deleteWorkOrder(deleteId);
    setDeleteId(null);
    load();
  };

  const columns = [
    { key: 'orderNumber', label: 'Order #', render: r => <span className="font-mono text-sm font-semibold text-orange-600">{r.orderNumber}</span> },
    { key: 'productName', label: 'Product' },
    { key: 'factory',     label: 'Factory', render: r => r.factory?.name || '—' },
    { key: 'plannedQty',  label: 'Planned Qty', render: r => `${r.plannedQty} ${r.unit || 'pcs'}` },
    { key: 'completedQty',label: 'Completed', render: r => r.completedQty || 0 },
    { key: 'priority',    label: 'Priority', render: r => <StatusBadge status={r.priority} /> },
    { key: 'status',      label: 'Status',   render: r => <StatusBadge status={r.status} /> },
    { key: 'plannedEndDate', label: 'Due', render: r => r.plannedEndDate ? new Date(r.plannedEndDate).toLocaleDateString() : '—' },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-2">
        <button onClick={() => navigate(`/admin/mes/work-orders/${r._id}`)} className="p-1 text-blue-600 hover:text-blue-800"><FiEye /></button>
        {['draft','cancelled'].includes(r.status) && <button onClick={() => setDeleteId(r._id)} className="p-1 text-red-500 hover:text-red-700"><FiTrash2 /></button>}
      </div>
    )},
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Work Orders" subtitle={`${total} total`} action={<button onClick={() => navigate('/admin/mes/work-orders/new')} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"><FiPlus /> New Work Order</button>} />
      <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search order number…" />
      <FilterToolbar filters={[
        { key: 'status',   label: 'Status',   value: status,   options: STATUS_OPTIONS,   onChange: v => { setStatus(v); setPage(1); } },
        { key: 'priority', label: 'Priority', value: priority, options: PRIORITY_OPTIONS, onChange: v => { setPriority(v); setPage(1); } },
      ]} />
      {loading ? <LoadingState /> : rows.length === 0 ? <EmptyState message="No work orders found" /> : <DataTable columns={columns} rows={rows} />}
      <Pagination page={page} total={total} limit={20} onChange={setPage} />
      <ConfirmDialog open={!!deleteId} title="Delete Work Order" message="Are you sure you want to delete this work order?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { FiActivity } from 'react-icons/fi';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge  from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';
import { getExecutions } from '../../services/mesAPI';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminProductionExecution() {
  const [rows,    setRows]   = useState([]);
  const [total,   setTotal]  = useState(0);
  const [page,    setPage]   = useState(1);
  const [status,  setStatus] = useState('');
  const [loading, setLoading]= useState(true);
  const [error,   setError]  = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getExecutions({ page, limit: 20, status })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.meta?.total || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'executionNumber', label: 'Execution #', render: r => <span className="font-mono text-sm text-orange-600">{r.executionNumber}</span> },
    { key: 'workOrder', label: 'Work Order', render: r => r.workOrder?.orderNumber || '—' },
    { key: 'product',   label: 'Product',   render: r => r.workOrder?.productName || '—' },
    { key: 'machine',   label: 'Machine',   render: r => r.machine?.name || '—' },
    { key: 'factory',   label: 'Factory',   render: r => r.factory?.name || '—' },
    { key: 'actualQty', label: 'Qty',       render: r => `${r.actualQty ?? 0} / ${r.targetQty ?? '—'}` },
    { key: 'status',    label: 'Status',    render: r => <StatusBadge status={r.status} /> },
    { key: 'startTime', label: 'Start',     render: r => r.startTime ? new Date(r.startTime).toLocaleString() : '—' },
    { key: 'durationMins', label: 'Duration', render: r => r.durationMins ? `${r.durationMins} min` : '—' },
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Production Execution" subtitle={`${total} records`} />
      <FilterToolbar filters={[{ key: 'status', label: 'Status', value: status, options: STATUS_OPTIONS, onChange: v => { setStatus(v); setPage(1); } }]} />
      {loading ? <LoadingState /> : rows.length === 0 ? <EmptyState message="No executions found" /> : <DataTable columns={columns} rows={rows} />}
      <Pagination page={page} total={total} limit={20} onChange={setPage} />
    </div>
  );
}

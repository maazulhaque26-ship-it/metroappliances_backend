import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge  from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';
import { getOperationExecutions } from '../../services/mesAPI';

export default function AdminOperations() {
  const [rows,   setRows]   = useState([]);
  const [total,  setTotal]  = useState(0);
  const [page,   setPage]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getOperationExecutions({ page, limit: 20 })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.meta?.total || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'executionNumber', label: 'Execution #', render: r => <span className="font-mono text-sm text-orange-600">{r.executionNumber}</span> },
    { key: 'workOrder',       label: 'Work Order',  render: r => r.workOrder?.orderNumber || '—' },
    { key: 'machine',         label: 'Machine',     render: r => r.machine?.name || '—' },
    { key: 'operatorName',    label: 'Operator' },
    { key: 'startTime',       label: 'Start',       render: r => r.startTime ? new Date(r.startTime).toLocaleString() : '—' },
    { key: 'endTime',         label: 'End',         render: r => r.endTime   ? new Date(r.endTime).toLocaleString()   : '—' },
    { key: 'durationMins',    label: 'Duration',    render: r => r.durationMins ? `${r.durationMins} min` : '—' },
    { key: 'quantityProduced',label: 'Qty Produced',render: r => r.quantityProduced ?? 0 },
    { key: 'scrapQty',        label: 'Scrap',       render: r => r.scrapQty ?? 0 },
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Operations" subtitle={`${total} records`} />
      {loading ? <LoadingState /> : rows.length === 0 ? <EmptyState message="No operation records" /> : <DataTable columns={columns} rows={rows} />}
      <Pagination page={page} total={total} limit={20} onChange={setPage} />
    </div>
  );
}

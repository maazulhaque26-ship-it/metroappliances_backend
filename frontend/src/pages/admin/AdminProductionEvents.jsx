import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge  from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';
import { getProductionEvents } from '../../services/mesAPI';

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severity' },
  { value: 'info',     label: 'Info' },
  { value: 'warning',  label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];

export default function AdminProductionEvents() {
  const [rows,     setRows]    = useState([]);
  const [total,    setTotal]   = useState(0);
  const [page,     setPage]    = useState(1);
  const [severity, setSeverity]= useState('');
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getProductionEvents({ page, limit: 30, severity })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.meta?.total || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, severity]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'eventNumber', label: '#', render: r => <span className="font-mono text-xs text-orange-600">{r.eventNumber}</span> },
    { key: 'eventType',   label: 'Event Type', render: r => r.eventType.replace(/_/g, ' ') },
    { key: 'workOrder',   label: 'Work Order', render: r => r.workOrder?.orderNumber || '—' },
    { key: 'machine',     label: 'Machine',    render: r => r.machine?.name || '—' },
    { key: 'factory',     label: 'Factory',    render: r => r.factory?.name || '—' },
    { key: 'severity',    label: 'Severity',   render: r => <StatusBadge status={r.severity} /> },
    { key: 'message',     label: 'Message',    render: r => <span className="text-xs text-gray-600 max-w-xs truncate block">{r.message}</span> },
    { key: 'timestamp',   label: 'Time',       render: r => new Date(r.timestamp).toLocaleString() },
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Production Events" subtitle={`${total} events`} />
      <FilterToolbar filters={[{ key: 'severity', label: 'Severity', value: severity, options: SEVERITY_OPTIONS, onChange: v => { setSeverity(v); setPage(1); } }]} />
      {loading ? <LoadingState /> : rows.length === 0 ? <EmptyState message="No events found" /> : <DataTable columns={columns} rows={rows} />}
      <Pagination page={page} total={total} limit={30} onChange={setPage} />
    </div>
  );
}

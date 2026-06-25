import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import FilterToolbar from '../../components/shared/FilterToolbar';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';
import { getMachineRuntimes } from '../../services/mesAPI';

export default function AdminMachineRuntime() {
  const [rows,     setRows]    = useState([]);
  const [total,    setTotal]   = useState(0);
  const [page,     setPage]    = useState(1);
  const [dateFrom, setDateFrom]= useState('');
  const [dateTo,   setDateTo]  = useState('');
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getMachineRuntimes({ page, limit: 20, dateFrom, dateTo })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.meta?.total || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'runtimeNumber', label: '#', render: r => <span className="font-mono text-xs text-orange-600">{r.runtimeNumber}</span> },
    { key: 'machine',       label: 'Machine',  render: r => r.machine?.name || '—' },
    { key: 'workOrder',     label: 'Work Order', render: r => r.workOrder?.orderNumber || '—' },
    { key: 'date',          label: 'Date',     render: r => new Date(r.date).toLocaleDateString() },
    { key: 'runtimeMins',   label: 'Runtime (min)', render: r => r.runtimeMins ?? 0 },
    { key: 'idleTimeMins',  label: 'Idle (min)',    render: r => r.idleTimeMins ?? 0 },
    { key: 'downtimeMins',  label: 'Downtime (min)', render: r => r.downtimeMins ?? 0 },
    { key: 'setupTimeMins', label: 'Setup (min)',   render: r => r.setupTimeMins ?? 0 },
    { key: 'utilizationPct', label: 'Utilization %', render: r => r.utilizationPct != null ? `${r.utilizationPct}%` : '—' },
    { key: 'throughput',    label: 'Throughput', render: r => r.throughput ?? '—' },
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Machine Runtime" subtitle={`${total} records`} />
      <div className="flex gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      {loading ? <LoadingState /> : rows.length === 0 ? <EmptyState message="No runtime records" /> : <DataTable columns={columns} rows={rows} />}
      <Pagination page={page} total={total} limit={20} onChange={setPage} />
    </div>
  );
}

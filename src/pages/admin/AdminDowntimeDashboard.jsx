import React, { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard    from '../../components/shared/MetricCard';
import ChartCard     from '../../components/shared/ChartCard';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';
import { getDowntimes, getDowntimeAnalysis, resolveDowntime } from '../../services/mesAPI';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default function AdminDowntimeDashboard() {
  const [analysis, setAnalysis]  = useState({});
  const [rows,    setRows]       = useState([]);
  const [total,   setTotal]      = useState(0);
  const [page,    setPage]       = useState(1);
  const [status,  setStatus]     = useState('');
  const [loading, setLoading]    = useState(true);
  const [error,   setError]      = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getDowntimeAnalysis({ days: 30 }), getDowntimes({ page, limit: 15, status })])
      .then(([a, d]) => {
        setAnalysis(a.data.data || {});
        setRows(d.data.data || []);
        setTotal(d.data.meta?.total || 0);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id) => {
    const resolution = prompt('Resolution notes:');
    if (resolution === null) return;
    await resolveDowntime(id, { resolution });
    load();
  };

  const totalMins = (analysis.byCategory || []).reduce((s, c) => s + (c.totalMins || 0), 0);
  const unplannedMins = (analysis.byCategory || []).find(c => c._id === 'unplanned')?.totalMins || 0;

  const columns = [
    { key: 'downtimeNumber', label: '#', render: r => <span className="font-mono text-sm text-orange-600">{r.downtimeNumber}</span> },
    { key: 'machine',   label: 'Machine', render: r => r.machine?.name || '—' },
    { key: 'reason',    label: 'Reason' },
    { key: 'category',  label: 'Category', render: r => <StatusBadge status={r.category} /> },
    { key: 'status',    label: 'Status',   render: r => <StatusBadge status={r.status} /> },
    { key: 'durationMins', label: 'Duration', render: r => r.durationMins ? `${r.durationMins} min` : '—' },
    { key: 'startTime', label: 'Started', render: r => new Date(r.startTime).toLocaleString() },
    { key: 'actions',   label: '', render: r => r.status !== 'resolved' && <button onClick={() => handleResolve(r._id)} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Resolve</button> },
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Downtime Dashboard" subtitle="30-day analysis" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard title="Total Downtime (30d)" value={`${totalMins} min`}     color="#EF4444" />
        <MetricCard title="Unplanned Downtime"   value={`${unplannedMins} min`} color="#DC2626" />
        <MetricCard title="Incidents"            value={(analysis.byReason || []).reduce((s, c) => s + c.count, 0)} color="#F59E0B" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top Downtime Reasons">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={(analysis.byReason || []).slice(0, 8)} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="_id" type="category" tick={{ fontSize: 10 }} width={60} />
              <Tooltip />
              <Bar dataKey="totalMins" name="Minutes" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Downtime by Day">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analysis.timeline || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="totalMins" name="Minutes" fill="#FF7A00" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <FilterToolbar filters={[{ key: 'status', label: 'Status', value: status, options: STATUS_OPTIONS, onChange: v => { setStatus(v); setPage(1); } }]} />
      {loading ? <LoadingState /> : rows.length === 0 ? <EmptyState message="No downtime records" /> : <DataTable columns={columns} rows={rows} />}
      <Pagination page={page} total={total} limit={15} onChange={setPage} />
    </div>
  );
}

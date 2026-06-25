import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MetricCard    from '../../components/shared/MetricCard';
import ChartCard     from '../../components/shared/ChartCard';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';
import { getOEERecords, getOEESummary, getOEETrend } from '../../services/mesAPI';

export default function AdminOEEDashboard() {
  const [summary, setSummary] = useState({});
  const [trend,   setTrend]   = useState([]);
  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([getOEESummary({ days: 30 }), getOEETrend({ days: 30 }), getOEERecords({ page, limit: 15 })])
      .then(([s, t, r]) => {
        setSummary(s.data.data || {});
        setTrend(t.data.data || []);
        setRows(r.data.data || []);
        setTotal(r.data.meta?.total || 0);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  const columns = [
    { key: 'oeeNumber',    label: 'OEE #', render: r => <span className="font-mono text-sm text-orange-600">{r.oeeNumber}</span> },
    { key: 'machine',      label: 'Machine', render: r => r.machine?.name || '—' },
    { key: 'date',         label: 'Date', render: r => new Date(r.date).toLocaleDateString() },
    { key: 'availability', label: 'Avail %', render: r => `${r.availability ?? 0}%` },
    { key: 'performance',  label: 'Perf %',  render: r => `${r.performance ?? 0}%` },
    { key: 'quality',      label: 'Qual %',  render: r => `${r.quality ?? 0}%` },
    { key: 'oee',          label: 'OEE %',   render: r => <span className={`font-bold ${r.oee >= 85 ? 'text-green-600' : r.oee >= 65 ? 'text-yellow-600' : 'text-red-500'}`}>{r.oee ?? 0}%</span> },
    { key: 'goodParts',    label: 'Good', render: r => r.goodParts ?? '—' },
    { key: 'defectiveParts', label: 'Defects', render: r => r.defectiveParts ?? '—' },
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <SectionHeader title="OEE Dashboard" subtitle="Overall Equipment Effectiveness" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Avg OEE (30d)"         value={`${Math.round((summary.avgOEE || 0) * 10) / 10}%`}          color={summary.avgOEE >= 85 ? '#10B981' : '#F59E0B'} />
        <MetricCard title="Avg Availability (30d)" value={`${Math.round((summary.avgAvailability || 0) * 10) / 10}%`} color="#6366F1" />
        <MetricCard title="Avg Performance (30d)"  value={`${Math.round((summary.avgPerformance || 0) * 10) / 10}%`}  color="#FF7A00" />
        <MetricCard title="Avg Quality (30d)"      value={`${Math.round((summary.avgQuality || 0) * 10) / 10}%`}      color="#10B981" />
      </div>
      <ChartCard title="OEE Components Trend (30 days)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgOEE"          name="OEE%"   stroke="#D4AF37" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="avgAvailability" name="Avail%" stroke="#10B981" strokeWidth={1} dot={false} />
            <Line type="monotone" dataKey="avgPerformance"  name="Perf%"  stroke="#FF7A00" strokeWidth={1} dot={false} />
            <Line type="monotone" dataKey="avgQuality"      name="Qual%"  stroke="#6366F1" strokeWidth={1} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      {loading ? <LoadingState /> : rows.length === 0 ? <EmptyState message="No OEE records" /> : <DataTable columns={columns} rows={rows} />}
      <Pagination page={page} total={total} limit={15} onChange={setPage} />
    </div>
  );
}

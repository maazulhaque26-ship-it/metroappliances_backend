import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartCard    from '../../components/shared/ChartCard';
import MetricCard   from '../../components/shared/MetricCard';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import SectionHeader from '../../components/shared/SectionHeader';
import ExportButton  from '../../components/shared/ExportButton';
import { getProductionTrend, getOEETrend, getDowntimeAnalysis, getQualityTrend, getLaborReport } from '../../services/mesAPI';

const PERIODS = [
  { label: '7 days',  value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function AdminMESReports() {
  const [days,       setDays]      = useState(30);
  const [production, setProduction]= useState([]);
  const [oee,        setOee]       = useState([]);
  const [downtime,   setDowntime]  = useState({});
  const [quality,    setQuality]   = useState({});
  const [labor,      setLabor]     = useState({});
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getProductionTrend({ days }),
      getOEETrend({ days }),
      getDowntimeAnalysis({ days }),
      getQualityTrend({ days }),
      getLaborReport({ days }),
    ])
      .then(([p, o, d, q, l]) => {
        setProduction(p.data.data || []);
        setOee(o.data.data || []);
        setDowntime(d.data.data || {});
        setQuality(q.data.data || {});
        setLabor(l.data.data || {});
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  const laborSummary = labor.summary || {};

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="MES Reports" subtitle="Integrated manufacturing analytics" />
        <div className="flex gap-2 items-center">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setDays(p.value)} className={`px-3 py-1.5 text-sm rounded-lg font-medium ${days === p.value ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Production */}
      <ChartCard title={`Production Volume (${days} days)`}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={production} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="totalPlanned"   name="Planned Qty"   fill="#6366F1" />
            <Bar dataKey="totalCompleted" name="Completed Qty" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* OEE */}
      <ChartCard title={`OEE Trend (${days} days)`}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={oee} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgOEE"          name="OEE%"   stroke="#D4AF37" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="avgAvailability" name="Avail%" stroke="#10B981" strokeWidth={1} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Labor metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Labor Hours"  value={Math.round(laborSummary.totalHours || 0)}      color="#6366F1" />
        <MetricCard title="Overtime Hours"     value={Math.round(laborSummary.totalOT || 0)}         color="#F59E0B" />
        <MetricCard title="Avg Efficiency"     value={`${Math.round(laborSummary.avgEfficiency || 0)}%`} color="#10B981" />
        <MetricCard title="Total Labor Cost"   value={`₹${(laborSummary.totalCost || 0).toLocaleString()}`} color="#FF7A00" />
      </div>

      {/* Labor trend */}
      <ChartCard title={`Labor Efficiency Trend (${days} days)`}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={labor.trend || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="avgEfficiency" name="Efficiency %" stroke="#10B981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

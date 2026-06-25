import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import ChartCard    from '../../components/shared/ChartCard';
import MetricCard   from '../../components/shared/MetricCard';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import { getShortageReport, getInventoryRiskReport, getForecastAccuracyReport } from '../../services/mrpAPI';

const SEV_COLORS = { critical: '#EF4444', high: '#F97316', medium: '#EAB308', low: '#22C55E' };
const COLORS = ['#6366F1','#F97316','#10B981','#EAB308','#EF4444'];

export default function AdminMRPReports() {
  const [shortage,   setShortage]  = useState(null);
  const [invRisk,    setInvRisk]   = useState(null);
  const [forecast,   setForecast]  = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState('');

  useEffect(() => {
    Promise.all([getShortageReport(), getInventoryRiskReport(), getForecastAccuracyReport()])
      .then(([s, i, f]) => {
        setShortage(s.data.data);
        setInvRisk(i.data.data);
        setForecast(f.data.data || []);
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading MRP reports…" />;
  if (error)   return <ErrorState message={error} />;

  const shortagePieData = Object.entries(SEV_COLORS).map(([key]) => {
    const d = shortage?.bySeverity?.find(s => s._id === key);
    return { name: key, value: d?.count || 0 };
  }).filter(d => d.value > 0);

  const invRiskBarData = [
    { name: 'Below Safety', value: invRisk?.belowSafetyCount || 0 },
    { name: 'Below Reorder', value: invRisk?.belowReorderCount || 0 },
    { name: 'Total Projections', value: invRisk?.total || 0 },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 24px' }}>MRP Reports</h1>

      {/* Shortage summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <MetricCard title="Open Shortages"    value={shortage?.total || 0} color="#EF4444" />
        <MetricCard title="Below Safety Stock" value={invRisk?.belowSafetyCount || 0} color="#F97316" />
        <MetricCard title="Below Reorder Pt."  value={invRisk?.belowReorderCount || 0} color="#EAB308" />
        <MetricCard title="Total Projections"  value={invRisk?.total || 0} color="#6366F1" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <ChartCard title="Shortages by Severity">
          {shortagePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={shortagePieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {shortagePieData.map((entry, i) => <Cell key={i} fill={SEV_COLORS[entry.name] || COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>No open shortages</div>}
        </ChartCard>

        <ChartCard title="Inventory Risk Overview">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={invRiskBarData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366F1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top shortages table */}
      {shortage?.topShortages?.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Top Material Shortages</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Material','Shortage Qty','Severity','Status'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Material' ? 'left' : 'center', fontWeight: 700, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shortage.topShortages.map(s => (
                <tr key={s._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{s.materialName || s.material?.name}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#EF4444' }}>{(s.shortageQty || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span style={{ padding: '2px 8px', background: SEV_COLORS[s.severity] + '22', color: SEV_COLORS[s.severity], borderRadius: 5, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{s.severity}</span>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', textTransform: 'capitalize', color: '#6B7280', fontSize: 12 }}>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Forecast accuracy */}
      {forecast.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Forecast Accuracy by Method</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Period','Method','Avg Accuracy','# Forecasts','Avg Forecast Qty','Avg Actual Qty'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Period' || h === 'Method' ? 'left' : 'center', fontWeight: 700, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forecast.map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '8px 12px', textTransform: 'capitalize' }}>{f._id?.period}</td>
                  <td style={{ padding: '8px 12px', textTransform: 'capitalize', color: '#6B7280' }}>{f._id?.method?.replace('_', ' ')}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: f.avgAccuracy >= 80 ? '#10B981' : '#EF4444' }}>{f.avgAccuracy?.toFixed(1)}%</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{f.totalForecasts}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{f.avgForecastQty?.toFixed(0)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{f.avgActualQty?.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

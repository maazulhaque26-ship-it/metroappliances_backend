import React, { useEffect, useState } from 'react';
import { FiDownload, FiBarChart2, FiTrendingUp, FiActivity } from 'react-icons/fi';
import ChartCard  from '../../components/shared/ChartCard';
import MetricCard from '../../components/shared/MetricCard';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  getPlanningDashboard, getScheduleAdherence, getCapacityForecast, getResourceUtilization,
} from '../../services/planningAPI';
import { getFactories } from '../../services/manufacturingAPI';

const COLORS = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#6366F1','#0EA5E9'];

export default function AdminPlanningReports() {
  const [dash,     setDash]     = useState(null);
  const [adh,      setAdh]      = useState([]);
  const [cap,      setCap]      = useState([]);
  const [res,      setRes]      = useState([]);
  const [factories,setFact]     = useState([]);
  const [factoryF, setFactoryF] = useState('');
  const [period,   setPeriod]   = useState('6');
  const [loading,  setLoading]  = useState(true);

  const load = () => {
    setLoading(true);
    const p = { factory: factoryF, months: period };
    Promise.all([
      getPlanningDashboard({ factory: factoryF }),
      getScheduleAdherence(p),
      getCapacityForecast(p),
      getResourceUtilization({ factory: factoryF }),
    ])
      .then(([d, a, c, r]) => {
        setDash(d.data.data  || {});
        setAdh((a.data.data?.chartData)  || []);
        setCap(c.data.data   || []);
        setRes(r.data.data   || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [factoryF, period]);
  useEffect(() => {
    getFactories({ limit: 100 }).then(r => setFact(r.data.data || [])).catch(() => {});
  }, []);

  const d      = dash || {};
  const orders = d.orders   || {};
  const kpis   = d.kpis     || {};
  const cap2   = d.capacity || {};

  const orderStatusData = [
    { name: 'Completed',  value: orders.completed  || 0 },
    { name: 'In Progress',value: orders.inProgress || 0 },
    { name: 'Delayed',    value: orders.delayed    || 0 },
    { name: 'Other',      value: Math.max(0, (orders.total||0) - (orders.completed||0) - (orders.inProgress||0) - (orders.delayed||0)) },
  ].filter(d => d.value > 0);

  if (loading) return <div style={{ padding:40,textAlign:'center',color:'#6B7280' }}>Loading reports…</div>;

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Planning Reports</h1>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select value={factoryF} onChange={e => setFactoryF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="">All Factories</option>
          {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          {['3','6','9','12'].map(m => <option key={m} value={m}>{m} Months</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard title="Schedule Adherence"   value={kpis.scheduleAdherence    || 0} icon={FiBarChart2}  accent="#6366F1" suffix="%" />
        <MetricCard title="On-Time Completion"   value={kpis.onTimePct            || 0} icon={FiTrendingUp} accent="#10B981" suffix="%" />
        <MetricCard title="Avg Capacity Util."   value={cap2.avgUtilization       || 0} icon={FiActivity}   accent="#F59E0B" suffix="%" />
        <MetricCard title="Active Bottlenecks"   value={cap2.bottlenecks          || 0} icon={FiBarChart2}  accent="#EF4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Schedule Adherence Trend */}
        <ChartCard title="Schedule Adherence Trend" subtitle="On-time order completion % by month">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={adh}>
              <defs>
                <linearGradient id="adhGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={v => [`${v}%`, 'Adherence']} />
              <Area type="monotone" dataKey="adherencePct" stroke="#6366F1" fill="url(#adhGrad)" strokeWidth={2} name="Adherence %" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Order Status Distribution */}
        {orderStatusData.length > 0 && (
          <ChartCard title="Order Status Distribution" subtitle="Current production order breakdown">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {orderStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Capacity Forecast */}
      {cap.length > 0 && (
        <ChartCard title={`Capacity Forecast (${period} Months)`} subtitle="Available vs Allocated vs Utilization %">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cap}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left"  dataKey="availableCapacity" name="Available (hrs)" fill="#BFDBFE" radius={[4,4,0,0]} />
              <Bar yAxisId="left"  dataKey="allocatedCapacity" name="Allocated (hrs)" fill="#3B82F6" radius={[4,4,0,0]} />
              <Line yAxisId="right" type="monotone" dataKey="utilizationPct" stroke="#F59E0B" strokeWidth={2} name="Utilization %" dot={{ r:4 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Resource Utilization */}
      {res.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <ChartCard title="Resource Utilization by Work Center" subtitle="Sorted by utilization (highest first)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={res.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`${v}%`, 'Utilization']} />
                <Bar dataKey="utilizationPct" name="Utilization" fill="#8B5CF6" radius={[0,4,4,0]}>
                  {res.slice(0, 10).map((entry, i) => <Cell key={i} fill={entry.utilizationPct >= 80 ? '#EF4444' : entry.utilizationPct >= 60 ? '#F59E0B' : '#10B981'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Adherence Table */}
      {adh.length > 0 && (
        <div style={{ marginTop: 24, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 24px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>Monthly Schedule Adherence Detail</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Month','Total Orders','On Time','Late','Adherence %'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Month' ? 'left' : 'center', fontWeight: 700, color: '#6B7280', borderBottom: '1px solid #E5E7EB', fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adh.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#374151' }}>{row.month}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: '#374151' }}>{row.total}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: '#10B981', fontWeight: 700 }}>{row.onTime}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: '#EF4444', fontWeight: 700 }}>{row.late}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: row.adherencePct >= 90 ? '#10B981' : row.adherencePct >= 70 ? '#F59E0B' : '#EF4444' }}>{row.adherencePct}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

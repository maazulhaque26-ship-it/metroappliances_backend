import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiClock, FiTarget, FiBarChart2, FiLayers } from 'react-icons/fi';
import MetricCard from '../../components/shared/MetricCard';
import ChartCard  from '../../components/shared/ChartCard';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  getPlanningDashboard, getScheduleAdherence, getCapacityForecast, getResourceUtilization,
} from '../../services/planningAPI';

const S = {
  page:   { padding: '28px 32px', fontFamily: 'Poppins, sans-serif' },
  h1:     { fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 },
  grid4:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 },
  grid3:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 },
  grid2:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 },
  btnPrimary: { padding: '9px 18px', background: '#FF7A00', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 },
  btnDark:    { padding: '9px 18px', background: '#111827', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 },
};

export default function AdminManufacturingPlanningDashboard() {
  const [dash,   setDash]   = useState(null);
  const [adh,    setAdh]    = useState([]);
  const [cap,    setCap]    = useState([]);
  const [res,    setRes]    = useState([]);
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    Promise.all([
      getPlanningDashboard(),
      getScheduleAdherence({ months: 6 }),
      getCapacityForecast({ months: 6 }),
      getResourceUtilization(),
    ])
      .then(([d, a, c, r]) => {
        setDash(d.data.data || {});
        setAdh((a.data.data?.chartData)  || []);
        setCap(c.data.data               || []);
        setRes(r.data.data               || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading Planning Dashboard…</div>;

  const d = dash || {};
  const plans  = d.plans  || {};
  const orders = d.orders || {};
  const cap2   = d.capacity || {};
  const kpis   = d.kpis   || {};

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={S.h1}>Manufacturing Planning Dashboard</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/admin/manufacturing/planning/plans"     style={S.btnPrimary}>Production Plans</Link>
          <Link to="/admin/manufacturing/planning/scheduling" style={S.btnDark}>Scheduling Board</Link>
        </div>
      </div>

      {/* Plans row */}
      <div style={S.grid4}>
        <MetricCard title="Total Plans"    value={plans.total    || 0} icon={FiCalendar}    accent="#3B82F6" />
        <MetricCard title="Active Plans"   value={plans.active   || 0} icon={FiTarget}      accent="#8B5CF6" />
        <MetricCard title="Released Plans" value={plans.released || 0} icon={FiCheckCircle} accent="#10B981" />
        <MetricCard title="Bottlenecks"    value={cap2.bottlenecks || 0} icon={FiAlertTriangle} accent="#EF4444" />
      </div>

      {/* Orders row */}
      <div style={S.grid4}>
        <MetricCard title="Total Orders"   value={orders.total      || 0} icon={FiLayers}      accent="#374151" />
        <MetricCard title="In Progress"    value={orders.inProgress || 0} icon={FiClock}       accent="#F59E0B" />
        <MetricCard title="Completed"      value={orders.completed  || 0} icon={FiCheckCircle} accent="#10B981" />
        <MetricCard title="On-Time %"      value={kpis.onTimePct    || 0} icon={FiTrendingUp}  accent="#0EA5E9" suffix="%" />
      </div>

      {/* KPI row */}
      <div style={S.grid3}>
        <MetricCard title="Schedule Adherence" value={kpis.scheduleAdherence    || 0} icon={FiBarChart2}  accent="#6366F1" suffix="%" />
        <MetricCard title="Avg Capacity Util." value={cap2.avgUtilization       || 0} icon={FiTrendingUp} accent="#0EA5E9" suffix="%" />
        <MetricCard title="Plan Fulfillment"   value={kpis.planFulfillmentRate  || 0} icon={FiTarget}     accent="#10B981" suffix="%" />
      </div>

      <div style={S.grid2}>
        {/* Schedule Adherence Chart */}
        <ChartCard title="Schedule Adherence (6 Months)" subtitle="On-time completion rate by month">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={adh}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={v => [`${v}%`]} />
              <Line type="monotone" dataKey="adherencePct" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} name="Adherence %" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Capacity Forecast Chart */}
        <ChartCard title="Capacity Forecast (6 Months)" subtitle="Available vs Allocated capacity hours">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cap}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="availableCapacity" name="Available"  fill="#BFDBFE" radius={[4,4,0,0]} />
              <Bar dataKey="allocatedCapacity" name="Allocated"  fill="#3B82F6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Resource Utilization */}
      {res.length > 0 && (
        <ChartCard title="Resource Utilization by Work Center" subtitle="Capacity utilization %">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={res.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v}%`, 'Utilization']} />
              <Bar dataKey="utilizationPct" name="Utilization" fill="#8B5CF6" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Quick Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24 }}>
        {[
          { label: 'Production Plans',    path: '/admin/manufacturing/planning/plans',       color: '#3B82F6' },
          { label: 'Master Schedule',     path: '/admin/manufacturing/planning/mps',          color: '#8B5CF6' },
          { label: 'Capacity Planning',   path: '/admin/manufacturing/planning/capacity',     color: '#F59E0B' },
          { label: 'Scheduling Board',    path: '/admin/manufacturing/planning/scheduling',   color: '#10B981' },
          { label: 'Machine Calendar',    path: '/admin/manufacturing/planning/machine-cal',  color: '#0EA5E9' },
          { label: 'Production Calendar', path: '/admin/manufacturing/planning/prod-cal',     color: '#6366F1' },
          { label: 'Scenarios',           path: '/admin/manufacturing/planning/scenarios',    color: '#EF4444' },
          { label: 'Reports',             path: '/admin/manufacturing/planning/reports',      color: '#374151' },
        ].map(item => (
          <Link key={item.path} to={item.path} style={{ display: 'block', padding: '16px 20px', background: '#fff', border: `1px solid ${item.color}22`, borderLeft: `4px solid ${item.color}`, borderRadius: 10, textDecoration: 'none', color: '#111827', fontWeight: 600, fontSize: 13, transition: 'box-shadow 0.2s' }}>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

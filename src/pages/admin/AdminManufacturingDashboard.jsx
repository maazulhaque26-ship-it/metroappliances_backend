import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCpu, FiBox, FiActivity, FiClipboard, FiLayers, FiAlertTriangle, FiCheckCircle, FiPause, FiTrendingUp, FiList } from 'react-icons/fi';
import MetricCard from '../../components/shared/MetricCard';
import ChartCard from '../../components/shared/ChartCard';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboard, getProductionTrend, getOEEReport } from '../../services/manufacturingAPI';

const S = { page: { padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }, h1: { fontSize: 22, fontWeight: 700, color: '#111827' }, grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }, grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 } };

export default function AdminManufacturingDashboard() {
  const [stats,  setStats]  = useState(null);
  const [trend,  setTrend]  = useState([]);
  const [oee,    setOEE]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboard(), getProductionTrend(7), getOEEReport()])
      .then(([s, t, o]) => {
        setStats(s.data.data);
        setTrend(t.data.data || []);
        setOEE(o.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading Manufacturing Dashboard…</div>;

  const d = stats || {};

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={S.h1}>Manufacturing Dashboard</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/admin/manufacturing/orders" style={{ padding: '9px 18px', background: '#FF7A00', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Production Orders</Link>
          <Link to="/admin/manufacturing/bom" style={{ padding: '9px 18px', background: '#111827', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Bill of Materials</Link>
        </div>
      </div>

      {/* Row 1 — Production KPIs */}
      <div style={S.grid4}>
        <MetricCard title="Today's Output"   value={d.todayOutput || 0}            icon={FiCheckCircle} accent="#10B981" suffix=" units" />
        <MetricCard title="Running Orders"   value={d.orders?.running || 0}        icon={FiActivity}    accent="#3B82F6" />
        <MetricCard title="Planned Orders"   value={d.orders?.planned || 0}        icon={FiClipboard}   accent="#8B5CF6" />
        <MetricCard title="Paused Orders"    value={d.orders?.paused || 0}         icon={FiPause}       accent="#F59E0B" />
      </div>

      {/* Row 2 — Equipment KPIs */}
      <div style={S.grid4}>
        <MetricCard title="Machine Utilization" value={d.machines?.utilization || 0} icon={FiCpu}         accent="#0EA5E9" suffix="%" />
        <MetricCard title="Machines Running"    value={d.machines?.running || 0}     icon={FiCpu}         accent="#10B981" />
        <MetricCard title="OEE Score"           value={d.oee || 0}                   icon={FiActivity}    accent="#6366F1" suffix="%" />
        <MetricCard title="Scrap Rate"          value={d.scrapRate || 0}             icon={FiAlertTriangle} accent="#EF4444" suffix="%" />
      </div>

      {/* Row 3 — Platform Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard title="Factories"     value={d.factories || 0}    icon={FiBox}       accent="#FF7A00" />
        <MetricCard title="Work Centers"  value={d.workCenters || 0}  icon={FiLayers}    accent="#8B5CF6" />
        <MetricCard title="Total Machines"value={d.machines?.total||0}icon={FiCpu}       accent="#374151" />
        <MetricCard title="BOMs Active"   value={d.boms || 0}         icon={FiList}      accent="#059669" />
      </div>

      {/* Charts Row */}
      <div style={S.grid2}>
        <ChartCard title="7-Day Production Trend" subtitle="Completed units per day">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="mfgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => [v, n === 'output' ? 'Output' : 'Rejected']} />
              <Area type="monotone" dataKey="output"   stroke="#3B82F6" fill="url(#mfgGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="rejected" stroke="#EF4444" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Factory OEE & Utilization" subtitle="By factory">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={oee}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="factory" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`]} />
              <Bar dataKey="utilization" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Utilization" />
              <Bar dataKey="avgOEE"      fill="#10B981" radius={[4, 4, 0, 0]} name="OEE" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Quick Links */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginTop: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Quick Navigation</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { to: '/admin/manufacturing/factories',   label: 'Manage Factories',   color: '#FF7A00' },
            { to: '/admin/manufacturing/work-centers',label: 'Work Centers',       color: '#3B82F6' },
            { to: '/admin/manufacturing/machines',    label: 'Machine Registry',   color: '#8B5CF6' },
            { to: '/admin/manufacturing/shifts',      label: 'Shift Planner',      color: '#059669' },
            { to: '/admin/manufacturing/bom',         label: 'Bill of Materials',  color: '#F59E0B' },
            { to: '/admin/manufacturing/orders',      label: 'Production Orders',  color: '#EF4444' },
          ].map(({ to, label, color }) => (
            <Link key={to} to={to} style={{ display: 'block', padding: '12px 16px', background: `${color}10`, borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, color, border: `1px solid ${color}20` }}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

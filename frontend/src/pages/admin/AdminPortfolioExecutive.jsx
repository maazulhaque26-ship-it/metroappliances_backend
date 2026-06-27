import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  RadialBarChart, RadialBar, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { FiBriefcase, FiActivity, FiDollarSign, FiTarget, FiAlertTriangle, FiTrendingUp, FiUsers, FiCheckSquare } from 'react-icons/fi';
import { fetchExecutiveDashboard } from '../../services/portfolioAPI';

const fmt  = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtC = (n) => '₹' + fmt(n);

const HEALTH_COLORS = {
  on_track: '#22c55e', at_risk: '#f59e0b', off_track: '#ef4444', not_started: '#9ca3af',
};

const GAUGE_COLOR = (pct) => pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

function GaugeCard({ label, value, max = 100, unit = '%', color }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0;
  const c = color || GAUGE_COLOR(pct);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={c} strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold text-gray-900">{Number(value || 0).toFixed(0)}{unit}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center leading-tight">{label}</p>
    </div>
  );
}

export default function AdminPortfolioExecutive() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExecutiveDashboard()
      .then(r => setData(r.data.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><div className="p-8 text-center text-gray-400">Loading executive dashboard…</div></AdminLayout>;

  const kpi = data?.kpiCards || {};
  const healthBreakdown = (data?.healthBreakdown || []).filter(h => h.health);
  const portfolioHealth = (data?.portfolioHealth || []).slice(0, 10);

  const topCards = [
    { label: 'Total Portfolios',       value: fmt(kpi.portfolios),          icon: FiBriefcase,    color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active Portfolios',       value: fmt(kpi.activePortfolios),     icon: FiActivity,     color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Total Budget',            value: fmtC(kpi.totalBudget),        icon: FiDollarSign,   color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Actual Spend',            value: fmtC(kpi.actualSpend),        icon: FiDollarSign,   color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Target Benefits',         value: fmtC(kpi.targetBenefit),      icon: FiTarget,       color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Realized Benefits',       value: fmtC(kpi.realizedBenefit),    icon: FiCheckSquare,  color: 'text-teal-600',   bg: 'bg-teal-50' },
  ];

  const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#9ca3af'];

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Enterprise-wide portfolio performance overview</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {topCards.map(c => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-2`}>
                <c.icon size={18} className={c.color} />
              </div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Gauge Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GaugeCard label="Budget Burn" value={data?.budgetBurn ?? 0} color={GAUGE_COLOR(100 - (data?.budgetBurn ?? 0))} />
          <GaugeCard label="Resource Utilization" value={data?.resourceUtilization ?? 0} />
          <GaugeCard label="Schedule Variance (Milestones On-Track)" value={data?.scheduleVariance ?? 0} />
          <GaugeCard label="Benefits Progress" value={data?.benefitsProgress ?? 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Health Breakdown Pie */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Portfolio Health Distribution</h2>
            {healthBreakdown.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={healthBreakdown} dataKey="count" nameKey="health" cx="50%" cy="50%" outerRadius={75} label={({ health, count }) => `${(health || '').replace(/_/g, ' ')} (${count})`} labelLine={false}>
                    {healthBreakdown.map((h, i) => (
                      <Cell key={i} fill={HEALTH_COLORS[h.health] || PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, (n || '').replace(/_/g, ' ')]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Strategic Alignment */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Strategic Alignment</h2>
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <p className="text-5xl font-bold text-indigo-600">{kpi.avgStrategicAlignment || 0}<span className="text-2xl text-gray-400">%</span></p>
                <p className="text-sm text-gray-500 mt-2">Average across all portfolios</p>
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full h-3 bg-gray-100 rounded-full">
                <div className="h-3 bg-indigo-500 rounded-full" style={{ width: `${kpi.avgStrategicAlignment || 0}%` }} />
              </div>
            </div>
          </div>

          {/* Cost Variance */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Cost Variance</h2>
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <p className={`text-4xl font-bold ${(data?.costVariance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(data?.costVariance ?? 0) >= 0 ? '+' : ''}{fmtC(data?.costVariance)}
                </p>
                <p className="text-sm text-gray-500 mt-2">Budget remaining vs actual spend</p>
                <p className="text-xs text-gray-400 mt-1">{(data?.costVariance ?? 0) >= 0 ? 'Under budget' : 'Over budget'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Health Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Portfolio Health Scorecard</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Portfolio', 'Status', 'Health', 'Health Score', 'Strategic Alignment'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {portfolioHealth.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No portfolios.</td></tr>
              ) : portfolioHealth.map(p => (
                <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{p.status}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${HEALTH_COLORS[p.health]}20`, color: HEALTH_COLORS[p.health] || '#6b7280' }}>
                      {(p.health || '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full">
                        <div className="h-2 rounded-full" style={{ width: `${p.healthScore || 0}%`, backgroundColor: HEALTH_COLORS[p.health] || '#6366f1' }} />
                      </div>
                      <span className="text-xs text-gray-500">{p.healthScore || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full">
                        <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${p.strategicAlignment || 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{p.strategicAlignment || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

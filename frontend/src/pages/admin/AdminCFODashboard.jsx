import React, { useEffect, useState } from 'react';
import { FiTrendingUp, FiDollarSign, FiAlertTriangle, FiRefreshCw, FiActivity, FiBarChart2 } from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import { fetchCFODashboard, fetchRevenueTrend, fetchCashFlowChart, fetchBudgetVsActual, fetchKPITrend, fetchDashboardAlerts } from '../../services/cfoAPI';

const fmt = (n) => n >= 1e7 ? `₹${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : `₹${Number(n || 0).toLocaleString('en-IN')}`;
const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

const KPICard = ({ label, value, sub, color = 'var(--accent)' }) => (
  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem' }}>
    <p style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</p>
    <p style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 2 }}>{value}</p>
    {sub && <p style={{ fontSize: 11.5, color: 'var(--text-4)' }}>{sub}</p>}
  </div>
);

const COLORS = ['#FF7A00', '#D4AF37', '#22c55e', '#3b82f6', '#a855f7', '#ef4444'];

export default function AdminCFODashboard() {
  const [dash, setDash] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [cashFlow, setCashFlow] = useState([]);
  const [budgetActual, setBudgetActual] = useState([]);
  const [kpiTrend, setKpiTrend] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [d, r, c, b, k, a] = await Promise.all([
        fetchCFODashboard(), fetchRevenueTrend(), fetchCashFlowChart(),
        fetchBudgetVsActual(), fetchKPITrend(), fetchDashboardAlerts(),
      ]);
      setDash(d.data.data);
      setRevenue(r.data.data || []);
      setCashFlow(c.data.data || []);
      setBudgetActual(b.data.data || []);
      setKpiTrend(k.data.data || []);
      setAlerts(a.data.data?.alerts || []);
    } catch { setError('Failed to load CFO dashboard'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-4)' }}>Loading CFO Dashboard...</div>;
  if (error)   return <div style={{ padding: '2rem', color: '#ef4444' }}>{error}</div>;

  const s = dash?.summary || {};

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>CFO Dashboard</h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-4)', marginTop: 2 }}>Enterprise Financial Consolidation & Intelligence</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {dash?.alerts > 0 && (
            <span style={{ background: '#ef444420', color: '#ef4444', fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
              <FiAlertTriangle size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{dash.alerts} Active Alerts
            </span>
          )}
          <button onClick={load} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiRefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards — Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        <KPICard label="Revenue" value={fmt(s.revenue)} color="#22c55e" />
        <KPICard label="Gross Profit" value={fmt(s.grossProfit)} color="#22c55e" />
        <KPICard label="Net Profit" value={fmt(s.netProfit)} color="var(--accent)" />
        <KPICard label="EBITDA" value={fmt(s.ebitda)} color="var(--accent)" />
        <KPICard label="Cash Balance" value={fmt(s.cashBalance)} color="#3b82f6" />
      </div>

      {/* KPI Cards — Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        <KPICard label="Working Capital" value={fmt(s.workingCapital)} color="#a855f7" />
        <KPICard label="Receivables" value={fmt(s.receivables)} color="#D4AF37" />
        <KPICard label="Payables" value={fmt(s.payables)} color="#ef4444" />
        <KPICard label="Inventory Value" value={fmt(s.inventoryValue)} color="var(--text-3)" />
        <KPICard label="Bank Balance" value={fmt(s.bankBalance)} color="#3b82f6" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Revenue Trend */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text)' }}>Revenue & Profit Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1e5).toFixed(0)}L`} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="revenue" stroke="#22c55e" name="Revenue" dot={false} strokeWidth={2} />
              <Line dataKey="grossProfit" stroke="var(--accent)" name="Gross Profit" dot={false} strokeWidth={2} />
              <Line dataKey="netProfit" stroke="#3b82f6" name="Net Profit" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cash Flow */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text)' }}>Cash Flow</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cashFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1e5).toFixed(0)}L`} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="operatingActivities" fill="#22c55e" name="Operating" radius={[3,3,0,0]} />
              <Bar dataKey="investingActivities" fill="#3b82f6" name="Investing" radius={[3,3,0,0]} />
              <Bar dataKey="financingActivities" fill="var(--accent)" name="Financing" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Budget vs Actual */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text)' }}>Budget vs Actual</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={budgetActual}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="budgetName" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1e5).toFixed(0)}L`} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="totalBudget" fill="#3b82f6" name="Budget" radius={[3,3,0,0]} />
              <Bar dataKey="totalActual" fill="var(--accent)" name="Actual" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* KPI Trend */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text)' }}>KPI Trend (Margins %)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={kpiTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v) => pct(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="grossMargin" stroke="#22c55e" name="Gross Margin" dot={false} strokeWidth={2} />
              <Line dataKey="operatingMargin" stroke="var(--accent)" name="Operating Margin" dot={false} strokeWidth={2} />
              <Line dataKey="netMargin" stroke="#3b82f6" name="Net Margin" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text)' }}>
            <FiAlertTriangle size={14} style={{ color: '#ef4444', marginRight: 6, verticalAlign: 'middle' }} />Active Financial Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.slice(0, 5).map(a => {
              const sev = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e', info: '#3b82f6' };
              return (
                <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: `1px solid ${sev[a.severity]}30` }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: sev[a.severity], flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{a.title}</span>
                  <span style={{ fontSize: 11, color: sev[a.severity], fontWeight: 700, textTransform: 'uppercase' }}>{a.severity}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

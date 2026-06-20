import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import AdminLayout from './AdminLayout';
import api from '../../services/api';

const INR = v => `₹${(v || 0).toLocaleString('en-IN')}`;
const PERIODS = [['all','All Time'],['thisYear','This Year'],['thisQuarter','This Quarter'],['thisMonth','This Month'],['lastMonth','Last Month']];
const STATUS_COLOR = { active: '#10B981', inactive: '#9CA3AF', suspended: '#EF4444' };

export default function AdminAgentPerformance() {
  const [agents,  setAgents]  = useState([]);
  const [period,  setPeriod]  = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/admin/bi/agents?period=${period}`)
      .then(r => setAgents(r.data.agents || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const kpis = useMemo(() => {
    const total   = agents.length;
    const active  = agents.filter(a => a.status === 'active').length;
    const leads   = agents.reduce((s, a) => s + (a.leads || 0), 0);
    const won     = agents.reduce((s, a) => s + (a.won || 0), 0);
    const value   = agents.reduce((s, a) => s + (a.estimatedValue || 0), 0);
    const convRate = leads > 0 ? ((won / leads) * 100).toFixed(1) : 0;
    return { total, active, leads, won, value, convRate };
  }, [agents]);

  const chartData = useMemo(() => agents.slice(0, 10).map(a => ({ name: a.name?.split(' ')[0] || a.agentCode, won: a.won, leads: a.leads })), [agents]);

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>Agent Performance</h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0' }}>Leaderboard and metrics for all sales agents</p>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PERIODS.map(([v, l]) => (
              <button key={v} onClick={() => setPeriod(v)}
                style={{ padding: '7px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: period === v ? '#FF7A00' : '#F3F4F6', color: period === v ? '#fff' : '#374151' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total Agents',    value: kpis.total,          accent: '#FF7A00' },
            { label: 'Active Agents',   value: kpis.active,         accent: '#10B981' },
            { label: 'Leads (Period)',   value: kpis.leads,          accent: '#3B82F6' },
            { label: 'Won (Period)',     value: kpis.won,            accent: '#8B5CF6' },
            { label: 'Conv. Rate',       value: `${kpis.convRate}%`, accent: '#F59E0B' },
            { label: 'Est. Pipeline',   value: INR(kpis.value),     accent: '#D4AF37' },
          ].map(c => (
            <div key={c.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', borderTop: `3px solid ${c.accent}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '6px' }}>{c.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#111' }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Top 10 Chart */}
        {!loading && chartData.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>Top 10 Agents by Won Leads</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, n) => [v, n === 'won' ? 'Won Leads' : 'Total Leads']} />
                <Bar dataKey="leads" fill="#E5E7EB" radius={[0, 4, 4, 0]} name="Total Leads" />
                <Bar dataKey="won"   fill="#FF7A00" radius={[0, 4, 4, 0]} name="Won Leads">
                  {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? '#D4AF37' : '#FF7A00'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Leaderboard Table */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Rank', 'Agent', 'Territory', 'Status', 'Leads', 'Won', 'Conv %', 'Est. Value'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agents.map((a, i) => (
                  <tr key={a._id} style={{ borderBottom: '1px solid #F3F4F6', background: i === 0 ? '#FFFBEB' : i === 1 ? '#F9FAFB' : '#fff' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: i < 3 ? '#D4AF37' : '#9CA3AF', fontSize: '14px' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#111', fontSize: '13px' }}>{a.name}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>{a.agentCode}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{a.territory?.name || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLOR[a.status] || '#9CA3AF') + '1A', color: STATUS_COLOR[a.status] || '#9CA3AF', textTransform: 'capitalize' }}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#374151' }}>{a.leads}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#FF7A00' }}>{a.won}</td>
                    <td style={{ padding: '12px 14px', color: '#9CA3AF' }}>{a.conversionRate}%</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#111' }}>{INR(a.estimatedValue)}</td>
                  </tr>
                ))}
                {agents.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No agents found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}

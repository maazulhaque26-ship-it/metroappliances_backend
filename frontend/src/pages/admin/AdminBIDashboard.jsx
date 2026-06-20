import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import AdminLayout from './AdminLayout';
import api from '../../services/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const INR = v => `₹${(v || 0).toLocaleString('en-IN')}`;

const STAGE_COLORS = {
  prospect: '#9CA3AF', qualified: '#3B82F6', proposal: '#F59E0B',
  negotiation: '#8B5CF6', won: '#10B981', lost: '#EF4444',
};

function buildMonthly(b2c, b2b, year) {
  return MONTHS.map((name, i) => {
    const m = i + 1;
    return {
      name,
      b2c: b2c.find(d => d._id.month === m && d._id.year === year)?.revenue || 0,
      b2b: b2b.find(d => d._id.month === m && d._id.year === year)?.revenue || 0,
    };
  });
}

export default function AdminBIDashboard() {
  const [overview, setOverview] = useState(null);
  const [rev,      setRev]      = useState(null);
  const [leads,    setLeads]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    Promise.all([
      api.get('/admin/bi/overview'),
      api.get(`/admin/bi/revenue?period=monthly&year=${year}`),
      api.get('/admin/bi/leads'),
    ]).then(([o, r, l]) => {
      setOverview(o.data.overview);
      setRev(r.data);
      setLeads(l.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  const chartData = useMemo(() => {
    if (!rev) return [];
    return buildMonthly(rev.b2c, rev.b2b, year);
  }, [rev, year]);

  const funnelData = useMemo(() => {
    if (!leads?.funnel) return [];
    const max = Math.max(...leads.funnel.map(f => f.count), 1);
    return leads.funnel.map(f => ({ ...f, pct: +(f.count / max * 100).toFixed(1) }));
  }, [leads]);

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
          Loading BI Dashboard...
        </div>
      </AdminLayout>
    );
  }

  if (!overview) {
    return (
      <AdminLayout>
        <div style={{ padding: '40px', color: '#EF4444' }}>Failed to load data. Check API connection.</div>
      </AdminLayout>
    );
  }

  const ov = overview;

  const KPI_CARDS = [
    { label: 'Combined Revenue',  value: INR(ov.combined.total),    sub: `This month: ${INR(ov.combined.thisMonth)}`, accent: '#FF7A00', growth: ov.combined.growth },
    { label: 'B2C Revenue',       value: INR(ov.b2c.total),         sub: `This month: ${INR(ov.b2c.thisMonth)}`,     accent: '#F59E0B', growth: ov.b2c.growth },
    { label: 'B2B Revenue',       value: INR(ov.b2b.total),         sub: `This month: ${INR(ov.b2b.thisMonth)}`,     accent: '#2563EB', growth: ov.b2b.growth },
    { label: 'Lead Conversion',   value: `${ov.leads.conversionRate}%`, sub: `${ov.leads.won} won / ${ov.leads.total} total`, accent: '#8B5CF6', growth: null },
    { label: 'Active Dealers',    value: `${ov.dealers.active}`,    sub: `${ov.dealers.total} total dealers`,        accent: '#10B981', growth: null },
    { label: 'Active Agents',     value: `${ov.agents.active}`,     sub: `${ov.agents.total} total agents`,          accent: '#D4AF37', growth: null },
  ];

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>
            Business Intelligence
          </h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0' }}>
            Enterprise analytics — B2C · B2B · CRM · Field Sales
          </p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {KPI_CARDS.map(c => (
            <div key={c.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '18px', borderTop: `3px solid ${c.accent}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '8px' }}>{c.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#111', marginBottom: '4px' }}>{c.value}</div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{c.sub}</div>
              {c.growth !== null && c.growth !== undefined && (
                <div style={{ fontSize: '11px', fontWeight: 700, color: c.growth >= 0 ? '#10B981' : '#EF4444', marginTop: '4px' }}>
                  {c.growth >= 0 ? '▲' : '▼'} {Math.abs(c.growth)}% vs last month
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Revenue Trend Chart */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>Revenue Trend — {year}</div>
            <a href="/admin/bi/revenue" style={{ fontSize: '12px', color: '#FF7A00', fontWeight: 600, textDecoration: 'none' }}>Full Analysis →</a>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="biB2C" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#FF7A00" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#FF7A00" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="biB2B" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip formatter={(v, n) => [INR(v), n === 'b2c' ? 'B2C Revenue' : 'B2B Revenue']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="b2c" stroke="#FF7A00" fill="url(#biB2C)" strokeWidth={2} name="B2C" dot={false} />
              <Area type="monotone" dataKey="b2b" stroke="#2563EB" fill="url(#biB2B)" strokeWidth={2} name="B2B" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Row: Funnel + Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Lead Funnel */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>Lead Funnel</div>
              <a href="/admin/bi/leads" style={{ fontSize: '12px', color: '#FF7A00', fontWeight: 600, textDecoration: 'none' }}>Details →</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {funnelData.map(f => (
                <div key={f.stage} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '80px', fontSize: '11px', fontWeight: 600, color: '#374151', textTransform: 'capitalize', textAlign: 'right', flexShrink: 0 }}>{f.stage}</div>
                  <div style={{ flex: 1, background: '#F3F4F6', borderRadius: '4px', height: '20px', overflow: 'hidden' }}>
                    <div style={{ width: `${f.pct}%`, height: '100%', background: STAGE_COLORS[f.stage] || '#9CA3AF', borderRadius: '4px', transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ width: '36px', fontSize: '12px', fontWeight: 700, color: '#111', textAlign: 'right', flexShrink: 0 }}>{f.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>Quick Navigation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Agent Performance',   path: '/admin/bi/agents',      color: '#FF7A00' },
                { label: 'Dealer Analytics',    path: '/admin/bi/dealers',     color: '#2563EB' },
                { label: 'Territory Analytics', path: '/admin/bi/territories', color: '#10B981' },
                { label: 'Lead Funnel',         path: '/admin/bi/leads',       color: '#8B5CF6' },
                { label: 'Reports & Export',    path: '/admin/bi/reports',     color: '#F59E0B' },
                { label: 'Targets',             path: '/admin/bi/targets',     color: '#D4AF37' },
              ].map(l => (
                <a key={l.path} href={l.path} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #F3F4F6', textDecoration: 'none', color: '#374151', fontSize: '13px', fontWeight: 600, transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                  {l.label}
                  <span style={{ marginLeft: 'auto', color: '#9CA3AF' }}>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

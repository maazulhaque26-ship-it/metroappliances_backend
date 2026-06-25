import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import AdminLayout from './AdminLayout';
import api from '../../services/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const INR = v => `₹${(v || 0).toLocaleString('en-IN')}`;

const STAGE_COLORS = {
  prospect: '#9CA3AF', qualified: '#3B82F6', proposal: '#F59E0B',
  negotiation: '#8B5CF6', won: '#10B981', lost: '#EF4444',
};

const SOURCE_LABELS = {
  cold_call: 'Cold Call', referral: 'Referral', walk_in: 'Walk-in',
  online: 'Online', exhibition: 'Exhibition', agent_visit: 'Agent Visit', other: 'Other',
};

const PRIORITY_COLORS = { low: '#9CA3AF', medium: '#3B82F6', high: '#F59E0B', urgent: '#EF4444' };
const PIE_COLORS = ['#FF7A00', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#D4AF37', '#9CA3AF'];

const PERIODS = [['all','All Time'],['thisYear','This Year'],['thisQuarter','This Quarter'],['thisMonth','This Month'],['lastMonth','Last Month']];

export default function AdminLeadFunnel() {
  const [data,    setData]    = useState(null);
  const [period,  setPeriod]  = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/admin/bi/leads?period=${period}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const funnelData = useMemo(() => {
    if (!data?.funnel) return [];
    const max = Math.max(...data.funnel.map(f => f.count), 1);
    return data.funnel.map(f => ({ ...f, pct: +(f.count / max * 100).toFixed(1) }));
  }, [data]);

  const sourceData = useMemo(() => {
    if (!data?.sources) return [];
    return data.sources.map(s => ({ name: SOURCE_LABELS[s._id] || s._id, value: s.count }));
  }, [data]);

  const priorityData = useMemo(() => {
    if (!data?.priorities) return [];
    return data.priorities.map(p => ({ name: p._id, value: p.count }));
  }, [data]);

  const trendData = useMemo(() => {
    if (!data?.monthlyTrend) return [];
    return data.monthlyTrend.map(m => ({ name: MONTHS[m._id.month - 1], leads: m.count, won: m.won }));
  }, [data]);

  const totals = useMemo(() => {
    if (!data?.funnel) return { total: 0, won: 0, lost: 0, active: 0 };
    const fm = {};
    data.funnel.forEach(f => { fm[f.stage] = f.count; });
    const won  = fm.won || 0;
    const lost = fm.lost || 0;
    const total = data.funnel.reduce((s, f) => s + f.count, 0);
    return { total, won, lost, active: total - won - lost, convRate: total > 0 ? ((won / total) * 100).toFixed(1) : 0 };
  }, [data]);

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>

        {/* Header + Period Filter */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>Lead Funnel</h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0' }}>Pipeline stages, conversion rates, sources & lost reasons</p>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PERIODS.map(([v, l]) => (
              <button key={v} onClick={() => setPeriod(v)}
                style={{ padding: '7px 12px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: period === v ? '#FF7A00' : '#F3F4F6', color: period === v ? '#fff' : '#374151' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total Leads',  value: totals.total,         accent: '#3B82F6' },
            { label: 'Active',        value: totals.active,        accent: '#F59E0B' },
            { label: 'Won',           value: totals.won,           accent: '#10B981' },
            { label: 'Lost',          value: totals.lost,          accent: '#EF4444' },
            { label: 'Conv. Rate',    value: `${totals.convRate}%`, accent: '#8B5CF6' },
          ].map(c => (
            <div key={c.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', borderTop: `3px solid ${c.accent}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '6px' }}>{c.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#111' }}>{c.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading funnel data...</div>
        ) : (
          <>
            {/* Pipeline Funnel */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '20px' }}>Pipeline Stages</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {funnelData.map(f => (
                  <div key={f.stage} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '90px', fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'capitalize', textAlign: 'right', flexShrink: 0 }}>{f.stage}</div>
                    <div style={{ flex: 1, background: '#F3F4F6', borderRadius: '6px', height: '28px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ width: `${f.pct}%`, height: '100%', background: STAGE_COLORS[f.stage] || '#9CA3AF', borderRadius: '6px', transition: 'width 0.6s ease', display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                        {f.pct > 15 && <span style={{ fontSize: '10px', color: '#fff', fontWeight: 700 }}>{INR(f.value)}</span>}
                      </div>
                    </div>
                    <div style={{ width: '44px', fontSize: '13px', fontWeight: 800, color: STAGE_COLORS[f.stage] || '#374151', textAlign: 'right', flexShrink: 0 }}>{f.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Source + Priority Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

              {/* Source Pie */}
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '12px' }}>Lead Sources</div>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                      {sourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '8px' }}>
                  {sourceData.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: '#374151', fontWeight: 600 }}>{d.name}</span>
                      <span style={{ marginLeft: 'auto', color: '#9CA3AF' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Distribution */}
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>Priority Distribution</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  {priorityData.map(p => {
                    const total = priorityData.reduce((s, d) => s + d.value, 0);
                    const pct = total > 0 ? (p.value / total * 100).toFixed(0) : 0;
                    return (
                      <div key={p.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{p.name}</span>
                          <span style={{ color: '#9CA3AF' }}>{p.value} ({pct}%)</span>
                        </div>
                        <div style={{ background: '#F3F4F6', borderRadius: '4px', height: '8px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: PRIORITY_COLORS[p.name] || '#9CA3AF', borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Lost Reasons */}
                {data?.lostReasons?.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '10px' }}>Top Lost Reasons</div>
                    {data.lostReasons.map(l => (
                      <div key={l._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '5px 0', borderBottom: '1px solid #F3F4F6' }}>
                        <span style={{ color: '#374151' }}>{l._id}</span>
                        <span style={{ fontWeight: 700, color: '#EF4444' }}>{l.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Trend */}
            {trendData.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>Monthly Lead Trend (Last 12 Months)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2} name="New Leads" dot={false} />
                    <Line type="monotone" dataKey="won"   stroke="#10B981" strokeWidth={2} name="Won" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

      </div>
    </AdminLayout>
  );
}

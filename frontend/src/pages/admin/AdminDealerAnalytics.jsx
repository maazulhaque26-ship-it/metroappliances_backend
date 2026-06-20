import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import AdminLayout from './AdminLayout';
import api from '../../services/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const INR = v => `₹${(v || 0).toLocaleString('en-IN')}`;
const INR_L = v => `₹${((v || 0) / 100000).toFixed(1)}L`;

const SEGMENT_META = {
  Platinum: { color: '#D4AF37', threshold: '≥ ₹10L',    desc: 'Top tier' },
  Gold:     { color: '#F59E0B', threshold: '≥ ₹5L',     desc: 'High value' },
  Silver:   { color: '#9CA3AF', threshold: '≥ ₹1L',     desc: 'Mid tier' },
  Bronze:   { color: '#92400E', threshold: '< ₹1L',     desc: 'Growing' },
};

const PIE_COLORS = ['#D4AF37', '#F59E0B', '#9CA3AF', '#92400E'];

export default function AdminDealerAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/bi/dealers')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const trendData = useMemo(() => {
    if (!data?.trend) return [];
    return data.trend.map(d => ({
      name: MONTHS[d._id.month - 1],
      revenue: d.revenue,
      orders: d.orders,
    }));
  }, [data]);

  const segmentPieData = useMemo(() => {
    if (!data?.segments) return [];
    return Object.entries(data.segments).map(([name, value]) => ({ name, value }));
  }, [data]);

  if (loading) {
    return <AdminLayout><div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>Loading dealer analytics...</div></AdminLayout>;
  }

  const { topDealers = [], segments = {} } = data || {};

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>Dealer Analytics</h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0' }}>B2B revenue segmentation and dealer performance</p>
        </div>

        {/* Segment Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {Object.entries(SEGMENT_META).map(([seg, meta]) => (
            <div key={seg} style={{ background: '#fff', border: `1px solid ${meta.color}30`, borderRadius: '12px', padding: '18px', borderTop: `3px solid ${meta.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: meta.color }}>{seg}</div>
                <div style={{ fontSize: '10px', color: '#9CA3AF', background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{meta.threshold}</div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#111', marginBottom: '2px' }}>{segments[seg] || 0}</div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{meta.desc} dealers</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>

          {/* B2B Revenue Trend */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>B2B Revenue Trend (Last 12 Months)</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="dealerTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip formatter={(v, n) => [n === 'revenue' ? INR(v) : v, n === 'revenue' ? 'Revenue' : 'Orders']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="url(#dealerTrend)" strokeWidth={2} name="Revenue" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Segment Pie */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>Dealer Segments</div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={segmentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                  {segmentPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {segmentPieData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: PIE_COLORS[i], flexShrink: 0 }} />
                  <span style={{ color: '#374151', fontWeight: 600 }}>{d.name}</span>
                  <span style={{ marginLeft: 'auto', color: '#9CA3AF' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Dealers Table */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', fontSize: '14px', fontWeight: 700, color: '#111' }}>
            Top Dealers by Revenue
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Rank', 'Business Name', 'Location', 'Revenue', 'Orders', 'Segment'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topDealers.map((d, i) => {
                const seg = d.revenue >= 1000000 ? 'Platinum' : d.revenue >= 500000 ? 'Gold' : d.revenue >= 100000 ? 'Silver' : 'Bronze';
                const segColor = SEGMENT_META[seg]?.color || '#9CA3AF';
                return (
                  <tr key={d._id || i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#9CA3AF' }}>#{i + 1}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#111' }}>{d.businessName || '—'}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>{d.dealerCode}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{[d.city, d.state].filter(Boolean).join(', ') || '—'}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#111' }}>{INR_L(d.revenue)}</td>
                    <td style={{ padding: '12px 14px', color: '#374151' }}>{d.orders}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: segColor + '1A', color: segColor }}>{seg}</span>
                    </td>
                  </tr>
                );
              })}
              {topDealers.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No dealer data found</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </AdminLayout>
  );
}

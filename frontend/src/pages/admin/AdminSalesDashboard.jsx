import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import AdminLayout from './AdminLayout';
import api from '../../services/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const INR = v => `₹${(v || 0).toLocaleString('en-IN')}`;

const STATUS_COLORS = { Pending: '#F59E0B', Processing: '#3B82F6', Shipped: '#8B5CF6', Delivered: '#10B981', Cancelled: '#EF4444' };
const PIE_COLORS_PM = ['#FF7A00', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

export default function AdminSalesDashboard() {
  const [stats,   setStats]   = useState(null);
  const [rev,     setRev]     = useState(null);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get(`/admin/bi/revenue?period=monthly&year=${year}`),
    ]).then(([s, r]) => {
      setStats(s.data.stats || s.data);
      setRev(r.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  const monthlyBarData = useMemo(() => {
    if (!rev) return [];
    return MONTHS.map((name, i) => {
      const m = i + 1;
      return {
        name,
        revenue: rev.b2c.find(d => d._id.month === m && d._id.year === year)?.revenue || 0,
        orders:  rev.b2c.find(d => d._id.month === m && d._id.year === year)?.orders  || 0,
      };
    });
  }, [rev, year]);

  const statusPieData = useMemo(() => {
    if (!stats?.recentOrders) return [];
    const cm = {};
    stats.recentOrders.forEach(o => { cm[o.status] = (cm[o.status] || 0) + 1; });
    return Object.entries(cm).map(([name, value]) => ({ name, value }));
  }, [stats]);

  if (loading) {
    return <AdminLayout><div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>Loading sales dashboard...</div></AdminLayout>;
  }

  const avgOrderValue = stats?.totalOrders > 0 ? Math.round((stats?.totalRevenue || 0) / stats.totalOrders) : 0;
  const monthlySales = stats?.monthlySales || [];
  const thisMonthRev = monthlySales.find(m => m._id.month === new Date().getMonth() + 1 && m._id.year === year)?.revenue || 0;
  const lastMonthRev = monthlySales.find(m => m._id.month === new Date().getMonth() && m._id.year === year)?.revenue || 0;
  const monthGrowth  = lastMonthRev > 0 ? (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1) : null;

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>Sales Dashboard</h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0' }}>B2C order and revenue performance — {year}</p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total B2C Revenue', value: INR(stats?.totalRevenue),  accent: '#FF7A00', sub: monthGrowth ? `${monthGrowth >= 0 ? '▲' : '▼'} ${Math.abs(monthGrowth)}% vs last mo.` : 'All time', subColor: monthGrowth >= 0 ? '#10B981' : '#EF4444' },
            { label: 'Total Orders',      value: stats?.totalOrders || 0,   accent: '#2563EB', sub: `This month: ₹${((thisMonthRev)/1000).toFixed(0)}K`, subColor: '#9CA3AF' },
            { label: 'Avg Order Value',   value: INR(avgOrderValue),        accent: '#8B5CF6', sub: 'Per completed order', subColor: '#9CA3AF' },
            { label: 'Total Customers',   value: stats?.totalUsers || 0,    accent: '#10B981', sub: 'Registered users', subColor: '#9CA3AF' },
            { label: 'Total Products',    value: stats?.totalProducts || 0, accent: '#D4AF37', sub: 'Active in catalog', subColor: '#9CA3AF' },
          ].map(c => (
            <div key={c.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '18px', borderTop: `3px solid ${c.accent}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '6px' }}>{c.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#111', marginBottom: '4px' }}>{c.value}</div>
              <div style={{ fontSize: '11px', color: c.subColor }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>

          {/* Monthly Revenue Bar Chart */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>Monthly B2C Revenue — {year}</div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={monthlyBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip formatter={(v, n) => [n === 'revenue' ? INR(v) : v, n === 'revenue' ? 'Revenue' : 'Orders']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="revenue" fill="#FF7A00" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '12px' }}>Recent Order Status</div>
            {statusPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                      {statusPieData.map((d, i) => <Cell key={i} fill={STATUS_COLORS[d.name] || PIE_COLORS_PM[i % PIE_COLORS_PM.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '8px' }}>
                  {statusPieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[d.name] || '#9CA3AF', flexShrink: 0 }} />
                      <span style={{ color: '#374151', fontWeight: 600 }}>{d.name}</span>
                      <span style={{ marginLeft: 'auto', color: '#9CA3AF' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '20px', textAlign: 'center' }}>No recent orders</div>
            )}
          </div>
        </div>

        {/* Recent Orders Table */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', fontSize: '14px', fontWeight: 700, color: '#111' }}>Recent Orders</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Order #', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stats?.recentOrders || []).map(o => (
                <tr key={o._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600, color: '#111', fontSize: '12px' }}>{o.orderNumber}</td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{o.user?.name || '—'}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#FF7A00' }}>{INR(o.totalPrice)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLORS[o.status] || '#9CA3AF') + '1A', color: STATUS_COLORS[o.status] || '#9CA3AF' }}>{o.status}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: '12px' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </AdminLayout>
  );
}

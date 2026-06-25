import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import AdminLayout from './AdminLayout';
import api from '../../services/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const INR = v => `₹${(v || 0).toLocaleString('en-IN')}`;

function buildChartData(b2c, b2b, period, year) {
  if (period === 'monthly') {
    return MONTHS.map((name, i) => {
      const m = i + 1;
      return { name, b2c: b2c.find(d => d._id.month === m && d._id.year === year)?.revenue || 0, b2b: b2b.find(d => d._id.month === m && d._id.year === year)?.revenue || 0 };
    });
  }
  if (period === 'quarterly') {
    return [1, 2, 3, 4].map(q => ({
      name: `Q${q}`,
      b2c: b2c.find(d => d._id.quarter === q)?.revenue || 0,
      b2b: b2b.find(d => d._id.quarter === q)?.revenue || 0,
    }));
  }
  if (period === 'yearly') {
    const yrs = [...new Set([...b2c.map(d => d._id.year), ...b2b.map(d => d._id.year)])].sort();
    return yrs.map(y => ({ name: String(y), b2c: b2c.find(d => d._id.year === y)?.revenue || 0, b2b: b2b.find(d => d._id.year === y)?.revenue || 0 }));
  }
  if (period === 'weekly') {
    const wks = [...new Set([...b2c.map(d => d._id.week), ...b2b.map(d => d._id.week)])].sort((a, b) => a - b);
    return wks.map(w => ({ name: `W${w}`, b2c: b2c.find(d => d._id.week === w)?.revenue || 0, b2b: b2b.find(d => d._id.week === w)?.revenue || 0 }));
  }
  // daily
  const mp = {};
  b2c.forEach(d => { const k = `${String(d._id.day).padStart(2,'0')}/${String(d._id.month).padStart(2,'0')}`; mp[k] = { ...mp[k], b2c: d.revenue }; });
  b2b.forEach(d => { const k = `${String(d._id.day).padStart(2,'0')}/${String(d._id.month).padStart(2,'0')}`; mp[k] = { ...mp[k], b2b: d.revenue }; });
  return Object.entries(mp).sort(([a], [b]) => a.localeCompare(b)).map(([name, v]) => ({ name, b2c: v.b2c || 0, b2b: v.b2b || 0 }));
}

const PERIODS = [['daily','Daily'],['weekly','Weekly'],['monthly','Monthly'],['quarterly','Quarterly'],['yearly','Yearly']];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => THIS_YEAR - i);

export default function AdminRevenueAnalytics() {
  const [data,    setData]    = useState(null);
  const [period,  setPeriod]  = useState('monthly');
  const [year,    setYear]    = useState(THIS_YEAR);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/admin/bi/revenue?period=${period}&year=${year}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period, year]);

  useEffect(() => { load(); }, [load]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return buildChartData(data.b2c, data.b2b, period, year);
  }, [data, period, year]);

  const totals = useMemo(() => chartData.reduce((a, d) => ({ b2c: a.b2c + d.b2c, b2b: a.b2b + d.b2b }), { b2c: 0, b2b: 0 }), [chartData]);

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>Revenue Analytics</h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0' }}>B2C + B2B combined revenue across time periods</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select value={period} onChange={e => setPeriod(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: '#fff' }}>
              {PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {period !== 'yearly' && (
              <select value={year} onChange={e => setYear(Number(e.target.value))}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: '#fff' }}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Combined Revenue', value: INR(totals.b2c + totals.b2b), accent: '#FF7A00' },
            { label: 'B2C Revenue',      value: INR(totals.b2c),              accent: '#F59E0B' },
            { label: 'B2B Revenue',      value: INR(totals.b2b),              accent: '#2563EB' },
            { label: 'B2B Share',        value: totals.b2c + totals.b2b > 0 ? `${((totals.b2b / (totals.b2c + totals.b2b)) * 100).toFixed(1)}%` : '0%', accent: '#10B981' },
          ].map(c => (
            <div key={c.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '18px', borderTop: `3px solid ${c.accent}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '8px' }}>{c.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#111' }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>
            {period.charAt(0).toUpperCase() + period.slice(1)} Revenue{period !== 'yearly' ? ` — ${year}` : ' (All Years)'}
          </div>
          {loading ? (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px' }}>Loading chart data...</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revB2C" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF7A00" stopOpacity={0.15}/><stop offset="95%" stopColor="#FF7A00" stopOpacity={0}/></linearGradient>
                  <linearGradient id="revB2B" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/><stop offset="95%" stopColor="#2563EB" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={52} />
                <Tooltip formatter={(v, n) => [INR(v), n === 'b2c' ? 'B2C Revenue' : 'B2B Revenue']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="b2c" stroke="#FF7A00" fill="url(#revB2C)" strokeWidth={2} name="B2C" dot={false} />
                <Area type="monotone" dataKey="b2b" stroke="#2563EB" fill="url(#revB2B)" strokeWidth={2} name="B2B" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Data Table */}
        {!loading && chartData.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '500px' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Period', 'B2C Revenue', 'B2B Revenue', 'Combined', 'B2B %'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.map(d => {
                  const combined = d.b2c + d.b2b;
                  return (
                    <tr key={d.name} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: '#374151' }}>{d.name}</td>
                      <td style={{ padding: '10px 16px', color: '#FF7A00', fontWeight: 600 }}>{INR(d.b2c)}</td>
                      <td style={{ padding: '10px 16px', color: '#2563EB', fontWeight: 600 }}>{INR(d.b2b)}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: '#111' }}>{INR(combined)}</td>
                      <td style={{ padding: '10px 16px', color: '#9CA3AF' }}>{combined > 0 ? `${((d.b2b / combined) * 100).toFixed(0)}%` : '—'}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#F9FAFB' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 800, color: '#111' }}>Total</td>
                  <td style={{ padding: '10px 16px', color: '#FF7A00', fontWeight: 800 }}>{INR(totals.b2c)}</td>
                  <td style={{ padding: '10px 16px', color: '#2563EB', fontWeight: 800 }}>{INR(totals.b2b)}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 800, color: '#111' }}>{INR(totals.b2c + totals.b2b)}</td>
                  <td style={{ padding: '10px 16px', color: '#9CA3AF', fontWeight: 700 }}>
                    {totals.b2c + totals.b2b > 0 ? `${((totals.b2b / (totals.b2c + totals.b2b)) * 100).toFixed(1)}%` : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

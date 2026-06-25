import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import AdminLayout from './AdminLayout';
import api from '../../services/api';

const INR = v => `₹${(v || 0).toLocaleString('en-IN')}`;

export default function AdminTerritoryAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('leads');

  useEffect(() => {
    api.get('/admin/bi/territories')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const territories = useMemo(() => {
    if (!data?.territories) return [];
    return [...data.territories].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
  }, [data, sortKey]);

  const stateBarData = useMemo(() => {
    if (!data?.stateStats) return [];
    return data.stateStats.slice(0, 15).map(s => ({ name: s._id, leads: s.leads, won: s.won }));
  }, [data]);

  const totalLeads    = territories.reduce((s, t) => s + t.leads, 0);
  const totalWon      = territories.reduce((s, t) => s + t.won, 0);
  const totalDealers  = territories.reduce((s, t) => s + t.dealerCount, 0);
  const totalAgents   = territories.reduce((s, t) => s + t.agentCount, 0);

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>Territory Analytics</h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0' }}>Geographic sales performance by territory and state</p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Territories',  value: territories.length, accent: '#FF7A00' },
            { label: 'Total Leads',  value: totalLeads,          accent: '#3B82F6' },
            { label: 'Won Leads',    value: totalWon,            accent: '#10B981' },
            { label: 'Conv. Rate',   value: totalLeads > 0 ? `${((totalWon / totalLeads) * 100).toFixed(1)}%` : '0%', accent: '#8B5CF6' },
            { label: 'Dealers',      value: totalDealers,        accent: '#F59E0B' },
            { label: 'Agents',       value: totalAgents,         accent: '#D4AF37' },
          ].map(c => (
            <div key={c.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', borderTop: `3px solid ${c.accent}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '6px' }}>{c.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#111' }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* State Bar Chart */}
        {stateBarData.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>Leads by State (Top 15)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stateBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: '#374151' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, n) => [v, n === 'leads' ? 'Total Leads' : 'Won Leads']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="leads" fill="#E5E7EB" radius={[0, 4, 4, 0]} name="Total Leads" />
                <Bar dataKey="won"   fill="#FF7A00" radius={[0, 4, 4, 0]} name="Won Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Territory Table */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>Territory Details</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[['leads','By Leads'],['won','By Won'],['dealerCount','By Dealers'],['agentCount','By Agents']].map(([k, l]) => (
                <button key={k} onClick={() => setSortKey(k)}
                  style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: sortKey === k ? '#FF7A00' : '#F3F4F6', color: sortKey === k ? '#fff' : '#374151' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Territory', 'States', 'Primary Agent', 'Agents', 'Dealers', 'Leads', 'Won', 'Conv %', 'Est. Value'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {territories.map(t => (
                  <tr key={t._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#111' }}>{t.name}</div>
                      <div style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace' }}>{t.code}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '11px' }}>{(t.states || []).slice(0, 3).join(', ') || '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#374151', fontSize: '12px' }}>{t.primaryAgent?.name || '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#374151', fontWeight: 600 }}>{t.agentCount}</td>
                    <td style={{ padding: '12px 14px', color: '#374151', fontWeight: 600 }}>{t.dealerCount}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#3B82F6' }}>{t.leads}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#10B981' }}>{t.won}</td>
                    <td style={{ padding: '12px 14px', color: '#9CA3AF' }}>{t.leads > 0 ? `${((t.won / t.leads) * 100).toFixed(1)}%` : '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#FF7A00', fontWeight: 600 }}>{INR(t.value)}</td>
                  </tr>
                ))}
                {territories.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No territories found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}

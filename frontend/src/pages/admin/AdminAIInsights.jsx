import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import * as api from '../../services/copilotAPI';

const TYPE_COLORS = { daily_briefing: '#6366F1', dept_summary: '#F59E0B', kpi_digest: '#3B82F6', monthly_summary: '#8B5CF6', risk_summary: '#EF4444', opportunity_summary: '#10B981', anomaly_report: '#F97316', custom: '#9CA3AF' };

export default function AdminAIInsights() {
  const [insights, setInsights] = useState([]);
  const [total, setTotal]       = useState(0);
  const [filter, setFilter]     = useState({ type: '', isRead: '' });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    const p = { limit: 30 };
    if (filter.type)   p.type   = filter.type;
    if (filter.isRead) p.isRead = filter.isRead;
    api.listInsights(p).then(r => { setInsights(r.data?.data || []); setTotal(r.data?.total || 0); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  async function open(ins) {
    const r = await api.getInsight(ins._id).catch(() => null);
    setSelected(r?.data || ins);
    setInsights(p => p.map(i => i._id === ins._id ? { ...i, isRead: true } : i));
  }

  async function remove(id, e) {
    e.stopPropagation();
    await api.deleteInsight(id).catch(() => {});
    setInsights(p => p.filter(i => i._id !== id));
    if (selected?._id === id) setSelected(null);
    setTotal(p => p - 1);
  }

  const unread = insights.filter(i => !i.isRead).length;
  const card   = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 20 };

  return (
    <AdminLayout>
      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>AI Insights</h1>
            <p style={{ color: '#6B7280', margin: 0 }}>{total} insights · {unread} unread</p>
          </div>
          <a href="/admin/ai-copilot/briefing" style={{ padding: '10px 20px', background: '#6366F1', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            + Generate Briefing
          </a>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <select value={filter.type} onChange={e => setFilter(p => ({ ...p, type: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }}>
            <option value="">All Types</option>
            {Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
          </select>
          <select value={filter.isRead} onChange={e => setFilter(p => ({ ...p, isRead: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }}>
            <option value="">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '360px 1fr' : '1fr', gap: 24 }}>
          {/* List */}
          <div style={card}>
            {loading ? <p style={{ color: '#9CA3AF' }}>Loading…</p> : insights.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', padding: 40 }}>No insights found. Generate a briefing to get started.</p>
            ) : insights.map(ins => (
              <div key={ins._id} onClick={() => open(ins)}
                style={{ padding: '12px 14px', marginBottom: 8, borderRadius: 8, border: `1px solid ${selected?._id === ins._id ? TYPE_COLORS[ins.type] || '#E5E7EB' : '#E5E7EB'}`, cursor: 'pointer', background: selected?._id === ins._id ? '#F5F3FF' : '#F9FAFB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: `${TYPE_COLORS[ins.type] || '#9CA3AF'}22`, color: TYPE_COLORS[ins.type] || '#9CA3AF', fontWeight: 600 }}>{ins.type?.replace(/_/g,' ')}</span>
                      {!ins.isRead && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 9999, background: '#6366F1', color: '#fff', fontWeight: 600 }}>NEW</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{ins.title}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(ins.createdAt).toLocaleString()}</div>
                  </div>
                  <button onClick={(e) => remove(ins._id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, padding: '0 4px' }}>×</button>
                </div>
              </div>
            ))}
          </div>

          {/* Detail */}
          {selected && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 9999, background: `${TYPE_COLORS[selected.type] || '#9CA3AF'}22`, color: TYPE_COLORS[selected.type] || '#9CA3AF', fontWeight: 600 }}>{selected.type?.replace(/_/g,' ')}</span>
                  <h2 style={{ margin: '8px 0 4px', fontSize: 20, fontWeight: 700 }}>{selected.title}</h2>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(selected.createdAt).toLocaleString()}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: '#9CA3AF' }}>×</button>
              </div>

              <div style={{ fontSize: 15, lineHeight: 1.7, color: '#374151', padding: '16px', background: '#F9FAFB', borderRadius: 8, marginBottom: 16 }}>
                {selected.content}
              </div>

              {selected.highlights?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#059669', marginBottom: 8 }}>Highlights</div>
                  {selected.highlights.map((h, i) => <div key={i} style={{ padding: '6px 12px', marginBottom: 4, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, fontSize: 13 }}>✓ {h}</div>)}
                </div>
              )}
              {selected.risks?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', marginBottom: 8 }}>Risks</div>
                  {selected.risks.map((r, i) => <div key={i} style={{ padding: '6px 12px', marginBottom: 4, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, fontSize: 13 }}>⚠ {r}</div>)}
                </div>
              )}
              {selected.opportunities?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2563EB', marginBottom: 8 }}>Opportunities</div>
                  {selected.opportunities.map((o, i) => <div key={i} style={{ padding: '6px 12px', marginBottom: 4, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 13 }}>→ {o}</div>)}
                </div>
              )}
              {selected.recommendations?.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED', marginBottom: 8 }}>Recommendations</div>
                  {selected.recommendations.map((r, i) => <div key={i} style={{ padding: '6px 12px', marginBottom: 4, background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 6, fontSize: 13 }}>★ {r}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

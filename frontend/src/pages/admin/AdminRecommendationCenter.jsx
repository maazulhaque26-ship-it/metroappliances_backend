import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import * as api from '../../services/copilotAPI';

const PRIORITY_COLORS = { critical: '#DC2626', high: '#D97706', medium: '#2563EB', low: '#059669' };
const STATUS_COLORS   = { pending: '#6B7280', applied: '#059669', dismissed: '#9CA3AF', expired: '#EF4444' };

export default function AdminRecommendationCenter() {
  const [items, setItems]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [filter, setFilter] = useState({ type: '', status: '', priority: '' });
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg]       = useState('');

  const load = () => {
    const p = { limit: 30 };
    if (filter.type)     p.type     = filter.type;
    if (filter.status)   p.status   = filter.status;
    if (filter.priority) p.priority = filter.priority;
    api.listSuggestions(p).then(r => { setItems(r.data?.data || []); setTotal(r.data?.total || 0); }).catch(() => {});
  };

  useEffect(() => { load(); }, [filter]);

  async function generate() {
    setGenerating(true);
    setMsg('');
    try {
      const r = await api.generateSuggestions();
      setMsg(`Generated ${r.data?.suggestions?.length || 0} suggestions`);
      load();
    } catch { setMsg('Error generating suggestions'); }
    setGenerating(false);
    setTimeout(() => setMsg(''), 4000);
  }

  async function apply(id) {
    await api.applySuggestion(id).catch(() => {});
    load();
  }

  async function dismiss(id) {
    await api.dismissSuggestion(id).catch(() => {});
    load();
  }

  const TYPES = ['purchase','replenishment','production_plan','budget_alert','project_risk','maintenance_schedule','customer_followup','vendor_reminder','hr_reminder','finance_alert'];
  const card  = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 20 };

  return (
    <AdminLayout>
      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>AI Recommendations</h1>
            <p style={{ color: '#6B7280', margin: 0 }}>{total} suggestions · AI-driven ERP recommendations</p>
          </div>
          <button onClick={generate} disabled={generating}
            style={{ padding: '10px 20px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: generating ? 0.6 : 1 }}>
            {generating ? 'Scanning ERP…' : 'Generate Suggestions'}
          </button>
        </div>

        {msg && <div style={{ padding: '10px 16px', background: '#D1FAE5', borderRadius: 8, marginBottom: 16, fontSize: 14, color: '#065F46' }}>{msg}</div>}

        {/* Summary Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {['pending','applied','dismissed'].map(s => {
            const count = items.filter(i => i.status === s).length;
            return (
              <div key={s} style={{ ...card, marginBottom: 0, flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: STATUS_COLORS[s] }}>{count}</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4, textTransform: 'capitalize' }}>{s}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <select value={filter.type} onChange={e => setFilter(p => ({ ...p, type: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }}>
            <option value="">All Types</option>{TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
          </select>
          <select value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }}>
            <option value="">All Status</option>{['pending','applied','dismissed','expired'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filter.priority} onChange={e => setFilter(p => ({ ...p, priority: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }}>
            <option value="">All Priority</option>{['critical','high','medium','low'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Suggestion Cards */}
        {items.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
            <div style={{ fontSize: 16, color: '#6B7280' }}>No suggestions yet. Click "Generate Suggestions" to scan your ERP data.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {items.map(s => (
              <div key={s._id} style={{ ...card, marginBottom: 0, borderLeft: `4px solid ${PRIORITY_COLORS[s.priority] || '#9CA3AF'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: `${PRIORITY_COLORS[s.priority] || '#9CA3AF'}22`, color: PRIORITY_COLORS[s.priority] || '#9CA3AF', fontWeight: 600 }}>{s.priority}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: '#F3F4F6', color: '#6B7280' }}>{s.type?.replace(/_/g,' ')}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: `${STATUS_COLORS[s.status] || '#9CA3AF'}22`, color: STATUS_COLORS[s.status] || '#9CA3AF' }}>{s.status}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{s.title}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>{s.description}</div>
                {s.estimatedImpact && <div style={{ fontSize: 12, color: '#6366F1', marginBottom: 10 }}>Impact: {s.estimatedImpact}</div>}
                {s.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => apply(s._id)} style={{ padding: '6px 14px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Apply</button>
                    <button onClick={() => dismiss(s._id)} style={{ padding: '6px 14px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Dismiss</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

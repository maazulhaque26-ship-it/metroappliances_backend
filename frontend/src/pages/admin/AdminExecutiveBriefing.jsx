import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import * as api from '../../services/copilotAPI';

const BRIEFING_TYPES = [
  { key: 'daily', label: 'Daily Briefing', fn: () => api.generateDailyBriefing(), color: '#6366F1' },
  { key: 'kpi',   label: 'KPI Digest',     fn: () => api.generateKPIDigest(),     color: '#3B82F6' },
  { key: 'risk',  label: 'Risk Summary',   fn: () => api.generateRiskSummary(),   color: '#EF4444' },
  { key: 'opp',   label: 'Opportunities',  fn: () => api.generateOpportunitySummary(), color: '#10B981' },
  { key: 'dept',  label: 'Dept Summary',   fn: (dept) => api.generateDeptSummary({ dept }), color: '#F59E0B' },
  { key: 'monthly', label: 'Monthly Summary', fn: () => api.generateMonthlySummary(), color: '#8B5CF6' },
];

export default function AdminExecutiveBriefing() {
  const [insights, setInsights] = useState([]);
  const [selected, setSelected] = useState(null);
  const [generating, setGenerating] = useState('');
  const [msg, setMsg]           = useState('');
  const [dept, setDept]         = useState('all');

  const loadInsights = () => {
    api.listInsights({ limit: 20 }).then(r => setInsights(r.data?.data || [])).catch(() => {});
  };

  useEffect(() => { loadInsights(); }, []);

  async function generate(type) {
    setGenerating(type.key);
    setMsg('');
    try {
      const fn = type.key === 'dept' ? () => type.fn(dept) : type.fn;
      await fn();
      setMsg(`${type.label} generated`);
      loadInsights();
    } catch { setMsg(`Failed to generate ${type.label}`); }
    setGenerating('');
    setTimeout(() => setMsg(''), 4000);
  }

  async function viewInsight(ins) {
    const r = await api.getInsight(ins._id).catch(() => null);
    setSelected(r?.data || ins);
    loadInsights();
  }

  async function removeInsight(id, e) {
    e.stopPropagation();
    await api.deleteInsight(id).catch(() => {});
    loadInsights();
    if (selected?._id === id) setSelected(null);
  }

  const card = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 20 };
  const typeColor = { daily_briefing: '#6366F1', kpi_digest: '#3B82F6', risk_summary: '#EF4444', opportunity_summary: '#10B981', dept_summary: '#F59E0B', monthly_summary: '#8B5CF6', custom: '#9CA3AF' };

  return (
    <AdminLayout>
      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px' }}>Executive Briefings</h1>
        <p style={{ color: '#6B7280', marginBottom: 28 }}>Generate AI-powered executive summaries, KPI digests, and risk assessments.</p>

        {msg && <div style={{ padding: '10px 16px', background: '#D1FAE5', borderRadius: 8, marginBottom: 16, fontSize: 14, color: '#065F46' }}>{msg}</div>}

        {/* Generate Buttons */}
        <div style={{ ...card }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Generate Briefing</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {BRIEFING_TYPES.map(t => (
              <React.Fragment key={t.key}>
                {t.key === 'dept' && (
                  <select value={dept} onChange={e => setDept(e.target.value)} style={{ padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }}>
                    {['all','hr','finance','operations','manufacturing'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
                <button onClick={() => generate(t)} disabled={generating === t.key}
                  style={{ padding: '10px 20px', background: t.color, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: generating === t.key ? 0.6 : 1 }}>
                  {generating === t.key ? 'Generating…' : t.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '340px 1fr' : '1fr', gap: 24 }}>
          {/* Insights List */}
          <div style={card}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Recent Briefings</h3>
            {insights.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: 14 }}>No briefings yet. Generate one above.</p>
            ) : insights.map(ins => (
              <div key={ins._id} onClick={() => viewInsight(ins)}
                style={{ padding: '12px 14px', marginBottom: 8, borderRadius: 8, border: `1px solid ${selected?._id === ins._id ? typeColor[ins.type] || '#E5E7EB' : '#E5E7EB'}`, cursor: 'pointer', background: selected?._id === ins._id ? '#F5F3FF' : '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: `${typeColor[ins.type] || '#9CA3AF'}22`, color: typeColor[ins.type] || '#9CA3AF', fontWeight: 600 }}>{ins.type?.replace(/_/g,' ')}</span>
                    {!ins.isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', display: 'inline-block' }} />}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{ins.title}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(ins.createdAt).toLocaleString()}</div>
                </div>
                <button onClick={(e) => removeInsight(ins._id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, padding: '0 4px' }}>×</button>
              </div>
            ))}
          </div>

          {/* Detail View */}
          {selected && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 9999, background: `${typeColor[selected.type] || '#9CA3AF'}22`, color: typeColor[selected.type] || '#9CA3AF', fontWeight: 600 }}>{selected.type?.replace(/_/g,' ')}</span>
                  <h2 style={{ margin: '8px 0 4px', fontSize: 20, fontWeight: 700 }}>{selected.title}</h2>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(selected.createdAt).toLocaleString()}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: '#9CA3AF' }}>×</button>
              </div>

              <div style={{ fontSize: 15, lineHeight: 1.7, color: '#374151', marginBottom: 20, padding: '16px', background: '#F9FAFB', borderRadius: 8 }}>
                {selected.content}
              </div>

              {selected.highlights?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#059669', marginBottom: 8 }}>Highlights</div>
                  {selected.highlights.map((h, i) => (
                    <div key={i} style={{ padding: '6px 12px', marginBottom: 4, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, fontSize: 13 }}>✓ {h}</div>
                  ))}
                </div>
              )}

              {selected.risks?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', marginBottom: 8 }}>Risks</div>
                  {selected.risks.map((r, i) => (
                    <div key={i} style={{ padding: '6px 12px', marginBottom: 4, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, fontSize: 13 }}>⚠ {r}</div>
                  ))}
                </div>
              )}

              {selected.opportunities?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2563EB', marginBottom: 8 }}>Opportunities</div>
                  {selected.opportunities.map((o, i) => (
                    <div key={i} style={{ padding: '6px 12px', marginBottom: 4, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 13 }}>→ {o}</div>
                  ))}
                </div>
              )}

              {selected.recommendations?.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED', marginBottom: 8 }}>Recommendations</div>
                  {selected.recommendations.map((r, i) => (
                    <div key={i} style={{ padding: '6px 12px', marginBottom: 4, background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 6, fontSize: 13 }}>★ {r}</div>
                  ))}
                </div>
              )}

              {selected.kpis && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>KPIs</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {Object.entries(selected.kpis).map(([k, v]) => (
                      <div key={k} style={{ padding: '10px 14px', background: '#F3F4F6', borderRadius: 8, textAlign: 'center', minWidth: 100 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#6366F1' }}>{typeof v === 'object' ? v.value ?? '—' : v}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{k}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

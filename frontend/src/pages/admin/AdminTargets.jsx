import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../services/api';

const PERIOD_LABELS = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' };
const TYPE_LABELS   = { overall: 'Overall', agent: 'Agent', territory: 'Territory' };
const MONTH_NAMES   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const THIS_YEAR     = new Date().getFullYear();
const YEARS         = Array.from({ length: 5 }, (_, i) => THIS_YEAR - i);
const INR = v => `₹${(v || 0).toLocaleString('en-IN')}`;

function ProgressBar({ label, actual, target, color = '#FF7A00' }) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const over = target > 0 && actual > target;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
        <span style={{ color: '#374151', fontWeight: 600 }}>{label}</span>
        <span style={{ color: over ? '#10B981' : '#9CA3AF' }}>
          {actual} / {target} {target > 0 ? `(${((actual / target) * 100).toFixed(0)}%)` : ''}
        </span>
      </div>
      <div style={{ background: '#F3F4F6', borderRadius: '4px', height: '8px' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: over ? '#10B981' : color, borderRadius: '4px', transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#111' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const EMPTY_FORM = { period: 'monthly', year: THIS_YEAR, month: new Date().getMonth() + 1, quarter: Math.ceil((new Date().getMonth() + 1) / 3), targetType: 'overall', agent: '', territory: '', targetRevenue: '', targetB2BRevenue: '', targetLeads: '', targetConversions: '', targetVisits: '', notes: '' };

export default function AdminTargets() {
  const [targets,     setTargets]     = useState([]);
  const [agents,      setAgents]      = useState([]);
  const [territories, setTerritories] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [achievement, setAchievement] = useState(null);
  const [achLoading,  setAchLoading]  = useState(false);

  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterYear,   setFilterYear]   = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterPeriod) params.set('period', filterPeriod);
    if (filterYear)   params.set('year',   filterYear);
    api.get(`/admin/bi/targets?${params}`)
      .then(r => setTargets(r.data.targets || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterPeriod, filterYear]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/admin/sales-agents?limit=200').then(r => setAgents(r.data.agents || [])).catch(() => {});
    api.get('/admin/territories?limit=200').then(r => setTerritories(r.data.territories || [])).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { ...form };
      if (body.targetType !== 'agent')     delete body.agent;
      if (body.targetType !== 'territory') delete body.territory;
      if (body.period !== 'monthly')       delete body.month;
      if (body.period !== 'quarterly')     delete body.quarter;
      ['targetRevenue','targetB2BRevenue','targetLeads','targetConversions','targetVisits'].forEach(k => { if (body[k] !== '') body[k] = Number(body[k]); });

      if (modal?.target?._id) {
        await api.put(`/admin/bi/targets/${modal.target._id}`, body);
      } else {
        await api.post('/admin/bi/targets', body);
      }
      setModal(null);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error saving target');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this target?')) return;
    try { await api.delete(`/admin/bi/targets/${id}`); load(); }
    catch (e) { alert(e?.response?.data?.message || 'Error'); }
  };

  const viewAchievement = async (t) => {
    setModal({ type: 'achievement', target: t });
    setAchLoading(true);
    setAchievement(null);
    try {
      const r = await api.get(`/admin/bi/targets/${t._id}/achievement`);
      setAchievement(r.data.achievement);
    } catch { setAchievement(null); }
    finally { setAchLoading(false); }
  };

  const getPeriodLabel = (t) => {
    if (t.period === 'monthly')   return `${MONTH_NAMES[(t.month || 1) - 1]} ${t.year}`;
    if (t.period === 'quarterly') return `Q${t.quarter} ${t.year}`;
    return String(t.year);
  };

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setModal({ type: 'form' }); };
  const openEdit   = (t) => {
    setForm({
      period: t.period, year: t.year, month: t.month || new Date().getMonth() + 1,
      quarter: t.quarter || Math.ceil((new Date().getMonth() + 1) / 3),
      targetType: t.targetType, agent: t.agent?._id || '', territory: t.territory?._id || '',
      targetRevenue: t.targetRevenue, targetB2BRevenue: t.targetB2BRevenue,
      targetLeads: t.targetLeads, targetConversions: t.targetConversions, targetVisits: t.targetVisits,
      notes: t.notes || '',
    });
    setModal({ type: 'form', target: t });
  };

  const F = ({ label, name, type = 'number', children }) => (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{label}</label>
      {children || (
        <input type={type} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>Targets</h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0' }}>Set monthly, quarterly and yearly targets — track achievement</p>
          </div>
          <button onClick={openCreate}
            style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            + New Target
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', background: '#fff', cursor: 'pointer' }}>
            <option value="">All Periods</option>
            {Object.entries(PERIOD_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', background: '#fff', cursor: 'pointer' }}>
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Target Cards */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>Loading targets...</div>
        ) : targets.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '13px' }}>
            No targets found. Click <strong>+ New Target</strong> to get started.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {targets.map(t => (
              <div key={t._id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#111' }}>{getPeriodLabel(t)}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                      {PERIOD_LABELS[t.period]} · {TYPE_LABELS[t.targetType]}
                      {t.agent && ` · ${t.agent.name}`}
                      {t.territory && ` · ${t.territory.name}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => viewAchievement(t)}
                      style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #BFDBFE', background: '#EFF6FF', fontSize: '11px', fontWeight: 600, color: '#1D4ED8', cursor: 'pointer' }}>Track</button>
                    <button onClick={() => openEdit(t)}
                      style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '11px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(t._id)}
                      style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', fontSize: '11px', fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}>Del</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  {[
                    ['Revenue Target', INR(t.targetRevenue)],
                    ['B2B Revenue',    INR(t.targetB2BRevenue)],
                    ['Leads Target',  t.targetLeads],
                    ['Conversions',   t.targetConversions],
                    ['Visits',        t.targetVisits],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ color: '#9CA3AF', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                      <div style={{ color: '#111', fontWeight: 700 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {t.notes && <div style={{ marginTop: '10px', fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic' }}>{t.notes}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {modal?.type === 'form' && (
          <Modal title={modal?.target ? 'Edit Target' : 'New Target'} onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <F label="Period">
                  <select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
                    {Object.entries(PERIOD_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </F>
                <F label="Year">
                  <select value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </F>
                {form.period === 'monthly' && (
                  <F label="Month">
                    <select value={form.month} onChange={e => setForm(f => ({ ...f, month: Number(e.target.value) }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
                      {MONTH_NAMES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                  </F>
                )}
                {form.period === 'quarterly' && (
                  <F label="Quarter">
                    <select value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: Number(e.target.value) }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
                      {[1,2,3,4].map(q => <option key={q} value={q}>Q{q}</option>)}
                    </select>
                  </F>
                )}
                <F label="Target Type">
                  <select value={form.targetType} onChange={e => setForm(f => ({ ...f, targetType: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
                    {Object.entries(TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </F>
                {form.targetType === 'agent' && (
                  <F label="Agent">
                    <select value={form.agent} onChange={e => setForm(f => ({ ...f, agent: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
                      <option value="">Select agent</option>
                      {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.agentCode})</option>)}
                    </select>
                  </F>
                )}
                {form.targetType === 'territory' && (
                  <F label="Territory">
                    <select value={form.territory} onChange={e => setForm(f => ({ ...f, territory: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
                      <option value="">Select territory</option>
                      {territories.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </F>
                )}
              </div>
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Targets (₹)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <F label="B2C + B2B Revenue" name="targetRevenue" />
                  <F label="B2B Revenue"        name="targetB2BRevenue" />
                </div>
              </div>
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activity Targets</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <F label="Leads"       name="targetLeads" />
                  <F label="Conversions" name="targetConversions" />
                  <F label="Visits"      name="targetVisits" />
                </div>
              </div>
              <F label="Notes" name="notes" type="text">
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
              </F>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : (modal?.target ? 'Update Target' : 'Create Target')}
              </button>
            </div>
          </Modal>
        )}

        {/* Achievement Modal */}
        {modal?.type === 'achievement' && (
          <Modal title={`Achievement — ${modal.target ? getPeriodLabel(modal.target) : ''}`} onClose={() => { setModal(null); setAchievement(null); }}>
            {achLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Calculating achievement...</div>
            ) : !achievement ? (
              <div style={{ padding: '20px', color: '#EF4444', fontSize: '13px' }}>Failed to load achievement data.</div>
            ) : (
              <div>
                <div style={{ marginBottom: '16px', padding: '12px', background: '#F9FAFB', borderRadius: '8px', fontSize: '12px', color: '#374151' }}>
                  <strong>{PERIOD_LABELS[modal.target.period]}</strong> target for <strong>{getPeriodLabel(modal.target)}</strong>
                </div>
                <ProgressBar label="Combined Revenue" actual={achievement.revenue.actual}  target={achievement.revenue.target}     color="#FF7A00" />
                <ProgressBar label="B2B Revenue"      actual={achievement.b2bRevenue.actual} target={achievement.b2bRevenue.target}  color="#2563EB" />
                <ProgressBar label="Leads"            actual={achievement.leads.actual}      target={achievement.leads.target}       color="#3B82F6" />
                <ProgressBar label="Conversions"      actual={achievement.conversions.actual} target={achievement.conversions.target} color="#10B981" />
                <ProgressBar label="Visits"           actual={achievement.visits.actual}     target={achievement.visits.target}      color="#8B5CF6" />
                <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    ['Revenue',     achievement.revenue],
                    ['B2B Revenue', achievement.b2bRevenue],
                    ['Leads',       achievement.leads],
                    ['Conversions', achievement.conversions],
                  ].map(([l, a]) => {
                    const color = a.pct === null ? '#9CA3AF' : a.pct >= 100 ? '#10B981' : a.pct >= 75 ? '#F59E0B' : '#EF4444';
                    return (
                      <div key={l} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{l}</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color }}>{a.pct !== null ? `${a.pct}%` : '—'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Modal>
        )}

      </div>
    </AdminLayout>
  );
}

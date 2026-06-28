import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import * as api from '../../services/copilotAPI';

const TRIGGERS   = ['schedule','event','condition','manual','webhook'];
const CATEGORIES = ['approval','reminder','notification','escalation','replenishment','maintenance','reporting','custom'];

export default function AdminCopilotRules() {
  const [rules, setRules]     = useState([]);
  const [templates, setTemplates] = useState([]);
  const [total, setTotal]     = useState(0);
  const [filter, setFilter]   = useState({ trigger: '', category: '', isActive: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState({ name: '', description: '', trigger: 'manual', category: 'custom', schedule: '' });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  const load = () => {
    const p = {};
    if (filter.trigger)  p.trigger  = filter.trigger;
    if (filter.category) p.category = filter.category;
    if (filter.isActive) p.isActive = filter.isActive;
    api.listRules(p).then(r => { setRules(r.data?.data || []); setTotal(r.data?.total || 0); }).catch(() => {});
  };

  useEffect(() => { load(); }, [filter]);
  useEffect(() => { api.listTemplates().then(r => setTemplates(r.data || [])).catch(() => {}); }, []);

  async function saveRule() {
    setSaving(true);
    try {
      await api.createRule(form);
      setMsg('Rule created');
      setShowForm(false);
      setForm({ name: '', description: '', trigger: 'manual', category: 'custom', schedule: '' });
      load();
    } catch { setMsg('Error creating rule'); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function toggle(id) {
    await api.toggleRule(id).catch(() => {});
    load();
  }

  async function execute(id) {
    setMsg('Executing…');
    try { await api.executeRule(id); setMsg('Execution started'); load(); }
    catch { setMsg('Execution failed'); }
    setTimeout(() => setMsg(''), 3000);
  }

  async function remove(id) {
    if (!window.confirm('Delete this rule?')) return;
    await api.deleteRule(id).catch(() => {});
    load();
  }

  async function useTemplate(tmplId) {
    const name = window.prompt('Rule name:');
    if (!name) return;
    await api.createFromTemplate(tmplId, { name }).catch(() => {});
    setMsg('Rule created from template');
    load();
    setTimeout(() => setMsg(''), 3000);
  }

  async function seedTmpls() {
    await api.seedTemplates().catch(() => {});
    api.listTemplates().then(r => setTemplates(r.data || [])).catch(() => {});
    setMsg('Built-in templates seeded');
    setTimeout(() => setMsg(''), 3000);
  }

  const card = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 20 };
  const inp  = { padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, width: '100%', boxSizing: 'border-box' };

  return (
    <AdminLayout>
      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>AI Automation Rules</h1>
            <p style={{ color: '#6B7280', margin: 0 }}>{total} rules total</p>
          </div>
          <button onClick={() => setShowForm(p => !p)} style={{ padding: '10px 20px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            + New Rule
          </button>
        </div>

        {msg && <div style={{ padding: '10px 16px', background: '#DBEAFE', borderRadius: 8, marginBottom: 16, fontSize: 14, color: '#1D4ED8' }}>{msg}</div>}

        {/* Create Form */}
        {showForm && (
          <div style={{ ...card, background: '#F0F0FF' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>New Automation Rule</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>Name *</label><input style={inp} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Rule name" /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>Trigger</label>
                <select style={inp} value={form.trigger} onChange={e => setForm(p => ({ ...p, trigger: e.target.value }))}>
                  {TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>Category</label>
                <select style={inp} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>Schedule (cron)</label><input style={inp} value={form.schedule} onChange={e => setForm(p => ({ ...p, schedule: e.target.value }))} placeholder="0 8 * * *" /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>Description</label><input style={inp} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What does this rule do?" /></div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveRule} disabled={saving || !form.name} style={{ padding: '8px 18px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, opacity: (saving || !form.name) ? 0.6 : 1 }}>Save</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 18px', background: '#F3F4F6', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Templates */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Built-in Templates</h3>
            <button onClick={seedTmpls} style={{ padding: '6px 14px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Seed Templates</button>
          </div>
          {templates.length === 0 ? (
            <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>No templates yet. Click "Seed Templates" to load built-ins.</p>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {templates.map(t => (
                <button key={t._id} onClick={() => useTemplate(t._id)}
                  style={{ padding: '8px 14px', background: '#EDE9FE', border: '1px solid #C4B5FD', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#6D28D9' }}>
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <select value={filter.trigger} onChange={e => setFilter(p => ({ ...p, trigger: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }}>
            <option value="">All Triggers</option>{TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filter.category} onChange={e => setFilter(p => ({ ...p, category: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }}>
            <option value="">All Categories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filter.isActive} onChange={e => setFilter(p => ({ ...p, isActive: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }}>
            <option value="">All Status</option><option value="true">Active</option><option value="false">Inactive</option>
          </select>
        </div>

        {/* Rules Table */}
        <div style={card}>
          {rules.length === 0 ? (
            <p style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', padding: 40 }}>No rules found. Create one above or use a template.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  {['Name','Trigger','Category','Status','Runs','Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 12px' }}><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{r.ruleCode}</div></td>
                    <td style={{ padding: '12px', color: '#6B7280' }}>{r.trigger}</td>
                    <td style={{ padding: '12px', color: '#6B7280' }}>{r.category}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 9999, background: r.isActive ? '#D1FAE5' : '#F3F4F6', color: r.isActive ? '#059669' : '#9CA3AF' }}>{r.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ padding: '12px', color: '#6B7280' }}>{r.runCount || 0}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => execute(r._id)} style={{ padding: '4px 8px', background: '#DBEAFE', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#2563EB' }}>Run</button>
                        <button onClick={() => toggle(r._id)} style={{ padding: '4px 8px', background: r.isActive ? '#FEF3C7' : '#D1FAE5', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: r.isActive ? '#D97706' : '#059669' }}>{r.isActive ? 'Pause' : 'Activate'}</button>
                        <button onClick={() => remove(r._id)} style={{ padding: '4px 8px', background: '#FEE2E2', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#DC2626' }}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

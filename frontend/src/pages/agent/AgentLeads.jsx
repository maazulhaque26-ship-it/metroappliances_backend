import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import agentAPI from '../../services/agentAPI';

const STAGE_COLORS = { prospect: '#9CA3AF', qualified: '#3B82F6', proposal: '#F59E0B', negotiation: '#8B5CF6', won: '#10B981', lost: '#EF4444' };
const PRIORITY_COLORS = { low: '#9CA3AF', medium: '#3B82F6', high: '#F59E0B', urgent: '#EF4444' };
const STAGES = ['', 'prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent'];

export default function AgentLeads() {
  const [leads,      setLeads]      = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [stage,      setStage]      = useState('');
  const [priority,   setPriority]   = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState({ businessName: '', contactPerson: '', phone: '', email: '', city: '', state: '', source: 'cold_call', priority: 'medium', estimatedValue: '' });
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search)   params.set('search', search);
      if (stage)    params.set('stage', stage);
      if (priority) params.set('priority', priority);
      const { data } = await agentAPI.get(`/agent/leads?${params}`);
      setLeads(data.leads || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, search, stage, priority]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.businessName) return alert('Business name required');
    setSaving(true);
    try {
      await agentAPI.post('/agent/leads', { ...form, estimatedValue: Number(form.estimatedValue) || 0 });
      setShowCreate(false);
      setForm({ businessName: '', contactPerson: '', phone: '', email: '', city: '', state: '', source: 'cold_call', priority: 'medium', estimatedValue: '' });
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#111', margin: '0 0 4px' }}>My Leads</h2>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{pagination.total} total leads</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          + Add Lead
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search leads..."
          style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }} />
        <select value={stage} onChange={e => { setStage(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
          <option value="">All Stages</option>
          {STAGES.filter(Boolean).map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
          <option value="">All Priority</option>
          {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Lead #', 'Business', 'Contact', 'Stage', 'Priority', 'Est. Value', 'Next Follow-up', 'Action'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No leads found</td></tr>
            ) : leads.map(l => (
              <tr key={l._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#FF7A00', fontWeight: 700 }}>{l.leadNumber}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#111' }}>{l.businessName}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{l.city}{l.state ? `, ${l.state}` : ''}</div>
                </td>
                <td style={{ padding: '12px 14px', color: '#374151' }}>
                  <div>{l.contactPerson || '—'}</div>
                  {l.phone && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{l.phone}</div>}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STAGE_COLORS[l.stage] || '#9CA3AF') + '1A', color: STAGE_COLORS[l.stage] || '#9CA3AF', textTransform: 'capitalize' }}>
                    {l.stage}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (PRIORITY_COLORS[l.priority] || '#9CA3AF') + '1A', color: PRIORITY_COLORS[l.priority] || '#9CA3AF', textTransform: 'capitalize' }}>
                    {l.priority}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: '#374151' }}>{l.estimatedValue ? `₹${l.estimatedValue.toLocaleString('en-IN')}` : '—'}</td>
                <td style={{ padding: '12px 14px', color: l.nextFollowUpDate && new Date(l.nextFollowUpDate) < new Date() ? '#EF4444' : '#9CA3AF', fontSize: '12px' }}>
                  {l.nextFollowUpDate ? new Date(l.nextFollowUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <Link to={`/agent/leads/${l._id}`} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '11px', fontWeight: 600, color: '#374151', textDecoration: 'none' }}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.totalPages > 1 && !loading && (
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '12px', opacity: page <= 1 ? 0.4 : 1 }}>&larr; Prev</button>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Page {page} of {pagination.totalPages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '12px', opacity: page >= pagination.totalPages ? 0.4 : 1 }}>Next &rarr;</button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#111' }}>Add New Lead</div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Business Name *', key: 'businessName', type: 'text' },
                { label: 'Contact Person', key: 'contactPerson', type: 'text' },
                { label: 'Phone', key: 'phone', type: 'tel' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'City', key: 'city', type: 'text' },
                { label: 'State', key: 'state', type: 'text' },
                { label: 'Est. Value (₹)', key: 'estimatedValue', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                  {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Source</label>
                <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                  {['cold_call','referral','walk_in','online','exhibition','agent_visit','other'].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleCreate} disabled={saving}
                style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1, marginTop: '4px' }}>
                {saving ? 'Adding...' : 'Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

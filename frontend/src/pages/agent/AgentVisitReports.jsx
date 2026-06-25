import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import agentAPI from '../../services/agentAPI';

const STATUS_COLORS  = { planned: '#9CA3AF', checked_in: '#3B82F6', completed: '#10B981', cancelled: '#EF4444' };
const OUTCOME_COLORS = { positive: '#10B981', neutral: '#9CA3AF', negative: '#EF4444', no_contact: '#6B7280' };
const PURPOSE_LABELS = { sales_call: 'Sales Call', collection: 'Collection', support: 'Support', relationship: 'Relationship', order_delivery: 'Delivery', other: 'Other' };

export default function AgentVisitReports() {
  const [visits,     setVisits]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [status,     setStatus]     = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [dealers,    setDealers]    = useState([]);
  const [form,       setForm]       = useState({ dealer: '', purpose: 'sales_call', visitNotes: '', nextVisitDate: '' });
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status) params.set('status', status);
      const { data } = await agentAPI.get(`/agent/visits?${params}`);
      setVisits(data.visits || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    agentAPI.get('/agent/dealers?limit=200').then(r => setDealers((r.data.assignments || []).map(a => a.dealer).filter(Boolean))).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.dealer) return alert('Select a dealer');
    setSaving(true);
    try {
      await agentAPI.post('/agent/visits', form);
      setShowCreate(false);
      setForm({ dealer: '', purpose: 'sales_call', visitNotes: '', nextVisitDate: '' });
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleCheckIn = async (id) => {
    try {
      await agentAPI.post(`/agent/visits/${id}/checkin`, {});
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#111', margin: '0 0 4px' }}>Visit Reports</h2>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{pagination.total} total visits</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          + Plan Visit
        </button>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[['', 'All'], ['planned', 'Planned'], ['checked_in', 'Active'], ['completed', 'Completed'], ['cancelled', 'Cancelled']].map(([v, l]) => (
          <button key={v} onClick={() => { setStatus(v); setPage(1); }}
            style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: status === v ? '#FF7A00' : '#F3F4F6', color: status === v ? '#fff' : '#374151' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '650px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Visit #', 'Dealer', 'Purpose', 'Status', 'Date', 'Outcome', 'Duration', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
            ) : visits.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No visits found</td></tr>
            ) : visits.map(v => (
              <tr key={v._id} style={{ borderBottom: '1px solid #E5E7EB', background: v.status === 'checked_in' ? '#EFF6FF' : undefined }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#FF7A00', fontWeight: 700 }}>{v.visitNumber}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#111' }}>{v.dealer?.businessName || '—'}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{v.dealer?.city}</div>
                </td>
                <td style={{ padding: '12px 14px', color: '#374151', fontSize: '12px' }}>{PURPOSE_LABELS[v.purpose] || v.purpose}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLORS[v.status] || '#9CA3AF') + '1A', color: STATUS_COLORS[v.status] || '#9CA3AF', textTransform: 'capitalize' }}>
                    {v.status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{new Date(v.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                <td style={{ padding: '12px 14px' }}>
                  {v.outcome ? (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (OUTCOME_COLORS[v.outcome] || '#9CA3AF') + '1A', color: OUTCOME_COLORS[v.outcome] || '#9CA3AF', textTransform: 'capitalize' }}>
                      {v.outcome?.replace(/_/g, ' ')}
                    </span>
                  ) : '—'}
                </td>
                <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{v.durationMinutes ? `${v.durationMinutes}m` : '—'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Link to={`/agent/visits/${v._id}`} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '11px', fontWeight: 600, color: '#374151', textDecoration: 'none' }}>View</Link>
                    {v.status === 'planned' && (
                      <button onClick={() => handleCheckIn(v._id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #BFDBFE', background: '#EFF6FF', fontSize: '11px', fontWeight: 600, color: '#1D4ED8', cursor: 'pointer' }}>Check In</button>
                    )}
                  </div>
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

      {/* Create modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#111' }}>Plan Visit</div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Dealer *</label>
                <select value={form.dealer} onChange={e => setForm(f => ({ ...f, dealer: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                  <option value="">Select dealer...</option>
                  {dealers.map(d => <option key={d._id} value={d._id}>{d.businessName} ({d.dealerCode})</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Purpose</label>
                <select value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                  {Object.entries(PURPOSE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Notes</label>
                <textarea value={form.visitNotes} onChange={e => setForm(f => ({ ...f, visitNotes: e.target.value }))} rows={2}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Next Visit Date</label>
                <input type="date" value={form.nextVisitDate} onChange={e => setForm(f => ({ ...f, nextVisitDate: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handleCreate} disabled={saving}
                style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Planning...' : 'Plan Visit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

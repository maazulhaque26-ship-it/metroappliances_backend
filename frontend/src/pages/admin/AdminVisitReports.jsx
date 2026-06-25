import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const STATUS_COLORS  = { planned: '#9CA3AF', checked_in: '#3B82F6', completed: '#10B981', cancelled: '#EF4444' };
const OUTCOME_COLORS = { positive: '#10B981', neutral: '#9CA3AF', negative: '#EF4444', no_contact: '#6B7280' };
const PURPOSE_LABELS = { sales_call: 'Sales Call', collection: 'Collection', support: 'Support', relationship: 'Relationship', order_delivery: 'Delivery', other: 'Other' };

export default function AdminVisitReports() {
  const [visits,     setVisits]     = useState([]);
  const [agents,     setAgents]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [status,     setStatus]     = useState('');
  const [agentId,    setAgentId]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status)  params.set('status', status);
      if (agentId) params.set('agentId', agentId);
      const { data } = await api.get(`/admin/visit-reports?${params}`);
      setVisits(data.visits || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, status, agentId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/admin/sales-agents?limit=200').then(r => setAgents(r.data.agents || [])).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete visit report?')) return;
    try { await api.delete(`/admin/visit-reports/${id}`); load(); }
    catch (e) { alert(e?.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: '0 0 4px' }}>Visit Reports</h2>
        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{pagination.total} total visits</div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
          <option value="">All Status</option>
          {['planned','checked_in','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
        <select value={agentId} onChange={e => { setAgentId(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
          <option value="">All Agents</option>
          {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.agentCode})</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Visit #', 'Agent', 'Dealer', 'Purpose', 'Date', 'Status', 'Outcome', 'Duration', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
            ) : visits.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No visit reports found</td></tr>
            ) : visits.map(v => (
              <tr key={v._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#FF7A00', fontWeight: 700 }}>{v.visitNumber}</td>
                <td style={{ padding: '12px 14px', color: '#374151' }}>
                  <div style={{ fontWeight: 600 }}>{v.agent?.name || '—'}</div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{v.agent?.agentCode}</div>
                </td>
                <td style={{ padding: '12px 14px', color: '#374151' }}>
                  <div style={{ fontWeight: 600 }}>{v.dealer?.businessName || '—'}</div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{v.dealer?.city}</div>
                </td>
                <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{PURPOSE_LABELS[v.purpose] || v.purpose}</td>
                <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{new Date(v.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLORS[v.status] || '#9CA3AF') + '1A', color: STATUS_COLORS[v.status] || '#9CA3AF', textTransform: 'capitalize' }}>
                    {v.status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {v.outcome ? (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (OUTCOME_COLORS[v.outcome] || '#9CA3AF') + '1A', color: OUTCOME_COLORS[v.outcome] || '#9CA3AF', textTransform: 'capitalize' }}>
                      {v.outcome?.replace(/_/g, ' ')}
                    </span>
                  ) : '—'}
                </td>
                <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{v.durationMinutes ? `${v.durationMinutes}m` : '—'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => handleDelete(v._id)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', fontSize: '10px', fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}>Del</button>
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
    </div>
  );
}

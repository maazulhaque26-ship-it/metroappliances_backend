import React, { useState, useEffect, useCallback } from 'react';
import agentAPI from '../../services/agentAPI';

const STATUS_COLORS = { approved: '#10B981', pending: '#F59E0B', rejected: '#EF4444', suspended: '#EF4444' };

export default function AgentDealers() {
  const [assignments, setAssignments] = useState([]);
  const [pagination,  setPagination]  = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await agentAPI.get(`/agent/dealers?page=${page}&limit=20`);
      setAssignments(data.assignments || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#111', margin: '0 0 4px' }}>My Dealers</h2>
        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{pagination.total} assigned dealer{pagination.total !== 1 ? 's' : ''}</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>Loading...</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Business', 'Code', 'City', 'Contact', 'Status', 'Assigned'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No dealers assigned to you</td></tr>
              ) : assignments.map(a => (
                <tr key={a._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#111' }}>{a.dealer?.businessName || '—'}</div>
                    {a.territory && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{a.territory.name}</div>}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#9CA3AF' }}>{a.dealer?.dealerCode}</td>
                  <td style={{ padding: '12px 14px', color: '#374151' }}>
                    {a.dealer?.city}{a.dealer?.state ? `, ${a.dealer.state}` : ''}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#374151', fontSize: '12px' }}>
                    <div>{a.dealer?.phone}</div>
                    <div style={{ color: '#9CA3AF' }}>{a.dealer?.email}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLORS[a.dealer?.status] || '#9CA3AF') + '1A', color: STATUS_COLORS[a.dealer?.status] || '#9CA3AF', textTransform: 'capitalize' }}>
                      {a.dealer?.status || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>
                    {a.assignedAt ? new Date(a.assignedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
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
      )}
    </div>
  );
}

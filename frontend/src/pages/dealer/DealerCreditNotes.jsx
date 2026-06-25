import React, { useState, useEffect, useCallback } from 'react';
import DealerLayout from '../../components/dealer/DealerLayout';
import dealerAPI from '../../services/dealerAPI';

const STATUS_COLORS = { pending: '#F59E0B', approved: '#3B82F6', applied: '#10B981', rejected: '#EF4444' };
const TYPE_LABELS   = { return: 'Return', overcharge: 'Overcharge', quality: 'Quality', admin_discretion: 'Admin', other: 'Other' };

export default function DealerCreditNotes() {
  const [notes,      setNotes]      = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filterStatus) params.set('status', filterStatus);
      const { data } = await dealerAPI.get(`/dealer/finance/credit-notes?${params}`);
      setNotes(data.creditNotes || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, filterStatus]);

  useEffect(() => { load(); }, [load]);

  return (
    <DealerLayout>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text,#111)', margin: '0 0 4px' }}>Credit Notes</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>Credit notes issued or pending on your account</div>
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)' }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="applied">Applied</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '580px' }}>
          <thead>
            <tr style={{ background: 'var(--bg,#F9FAFB)' }}>
              {['CN #', 'Date', 'Type', 'Amount', 'Status', 'Reason', 'Applied'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-4,#9CA3AF)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border,#E5E7EB)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>Loading…</td></tr>
            ) : notes.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>📝</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '4px' }}>No credit notes</div>
                <div style={{ fontSize: '12px' }}>Credit notes will appear here once raised by admin</div>
              </td></tr>
            ) : notes.map(n => (
              <tr key={n._id} style={{ borderBottom: '1px solid var(--border,#E5E7EB)', background: n.status === 'approved' ? '#F0FDF4' : undefined }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--accent,#FF7A00)', fontWeight: 700 }}>{n.creditNoteNumber}</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-4,#9CA3AF)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text,#111)', fontSize: '12px' }}>
                  {TYPE_LABELS[n.type] || n.type}
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 800, color: '#10B981', whiteSpace: 'nowrap' }}>
                  +₹{(n.amount || 0).toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLORS[n.status] || '#6B7280') + '1A', color: STATUS_COLORS[n.status] || '#6B7280', textTransform: 'capitalize' }}>
                    {n.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-4,#9CA3AF)', fontSize: '12px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {n.reason || '—'}
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-4,#9CA3AF)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {n.appliedAt ? new Date(n.appliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.totalPages > 1 && !loading && (
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '12px', opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
            <span style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)' }}>Page {page} of {pagination.totalPages} · {pagination.total} records</span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '12px', opacity: page >= pagination.totalPages ? 0.4 : 1 }}>Next →</button>
          </div>
        )}
      </div>
    </DealerLayout>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import DealerLayout from '../../components/dealer/DealerLayout';
import dealerAPI from '../../services/dealerAPI';

const STATUS_COLORS = { pending: '#F59E0B', verified: '#10B981', failed: '#EF4444', reversed: '#6B7280' };
const TYPE_ICONS    = { payment: '💳', refund: '↩', adjustment: '⚙', credit_note: '📝', wallet_topup: '⬆' };
const METHOD_LABELS = { bank_transfer: 'Bank Transfer', cheque: 'Cheque', upi: 'UPI', neft: 'NEFT', rtgs: 'RTGS', cash: 'Cash', wallet: 'Wallet', other: 'Other' };

export default function DealerPayments() {
  const [payments,   setPayments]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [filterType,   setFilterType]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filterType)   params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      const { data } = await dealerAPI.get(`/dealer/finance/payments?${params}`);
      setPayments(data.payments || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, filterType, filterStatus]);

  useEffect(() => { load(); }, [load]);

  return (
    <DealerLayout>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text,#111)', margin: '0 0 4px' }}>Payment History</h1>
        <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>All payments, refunds, and adjustments on your account</div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)' }}>
          <option value="">All Types</option>
          <option value="payment">Payment</option>
          <option value="refund">Refund</option>
          <option value="adjustment">Adjustment</option>
          <option value="credit_note">Credit Note</option>
          <option value="wallet_topup">Wallet Top-up</option>
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)' }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="failed">Failed</option>
          <option value="reversed">Reversed</option>
        </select>
      </div>

      <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
          <thead>
            <tr style={{ background: 'var(--bg,#F9FAFB)' }}>
              {['Payment #', 'Date', 'Type', 'Method', 'Amount', 'Status', 'Notes'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-4,#9CA3AF)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border,#E5E7EB)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>Loading…</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>💳</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '4px' }}>No payments yet</div>
                <div style={{ fontSize: '12px' }}>Payment records will appear here once recorded by admin</div>
              </td></tr>
            ) : payments.map(p => (
              <tr key={p._id} style={{ borderBottom: '1px solid var(--border,#E5E7EB)' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--accent,#FF7A00)', fontWeight: 700 }}>{p.paymentNumber}</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-4,#9CA3AF)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text,#111)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{TYPE_ICONS[p.type] || '💰'}</span>
                    <span style={{ textTransform: 'capitalize' }}>{p.type?.replace(/_/g, ' ')}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-4,#9CA3AF)', fontSize: '12px' }}>
                  {METHOD_LABELS[p.method] || p.method || '—'}
                  {p.referenceNumber && <div style={{ fontSize: '10px', color: 'var(--text-4,#9CA3AF)' }}>Ref: {p.referenceNumber}</div>}
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 800, color: p.type === 'refund' ? '#10B981' : 'var(--text,#111)', whiteSpace: 'nowrap' }}>
                  {p.type === 'refund' ? '+' : ''}₹{(p.amount || 0).toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLORS[p.status] || '#6B7280') + '1A', color: STATUS_COLORS[p.status] || '#6B7280', textTransform: 'capitalize' }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-4,#9CA3AF)', fontSize: '12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.remarks || '—'}
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

import React, { useState, useEffect, useCallback } from 'react';
import DealerLayout from '../../components/dealer/DealerLayout';
import dealerAPI from '../../services/dealerAPI';

const STATUS_COLORS = { paid: '#10B981', overdue: '#EF4444', pending: '#F59E0B', na: '#9CA3AF' };
const TYPE_COLORS   = { credit: '#10B981', debit: '#EF4444' };
const CAT_ICONS     = { order: '📦', payment: '💳', refund: '↩', wallet_topup: '⬆', wallet_deduct: '⬇', credit_note: '📝', adjustment: '⚙', invoice_charge: '🧾', reversal: '🔄', default: '🔹' };

export default function DealerLedger() {
  const [entries,     setEntries]     = useState([]);
  const [outstanding, setOutstanding] = useState(0);
  const [pagination,  setPagination]  = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState('');
  const [filterType,  setFilterType]  = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [from,        setFrom]        = useState('');
  const [to,          setTo]          = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search)       params.set('search', search);
      if (filterType)   params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      if (from)         params.set('from', from);
      if (to)           params.set('to', to);

      const { data } = await dealerAPI.get(`/dealer/finance/ledger?${params}`);
      setEntries(data.entries || []);
      setOutstanding(data.outstanding ?? 0);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, search, filterType, filterStatus, from, to]);

  useEffect(() => { load(); }, [load]);

  return (
    <DealerLayout>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text,#111)', margin: '0 0 4px' }}>Account Ledger</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>Complete debit / credit history</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ padding: '10px 16px', background: outstanding > 0 ? '#FEF2F2' : '#F0FDF4', borderRadius: '10px', border: `1px solid ${outstanding > 0 ? '#FECACA' : '#BBF7D0'}` }}>
            <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)', fontWeight: 600 }}>OUTSTANDING</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: outstanding > 0 ? '#EF4444' : '#10B981' }}>₹{outstanding.toLocaleString('en-IN')}</div>
          </div>
          <button onClick={() => alert('CSV export coming soon. Use browser Print to save as PDF.')}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--text,#111)' }}>
            ⇩ Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search description, ref, entry#…"
          style={{ flex: '1', minWidth: '200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)' }}
        />
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)' }}>
          <option value="">All Types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)' }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)' }} />
        <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)' }} />
      </div>

      <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: 'var(--bg,#F9FAFB)' }}>
              {['Entry #', 'Date', 'Description', 'Type', 'Debit', 'Credit', 'Balance', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-4,#9CA3AF)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border,#E5E7EB)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>Loading…</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>No entries found</td></tr>
            ) : entries.map(e => (
              <tr key={e._id} style={{ borderBottom: '1px solid var(--border,#E5E7EB)', background: e.status === 'overdue' ? '#FFF5F5' : undefined }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-4,#9CA3AF)' }}>{e.entryNumber}</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-4,#9CA3AF)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {e.dueDate && <div style={{ fontSize: '10px', color: e.status === 'overdue' ? '#EF4444' : 'var(--text-4,#9CA3AF)' }}>Due: {new Date(e.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>}
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text,#111)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{CAT_ICONS[e.category] || CAT_ICONS.default}</span>
                    <div>
                      <div style={{ fontWeight: 500, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>
                      {e.reference && <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)' }}>{e.reference}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '100px', background: (TYPE_COLORS[e.type] || '#6B7280') + '1A', color: TYPE_COLORS[e.type] || '#6B7280', textTransform: 'capitalize' }}>{e.type}</span>
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#EF4444', whiteSpace: 'nowrap' }}>{e.type === 'debit'  ? `₹${e.amount.toLocaleString('en-IN')}` : '—'}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#10B981', whiteSpace: 'nowrap' }}>{e.type === 'credit' ? `₹${e.amount.toLocaleString('en-IN')}` : '—'}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: e.runningBalance > 0 ? '#EF4444' : '#10B981', whiteSpace: 'nowrap' }}>₹{e.runningBalance.toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px 14px' }}>
                  {e.status !== 'na' && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '100px', background: (STATUS_COLORS[e.status] || '#6B7280') + '1A', color: STATUS_COLORS[e.status] || '#6B7280', textTransform: 'capitalize' }}>{e.status}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.totalPages > 1 && !loading && (
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '12px', opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
            <span style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)' }}>Page {page} of {pagination.totalPages} · {pagination.total} entries</span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '12px', opacity: page >= pagination.totalPages ? 0.4 : 1 }}>Next →</button>
          </div>
        )}
      </div>
    </DealerLayout>
  );
}

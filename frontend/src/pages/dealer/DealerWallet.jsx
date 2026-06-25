import React, { useEffect, useState, useCallback } from 'react';
import DealerLayout from '../../components/dealer/DealerLayout';
import dealerAPI from '../../services/dealerAPI';

const CATEGORIES = ['', 'order', 'payment', 'refund', 'wallet_topup', 'wallet_deduct', 'credit_note', 'adjustment', 'invoice_charge', 'reversal'];
const TYPE_COLORS = { credit: '#10B981', debit: '#EF4444' };
const CAT_ICONS   = { order: '📦', payment: '💳', refund: '↩', wallet_topup: '⬆', wallet_deduct: '⬇', credit_note: '📝', adjustment: '⚙', invoice_charge: '🧾', reversal: '🔄' };

function fmt(n) {
  return `₹${(n || 0).toLocaleString('en-IN')}`;
}

export default function DealerWallet() {
  const [wallet,      setWallet]      = useState(null);
  const [entries,     setEntries]     = useState([]);
  const [pagination,  setPagination]  = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,     setLoading]     = useState(true);
  const [txLoading,   setTxLoading]   = useState(false);
  const [page,        setPage]        = useState(1);
  const [filterType,  setFilterType]  = useState('');
  const [filterCat,   setFilterCat]   = useState('');

  useEffect(() => {
    dealerAPI.get('/dealer/finance/wallet')
      .then(r => setWallet(r.data.wallet))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadTx = useCallback(async () => {
    setTxLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filterType) params.set('type', filterType);
      if (filterCat)  params.set('category', filterCat);
      const { data } = await dealerAPI.get(`/dealer/finance/wallet/transactions?${params}`);
      setEntries(data.entries || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setTxLoading(false); }
  }, [page, filterType, filterCat]);

  useEffect(() => { loadTx(); }, [loadTx]);

  return (
    <DealerLayout>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text,#111)', margin: '0 0 4px' }}>My Wallet</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>Balance, transactions & history</div>
        </div>
      </div>

      {loading ? (
        <div style={{ height: '120px', background: 'var(--border,#E5E7EB)', borderRadius: '12px', marginBottom: '24px' }} />
      ) : (
        <>
          {/* Balance cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Available Balance',  value: wallet?.availableBalance,  color: '#10B981' },
              { label: 'Total Balance',      value: wallet?.totalBalance,       color: 'var(--accent,#FF7A00)' },
              { label: 'Blocked Balance',    value: wallet?.blockedBalance,     color: '#F59E0B' },
              { label: 'Pending Settlement', value: wallet?.pendingSettlement,  color: '#8B5CF6' },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{c.label}</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: c.color }}>{fmt(c.value)}</div>
              </div>
            ))}
          </div>

          {/* Last recharge */}
          {wallet?.lastRecharge?.date && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <span>⬆</span>
              <span style={{ color: '#166534' }}>Last recharge: <strong>{fmt(wallet.lastRecharge.amount)}</strong> on {new Date(wallet.lastRecharge.date).toLocaleDateString('en-IN')}{wallet.lastRecharge.method ? ` via ${wallet.lastRecharge.method}` : ''}{wallet.lastRecharge.reference ? ` (Ref: ${wallet.lastRecharge.reference})` : ''}</span>
            </div>
          )}

          {/* Top-up CTA */}
          <div style={{ background: 'var(--card,#fff)', border: '1px dashed var(--border,#E5E7EB)', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)' }}>Add Funds to Wallet</div>
              <div style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)', marginTop: '2px' }}>Contact your account manager or submit a bank transfer request to add funds.</div>
            </div>
            <button disabled style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--bg,#F9FAFB)', fontSize: '12px', fontWeight: 600, color: 'var(--text-4,#9CA3AF)', cursor: 'not-allowed' }}>
              Request Top-up (Coming Soon)
            </button>
          </div>
        </>
      )}

      {/* Transactions */}
      <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border,#E5E7EB)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)', flex: 1 }}>Transaction History</div>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
            style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', fontSize: '12px', background: 'var(--card,#fff)' }}>
            <option value="">All Types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}
            style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', fontSize: '12px', background: 'var(--card,#fff)' }}>
            <option value="">All Categories</option>
            {CATEGORIES.slice(1).map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        {txLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>Loading…</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>◈</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '4px' }}>No transactions yet</div>
            <div style={{ fontSize: '12px' }}>Your transaction history will appear here</div>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg,#F9FAFB)' }}>
                  {['Entry #', 'Date', 'Description', 'Type', 'Amount', 'Balance'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-4,#9CA3AF)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border,#E5E7EB)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e._id} style={{ borderBottom: '1px solid var(--border,#E5E7EB)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-4,#9CA3AF)', fontSize: '11px', fontFamily: 'monospace' }}>{e.entryNumber}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-4,#9CA3AF)', fontSize: '12px', whiteSpace: 'nowrap' }}>{new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text,#111)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{CAT_ICONS[e.category] || '🔹'}</span>
                        <div>
                          <div style={{ fontWeight: 500 }}>{e.description}</div>
                          {e.reference && <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)' }}>{e.reference}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, background: (TYPE_COLORS[e.type] || '#6B7280') + '1A', color: TYPE_COLORS[e.type] || '#6B7280', textTransform: 'capitalize' }}>
                        {e.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: TYPE_COLORS[e.type] || 'var(--text,#111)', whiteSpace: 'nowrap' }}>
                      {e.type === 'credit' ? '+' : '−'}{fmt(e.amount)}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text,#111)', whiteSpace: 'nowrap' }}>{fmt(e.runningBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination.totalPages > 1 && (
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '12px', opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
                <span style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)' }}>Page {page} of {pagination.totalPages}</span>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '12px', opacity: page >= pagination.totalPages ? 0.4 : 1 }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </DealerLayout>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DealerLayout from '../../components/dealer/DealerLayout';
import dealerAPI from '../../services/dealerAPI';

function FinCard({ label, value, sub, color = 'var(--accent,#FF7A00)', link, icon }) {
  const inner = (
    <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px', cursor: link ? 'pointer' : 'default', transition: 'box-shadow 0.15s ease' }}
      onMouseEnter={e => { if (link) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: '18px' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '26px', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)' }}>{sub}</div>}
    </div>
  );
  return link ? <Link to={link} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

function fmt(n) {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const TYPE_ICONS = { order: '📦', payment: '💳', refund: '↩️', wallet_topup: '⬆️', wallet_deduct: '⬇️', credit_note: '📝', adjustment: '⚙️', invoice_charge: '🧾', reversal: '🔄' };
const TYPE_COLORS = { credit: '#10B981', debit: '#EF4444' };

export default function DealerFinanceOverview() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dealerAPI.get('/dealer/finance/summary')
      .then(r => setSummary(r.data.summary))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const s = summary;
  const creditPct = s?.credit?.creditLimit > 0 ? Math.round((s.credit.usedCredit / s.credit.creditLimit) * 100) : 0;

  return (
    <DealerLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text,#111)', margin: '0 0 4px' }}>Finance Overview</h1>
        <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>Your complete financial picture</div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '16px' }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ background: 'var(--border,#E5E7EB)', borderRadius: '12px', height: '100px' }} />)}
        </div>
      ) : (
        <>
          {/* Finance stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '16px', marginBottom: '28px' }}>
            <FinCard label="Wallet Balance"    value={fmt(s?.wallet?.availableBalance)} icon="◈" color="var(--accent,#FF7A00)" link="/dealer/finance/wallet" sub={`Total: ${fmt(s?.wallet?.totalBalance)}`} />
            <FinCard label="Credit Limit"      value={fmt(s?.credit?.creditLimit)}      icon="◇" color="#8B5CF6" link="/dealer/finance/credit" sub={`Available: ${fmt(s?.credit?.remainingCredit)}`} />
            <FinCard label="Outstanding"       value={fmt(Math.max(0, s?.outstanding))} icon="≡" color={s?.outstanding > 0 ? '#EF4444' : '#10B981'} link="/dealer/finance/ledger" sub="Running balance" />
            <FinCard label="Unpaid Invoices"   value={s?.unpaidInvoices ?? 0}           icon="⊘" color="#F59E0B" link="/dealer/finance/invoices" sub="Pending payment" />
            <FinCard label="Pending Payments"  value={s?.pendingPayments ?? 0}          icon="⊙" color="#3B82F6" link="/dealer/finance/payments" sub="Awaiting verification" />
            <FinCard label="Credit Notes"      value={s?.pendingCreditNotes ?? 0}       icon="⊖" color="#10B981" link="/dealer/finance/credit-notes" sub="Pending / approved" />
          </div>

          {/* Credit utilization bar */}
          {s?.credit?.creditLimit > 0 && (
            <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)' }}>Credit Utilization</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: creditPct > 80 ? '#EF4444' : creditPct > 60 ? '#F59E0B' : '#10B981' }}>{creditPct}%</div>
              </div>
              <div style={{ height: '8px', background: 'var(--border,#E5E7EB)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${creditPct}%`, background: creditPct > 80 ? '#EF4444' : creditPct > 60 ? '#F59E0B' : '#10B981', borderRadius: '100px', transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--text-4,#9CA3AF)' }}>
                <span>Used: {fmt(s.credit.usedCredit)}</span>
                <span>Available: {fmt(s.credit.remainingCredit)} / {fmt(s.credit.creditLimit)}</span>
              </div>
              {s.credit.isOnHold && (
                <div style={{ marginTop: '10px', padding: '8px 12px', background: '#FEF2F2', borderRadius: '6px', fontSize: '12px', color: '#EF4444', fontWeight: 600 }}>
                  ⚠️ Credit on hold — contact support
                </div>
              )}
              {s.credit.creditExpiry && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-4,#9CA3AF)' }}>
                  Expires: {new Date(s.credit.creditExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          )}

          {/* Recent transactions */}
          {s?.recentLedger?.length > 0 && (
            <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)' }}>Recent Transactions</div>
                <Link to="/dealer/finance/ledger" style={{ fontSize: '12px', color: 'var(--accent,#FF7A00)', textDecoration: 'none', fontWeight: 600 }}>View Ledger →</Link>
              </div>
              {s.recentLedger.map(e => (
                <div key={e._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border,#E5E7EB)' }}>
                  <span style={{ fontSize: '18px' }}>{TYPE_ICONS[e.category] || '🔹'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text,#111)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)', marginTop: '2px' }}>
                      {e.entryNumber} · {new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: TYPE_COLORS[e.type] || 'var(--text,#111)' }}>
                      {e.type === 'credit' ? '+' : '−'}₹{e.amount?.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)' }}>Bal: ₹{e.runningBalance?.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DealerLayout>
  );
}

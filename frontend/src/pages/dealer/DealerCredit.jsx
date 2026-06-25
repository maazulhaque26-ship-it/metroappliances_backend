import React, { useState, useEffect } from 'react';
import DealerLayout from '../../components/dealer/DealerLayout';
import dealerAPI from '../../services/dealerAPI';

const CREDIT_STATUS_COLORS = { none: '#9CA3AF', active: '#10B981', expired: '#EF4444', hold: '#F59E0B', suspended: '#EF4444' };
const ACTION_COLORS         = { set: '#3B82F6', increase: '#10B981', decrease: '#F59E0B', hold: '#EF4444', release: '#10B981', expire: '#6B7280' };

function fmt(n) { return `₹${(n || 0).toLocaleString('en-IN')}`; }

export default function DealerCredit() {
  const [credit,  setCredit]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dealerAPI.get('/dealer/finance/credit')
      .then(r => setCredit(r.data.credit))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DealerLayout><div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>Loading…</div></DealerLayout>;

  const pct = credit?.creditLimit > 0 ? Math.min(100, Math.round((credit.usedCredit / credit.creditLimit) * 100)) : 0;
  const barColor = pct > 80 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#10B981';
  const statusColor = CREDIT_STATUS_COLORS[credit?.creditStatus] || '#9CA3AF';

  return (
    <DealerLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text,#111)', margin: '0 0 4px' }}>Credit Limit</h1>
        <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>Your credit facility details and usage</div>
      </div>

      {!credit || credit.creditStatus === 'none' ? (
        <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>◇</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '6px' }}>No Credit Limit Assigned</div>
          <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>Contact your account manager to request a credit facility.</div>
        </div>
      ) : (
        <>
          {/* Hold banner */}
          {credit.isOnHold && (
            <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <span>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: '#B91C1C' }}>Credit on Hold</div>
                {credit.holdReason && <div style={{ color: '#991B1B', marginTop: '2px' }}>{credit.holdReason}</div>}
              </div>
            </div>
          )}

          {/* Credit cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Credit Limit',     value: fmt(credit.creditLimit),     color: '#8B5CF6' },
              { label: 'Used Credit',      value: fmt(credit.usedCredit),      color: '#EF4444' },
              { label: 'Available Credit', value: fmt(credit.remainingCredit), color: '#10B981' },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{c.label}</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: c.color }}>{c.value}</div>
              </div>
            ))}
            <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Status</div>
              <span style={{ fontSize: '13px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: statusColor + '1A', color: statusColor, textTransform: 'capitalize' }}>
                {credit.creditStatus}
              </span>
              {credit.creditExpiry && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-4,#9CA3AF)' }}>
                  Expires: {new Date(credit.creditExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>

          {/* Utilization bar */}
          <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)' }}>Credit Utilization</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: barColor }}>{pct}%</div>
            </div>
            <div style={{ height: '10px', background: 'var(--border,#E5E7EB)', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '100px', transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--text-4,#9CA3AF)' }}>
              <span>Used: {fmt(credit.usedCredit)}</span>
              <span>Limit: {fmt(credit.creditLimit)}</span>
            </div>
          </div>

          {/* Credit history */}
          {credit.creditHistory?.length > 0 && (
            <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border,#E5E7EB)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)' }}>Credit History</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg,#F9FAFB)' }}>
                    {['Date', 'Action', 'Previous Limit', 'New Limit', 'Reason'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-4,#9CA3AF)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border,#E5E7EB)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...credit.creditHistory].reverse().map((h, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border,#E5E7EB)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--text-4,#9CA3AF)', whiteSpace: 'nowrap' }}>
                        {new Date(h.performedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '100px', background: (ACTION_COLORS[h.action] || '#6B7280') + '1A', color: ACTION_COLORS[h.action] || '#6B7280', textTransform: 'capitalize' }}>
                          {h.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-4,#9CA3AF)' }}>{fmt(h.previousLimit)}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text,#111)' }}>{fmt(h.newLimit)}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-4,#9CA3AF)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.reason || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DealerLayout>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DealerLayout from '../../components/dealer/DealerLayout';
import dealerAPI from '../../services/dealerAPI';

const StatCard = ({ label, value, sub, color = 'var(--accent,#FF7A00)', icon }) => (
  <div style={{
    background: 'var(--card,#fff)',
    border: '1px solid var(--border,#E5E7EB)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex', flexDirection: 'column', gap: '6px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {icon && <span style={{ fontSize: '18px' }}>{icon}</span>}
    </div>
    <div style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)' }}>{sub}</div>}
  </div>
);

const statusColors = {
  pending:    '#F59E0B',
  confirmed:  '#3B82F6',
  processing: '#8B5CF6',
  shipped:    '#06B6D4',
  delivered:  '#10B981',
  cancelled:  '#EF4444',
};

function fmt(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n?.toLocaleString('en-IN') || 0}`;
}

function fmtFin(n) {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function DealerDashboard() {
  const { dealer } = useSelector(s => s.dealerAuth);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [finance, setFinance] = useState(null);

  useEffect(() => {
    dealerAPI.get('/dealer/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (dealer?.status === 'approved') {
      dealerAPI.get('/dealer/finance/summary')
        .then(r => setFinance(r.data.summary))
        .catch(() => {});
    }
  }, [dealer?.status]);

  const isPending   = dealer?.status === 'pending';
  const isRejected  = dealer?.status === 'rejected';
  const isSuspended = dealer?.status === 'suspended';

  return (
    <DealerLayout>
      {/* ── Status banner ── */}
      {isPending && (
        <div style={{
          background: '#FFF7ED', border: '1px solid #FED7AA',
          borderRadius: '10px', padding: '14px 20px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#92400E' }}>Application Under Review</div>
            <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
              Our team is reviewing your application. Upload your documents to speed up the process.
            </div>
          </div>
          <Link to="/dealer/profile" style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: '#F59E0B', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Upload Docs →
          </Link>
        </div>
      )}
      {isRejected && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: '10px', padding: '14px 20px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>❌</span>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#991B1B' }}>Application Rejected</div>
        </div>
      )}
      {isSuspended && (
        <div style={{
          background: '#F9FAFB', border: '1px solid #D1D5DB',
          borderRadius: '10px', padding: '14px 20px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>⛔</span>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>Account Suspended — Contact Support</div>
        </div>
      )}

      {/* ── Welcome header ── */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text,#111)', margin: 0 }}>
            Welcome, {dealer?.ownerName?.split(' ')[0] || 'Dealer'}
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)', marginTop: '4px' }}>
            {dealer?.businessName} · {dealer?.dealerCode}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/dealer/products" style={{
            padding: '8px 16px', borderRadius: '8px', textDecoration: 'none',
            background: 'var(--accent,#FF7A00)', color: '#fff', fontSize: '12px', fontWeight: 700,
            opacity: dealer?.status !== 'approved' ? 0.5 : 1,
            pointerEvents: dealer?.status !== 'approved' ? 'none' : undefined,
          }}>Browse Catalog</Link>
          <Link to="/dealer/orders" style={{
            padding: '8px 16px', borderRadius: '8px', textDecoration: 'none',
            border: '1px solid var(--border,#E5E7EB)', color: 'var(--text,#111)', fontSize: '12px', fontWeight: 600,
            background: 'var(--card,#fff)',
          }}>My Orders</Link>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '16px' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ background: 'var(--border,#E5E7EB)', borderRadius: '12px', height: '100px' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Commerce Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: '16px', marginBottom: '28px' }}>
            <StatCard label="Today's Orders"  value={data?.stats?.todayOrders || 0}      icon="📦" />
            <StatCard label="Pending"         value={data?.stats?.pendingOrders || 0}     icon="⏳" color="#F59E0B" />
            <StatCard label="This Month"      value={data?.stats?.monthOrders || 0}       icon="📅" color="#8B5CF6" />
            <StatCard label="Outstanding"     value={data?.stats?.outstandingOrders || 0} icon="🚚" color="#06B6D4" />
            <StatCard label="Monthly Revenue" value={fmt(data?.stats?.monthRevenue || 0)} icon="💰" color="#10B981" />
            <StatCard label="Cart Items"      value={data?.stats?.cartItems || 0}         icon="🛒" />
          </div>

          {/* Finance Cards — approved dealers only */}
          {dealer?.status === 'approved' && finance && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-4,#9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Finance Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: '16px', marginBottom: '28px' }}>
                <Link to="/dealer/finance/wallet" style={{ textDecoration: 'none' }}>
                  <StatCard label="Wallet Balance"   value={fmtFin(finance.wallet?.availableBalance)} icon="◈" color="var(--accent,#FF7A00)" sub={`Total: ${fmtFin(finance.wallet?.totalBalance)}`} />
                </Link>
                <Link to="/dealer/finance/credit" style={{ textDecoration: 'none' }}>
                  <StatCard label="Credit Available" value={fmtFin(finance.credit?.remainingCredit)} icon="◇" color="#8B5CF6" sub={`Limit: ${fmtFin(finance.credit?.creditLimit)}`} />
                </Link>
                <Link to="/dealer/finance/ledger" style={{ textDecoration: 'none' }}>
                  <StatCard label="Outstanding" value={fmtFin(Math.max(0, finance.outstanding || 0))} icon="≡" color={finance.outstanding > 0 ? '#EF4444' : '#10B981'} sub="Running balance" />
                </Link>
                <Link to="/dealer/finance/invoices" style={{ textDecoration: 'none' }}>
                  <StatCard label="Unpaid Invoices"  value={finance.unpaidInvoices ?? 0} icon="🧾" color="#F59E0B" sub="Pending payment" />
                </Link>
                <Link to="/dealer/finance/payments" style={{ textDecoration: 'none' }}>
                  <StatCard label="Pending Payments" value={finance.pendingPayments ?? 0} icon="💳" color="#3B82F6" sub="Awaiting verify" />
                </Link>
              </div>
            </>
          )}

          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '16px', marginBottom: '28px' }}>
            <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Info</div>
              {[['Dealer Code', dealer?.dealerCode], ['Business', dealer?.businessName], ['Category', dealer?.businessCategory], ['Member Since', dealer?.createdAt ? new Date(dealer.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-4,#9CA3AF)' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text,#111)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>KYC Status</div>
              {[['KYC', dealer?.kycStatus], ['GST', dealer?.gstNumber || '—'], ['PAN', dealer?.panNumber || '—']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-4,#9CA3AF)' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: v === 'verified' ? '#10B981' : v === 'rejected' ? '#EF4444' : 'var(--text,#111)' }}>{v || '—'}</span>
                </div>
              ))}
              <Link to="/dealer/profile" style={{ display: 'block', marginTop: '10px', fontSize: '12px', color: 'var(--accent,#FF7A00)', fontWeight: 600, textDecoration: 'none' }}>Manage Documents →</Link>
            </div>
          </div>

          {/* Recent rows */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)' }}>Recent Orders</div>
                <Link to="/dealer/orders" style={{ fontSize: '12px', color: 'var(--accent,#FF7A00)', textDecoration: 'none', fontWeight: 600 }}>View All</Link>
              </div>
              {!data?.recentOrders?.length ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-4,#9CA3AF)', fontSize: '13px' }}>No orders yet</div>
              ) : data.recentOrders.map(o => (
                <Link key={o._id} to={`/dealer/orders/${o._id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border,#E5E7EB)' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text,#111)' }}>{o.orderNumber}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)' }}>{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text,#111)' }}>₹{o.totalAmount?.toLocaleString('en-IN')}</div>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: statusColors[o.status] || '#6B7280', textTransform: 'capitalize' }}>{o.status}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)' }}>Notifications</div>
                <Link to="/dealer/notifications" style={{ fontSize: '12px', color: 'var(--accent,#FF7A00)', textDecoration: 'none', fontWeight: 600 }}>View All</Link>
              </div>
              {!data?.recentNotifications?.length ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-4,#9CA3AF)', fontSize: '13px' }}>No notifications</div>
              ) : data.recentNotifications.map(n => (
                <div key={n._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border,#E5E7EB)', opacity: n.isRead ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    {!n.isRead && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent,#FF7A00)', flexShrink: 0, marginTop: '4px' }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text,#111)' }}>{n.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </DealerLayout>
  );
}

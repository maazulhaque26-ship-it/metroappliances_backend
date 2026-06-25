import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { dealerLogout } from '../../redux/slices/dealerAuthSlice';
import { fetchDealerCart } from '../../redux/slices/dealerCartSlice';
import dealerAPI from '../../services/dealerAPI';

const NAV = [
  { label: 'Dashboard',     path: '/dealer/dashboard',     icon: '⊞' },
  { label: 'Products',      path: '/dealer/products',      icon: '⊡' },
  { label: 'My Cart',       path: '/dealer/cart',          icon: '⊕', badge: 'cart' },
  { label: 'My Orders',     path: '/dealer/orders',        icon: '⊟' },
  { label: 'Notifications', path: '/dealer/notifications', icon: '◉', badge: 'notif' },
  { divider: 'Finance' },
  { label: 'Finance',       path: '/dealer/finance',       icon: '₹' },
  { label: 'Wallet',        path: '/dealer/finance/wallet',    icon: '◈' },
  { label: 'Invoices',      path: '/dealer/finance/invoices',  icon: '⊘' },
  { label: 'Ledger',        path: '/dealer/finance/ledger',    icon: '≡' },
  { label: 'Payments',      path: '/dealer/finance/payments',  icon: '⊙' },
  { label: 'Credit',        path: '/dealer/finance/credit',    icon: '◇' },
  { label: 'Credit Notes',  path: '/dealer/finance/credit-notes', icon: '⊖' },
  { divider: 'Account' },
  { label: 'My Profile',    path: '/dealer/profile',       icon: '◎' },
];

export default function DealerLayout({ children }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { dealer }       = useSelector(s => s.dealerAuth);
  const { cart }         = useSelector(s => s.dealerCart);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);

  useEffect(() => {
    if (dealer?.status === 'approved') {
      dispatch(fetchDealerCart());
    }
  }, [dealer?.status, dispatch]);

  useEffect(() => {
    dealerAPI.get('/dealer/notifications/unread-count')
      .then(r => setUnreadCount(r.data.count || 0))
      .catch(() => {});
  }, [location.pathname]);

  const cartCount = cart?.items?.length || 0;

  const handleLogout = async () => {
    await dispatch(dealerLogout());
    navigate('/dealer/login');
  };

  const statusColor = {
    pending:   '#F59E0B',
    approved:  '#10B981',
    rejected:  '#EF4444',
    suspended: '#6B7280',
  }[dealer?.status] || '#6B7280';

  const statusLabel = {
    pending:   'Pending Approval',
    approved:  'Approved',
    rejected:  'Rejected',
    suspended: 'Suspended',
  }[dealer?.status] || dealer?.status;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg, #F9FAFB)', fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        width:    '240px',
        minWidth: '240px',
        background: 'var(--card, #fff)',
        borderRight: '1px solid var(--border, #E5E7EB)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.22s ease',
        ...(typeof window !== 'undefined' && window.innerWidth < 768 ? {
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        } : {}),
      }}>

        {/* Brand */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border, #E5E7EB)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'var(--accent, #FF7A00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '14px',
            }}>
              B2B
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text, #111)', lineHeight: 1.2 }}>Dealer Portal</div>
              <div style={{ fontSize: '11px', color: 'var(--text-4, #9CA3AF)' }}>Metro Appliances</div>
            </div>
          </div>
        </div>

        {/* Dealer info */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border, #E5E7EB)' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text, #111)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {dealer?.businessName || 'Business Name'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-4, #9CA3AF)', marginBottom: '6px' }}>
            {dealer?.dealerCode || 'MTR-DLR-XXXXX'}
          </div>
          <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: '100px',
            background: statusColor + '1A', color: statusColor,
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {statusLabel}
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
          {NAV.map((item, idx) => {
            if (item.divider) {
              return (
                <div key={`divider-${idx}`} style={{ padding: '10px 12px 4px', fontSize: '9px', fontWeight: 700, color: 'var(--text-4,#9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {item.divider}
                </div>
              );
            }

            const FINANCE_PATHS = ['/dealer/finance'];
            const COMMERCE_LOCKED = ['Products', 'My Cart', 'My Orders'];
            const FINANCE_LOCKED  = FINANCE_PATHS.some(p => item.path?.startsWith(p));

            const isActive = item.path === '/dealer/finance'
              ? location.pathname === item.path
              : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
            const badgeCount = item.badge === 'cart' ? cartCount : item.badge === 'notif' ? unreadCount : 0;
            const isLocked = (COMMERCE_LOCKED.includes(item.label) || FINANCE_LOCKED) && dealer?.status !== 'approved';

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px', borderRadius: '8px', marginBottom: '1px',
                  textDecoration: 'none',
                  background:  isActive ? 'var(--accent, #FF7A00)' : 'transparent',
                  color:       isActive ? '#fff' : isLocked ? 'var(--text-4, #9CA3AF)' : 'var(--text-2, #374151)',
                  fontSize:    '13px', fontWeight: isActive ? 600 : 500,
                  cursor:      isLocked ? 'not-allowed' : 'pointer',
                  opacity:     isLocked ? 0.5 : 1,
                  pointerEvents: isLocked ? 'none' : undefined,
                  transition:  'background 0.15s ease',
                }}
              >
                <span style={{ fontSize: '15px', lineHeight: 1, minWidth: '18px', textAlign: 'center' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {badgeCount > 0 && (
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.3)' : 'var(--accent, #FF7A00)',
                    color: '#fff',
                    borderRadius: '100px', padding: '1px 6px', fontSize: '10px', fontWeight: 700,
                  }}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
                {isLocked && <span style={{ fontSize: '10px' }}>🔒</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border, #E5E7EB)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '9px', borderRadius: '8px',
              border: '1px solid var(--border, #E5E7EB)',
              background: 'transparent', cursor: 'pointer',
              color: 'var(--text-3, #6B7280)', fontSize: '13px', fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            ↩ Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column', minWidth: 0 }}
        className="dealer-main">
        {/* Mobile topbar */}
        <div style={{
          display: 'none',
          padding: '12px 16px',
          background: 'var(--card, #fff)',
          borderBottom: '1px solid var(--border, #E5E7EB)',
          alignItems: 'center',
          gap: '12px',
          position: 'sticky', top: 0, zIndex: 30,
        }}
          className="dealer-topbar">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text, #111)', padding: '4px' }}
          >
            ☰
          </button>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text, #111)', flex: 1 }}>Dealer Portal</span>
          <span style={{ fontSize: '12px', color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
        </div>

        <main style={{ flex: 1, padding: '24px', maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dealer-main { margin-left: 0 !important; }
          .dealer-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

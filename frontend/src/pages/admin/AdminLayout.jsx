import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth, logout } from '../../redux/slices/authSlice';
import useAdminSocket from '../../hooks/useAdminSocket';
import {
  FiGrid, FiPackage, FiShoppingBag, FiUsers, FiTag, FiSettings,
  FiMenu, FiX, FiLogOut, FiBell, FiStar, FiSearch, FiUser,
  FiMail, FiList, FiShield, FiLayout, FiImage, FiArrowUpRight,
  FiChevronRight, FiChevronDown, FiAward, FiBook, FiHash,
  FiZap, FiLayers, FiTarget, FiRadio, FiMessageSquare, FiBriefcase,
  FiBarChart2, FiTrendingUp, FiMap, FiActivity, FiDownload, FiSliders,
} from 'react-icons/fi';
import Logo from '../../components/ui/Logo';

// Grouped exactly like Linear/Stripe sidebars — flat lists of 14 items read as
// noise; grouped by function lets the eye scan to the right section instantly.
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin', icon: FiGrid, roles: ['admin', 'super_admin', 'moderator'] },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Products',   path: '/admin/products',   icon: FiPackage, roles: ['admin', 'super_admin'] },
      { label: 'Categories', path: '/admin/categories', icon: FiList,    roles: ['admin', 'super_admin'] },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Orders',  path: '/admin/orders',  icon: FiShoppingBag, roles: ['admin', 'super_admin'] },
      { label: 'Coupons', path: '/admin/coupons', icon: FiTag,         roles: ['admin', 'super_admin'] },
    ],
  },
  {
    label: 'Customers',
    items: [
      { label: 'Users',   path: '/admin/users',   icon: FiUsers, roles: ['admin', 'super_admin'] },
      { label: 'Reviews', path: '/admin/reviews', icon: FiStar,  roles: ['admin', 'super_admin', 'moderator'] },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Achievements',   path: '/admin/achievements',       icon: FiAward, roles: ['admin', 'super_admin'] },
      { label: 'Stat Counters',  path: '/admin/achievement-stats',  icon: FiHash,  roles: ['admin', 'super_admin'] },
      { label: 'Gallery',        path: '/admin/gallery',            icon: FiImage, roles: ['admin', 'super_admin'] },
      { label: 'Blog Posts',     path: '/admin/blogs',              icon: FiBook,  roles: ['admin', 'super_admin'] },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Announcement Bar', path: '/admin/announcements',    icon: FiRadio,        roles: ['admin', 'super_admin'] },
      { label: 'Popups',           path: '/admin/popups',           icon: FiMessageSquare, roles: ['admin', 'super_admin'] },
      { label: 'Flash Sales',      path: '/admin/flash-sales',      icon: FiZap,          roles: ['admin', 'super_admin'] },
      { label: 'Promo Sections',   path: '/admin/promo-sections',   icon: FiLayers,       roles: ['admin', 'super_admin'] },
      { label: 'Campaigns',        path: '/admin/campaigns',        icon: FiTarget,       roles: ['admin', 'super_admin'] },
      { label: 'Notifications',    path: '/admin/notifications',    icon: FiBell,         roles: ['admin', 'super_admin'] },
      { label: 'Homepage Content', path: '/admin/homepage-content', icon: FiImage,        roles: ['admin', 'super_admin'] },
      { label: 'Login Page Slider',path: '/admin/login-slider',     icon: FiLayout,       roles: ['admin', 'super_admin'] },
      { label: 'Why Choose Metro', path: '/admin/why-choose',       icon: FiLayout,       roles: ['admin', 'super_admin'] },
      { label: 'Testimonials',     path: '/admin/testimonials',     icon: FiStar,         roles: ['admin', 'super_admin', 'moderator'] },
      { label: 'Team',             path: '/admin/team',             icon: FiUsers,        roles: ['admin', 'super_admin'] },
      { label: 'Subscribers',      path: '/admin/subscribers',      icon: FiMail,         roles: ['admin', 'super_admin'] },
    ],
  },
  {
    label: 'Dealers',
    items: [
      { label: 'All Dealers',     path: '/admin/dealers',             icon: FiBriefcase,   roles: ['admin', 'super_admin'] },
      { label: 'Dealer Pricing',  path: '/admin/dealer-pricing',      icon: FiTag,         roles: ['admin', 'super_admin'] },
      { label: 'Dealer Orders',   path: '/admin/dealer-orders',       icon: FiShoppingBag, roles: ['admin', 'super_admin'] },
      { label: 'Dealer Wallets',  path: '/admin/dealer-wallet',       icon: FiLayers,      roles: ['admin', 'super_admin'] },
      { label: 'Dealer Credit',   path: '/admin/dealer-credit',       icon: FiShield,      roles: ['admin', 'super_admin'] },
      { label: 'Dealer Invoices', path: '/admin/dealer-invoices',     icon: FiList,        roles: ['admin', 'super_admin'] },
      { label: 'Dealer Payments', path: '/admin/dealer-payments',     icon: FiArrowUpRight, roles: ['admin', 'super_admin'] },
      { label: 'Credit Notes',    path: '/admin/dealer-credit-notes', icon: FiBook,        roles: ['admin', 'super_admin'] },
    ],
  },
  {
    label: 'CRM',
    items: [
      { label: 'Sales Agents',    path: '/admin/sales-agents',      icon: FiUsers,       roles: ['admin', 'super_admin'] },
      { label: 'Territories',     path: '/admin/territories',        icon: FiTarget,      roles: ['admin', 'super_admin'] },
      { label: 'Leads',           path: '/admin/leads',              icon: FiArrowUpRight, roles: ['admin', 'super_admin'] },
      { label: 'Visit Reports',   path: '/admin/visit-reports',      icon: FiList,        roles: ['admin', 'super_admin'] },
      { label: 'Agent Tasks',     path: '/admin/agent-tasks',        icon: FiHash,        roles: ['admin', 'super_admin'] },
      { label: 'Assignments',     path: '/admin/agent-assignments',  icon: FiBriefcase,   roles: ['admin', 'super_admin'] },
    ],
  },
  {
    label: 'BI & Analytics',
    items: [
      { label: 'BI Dashboard',        path: '/admin/bi/dashboard',    icon: FiBarChart2, roles: ['admin', 'super_admin'] },
      { label: 'Revenue Analytics',   path: '/admin/bi/revenue',      icon: FiTrendingUp, roles: ['admin', 'super_admin'] },
      { label: 'Sales Dashboard',     path: '/admin/bi/sales',        icon: FiShoppingBag, roles: ['admin', 'super_admin'] },
      { label: 'Agent Performance',   path: '/admin/bi/agents',       icon: FiUsers,      roles: ['admin', 'super_admin'] },
      { label: 'Dealer Analytics',    path: '/admin/bi/dealers',      icon: FiBriefcase,  roles: ['admin', 'super_admin'] },
      { label: 'Territory Analytics', path: '/admin/bi/territories',  icon: FiMap,        roles: ['admin', 'super_admin'] },
      { label: 'Lead Funnel',         path: '/admin/bi/leads',        icon: FiActivity,   roles: ['admin', 'super_admin'] },
      { label: 'Reports & Export',    path: '/admin/bi/reports',      icon: FiDownload,   roles: ['admin', 'super_admin'] },
      { label: 'Targets',             path: '/admin/bi/targets',      icon: FiSliders,    roles: ['admin', 'super_admin'] },
    ],
  },
  {
    label: 'Enterprise',
    items: [
      { label: 'Audit Log', path: '/admin/audit-log', icon: FiShield, roles: ['admin', 'super_admin'] },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Store Settings', path: '/admin/settings',   icon: FiSettings, roles: ['admin', 'super_admin'] },
      { label: 'Admins',         path: '/admin/management', icon: FiShield,   roles: ['super_admin'] },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);

const NOTIFICATION_META = {
  'order:created':       { icon: FiShoppingBag, text: (p) => `New order ${p?.order?.orderNumber ? `#${p.order.orderNumber}` : ''} placed`, path: '/admin/orders' },
  'order:statusChanged': { icon: FiShoppingBag, text: (p) => `Order ${p?.order?.orderNumber ? `#${p.order.orderNumber}` : ''} status changed`, path: '/admin/orders' },
  'review:created':      { icon: FiStar,        text: () => 'New product review submitted', path: '/admin/reviews' },
};

const SIDEBAR_BG    = '#0C0C0C';
const SIDEBAR_WIDTH = 'w-60';

export default function AdminLayout({ children }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useSelector(s => s.auth);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unseenCount,   setUnseenCount]   = useState(0);
  const [userOpen,      setUserOpen]      = useState(false);

  const searchRef = useRef(null);
  const notifRef  = useRef(null);
  const userRef   = useRef(null);

  const handleLogout = () => { dispatch(clearAuth()); dispatch(logout()); navigate('/'); };
  const isActive = (path) => path === '/admin'
    ? location.pathname === '/admin'
    : location.pathname.startsWith(path);

  const visibleGroups = NAV_GROUPS
    .map(g => ({ ...g, items: g.items.filter(i => !i.roles || i.roles.includes(user?.role)) }))
    .filter(g => g.items.length > 0);

  const currentItem  = ALL_ITEMS.find(i => isActive(i.path));
  const currentLabel = currentItem?.label || 'Admin';
  const currentGroup = visibleGroups.find(g => g.items.includes(currentItem))?.label;

  // Real-time notifications — reuses the same socket events Dashboard.jsx already
  // listens to (order:created, order:statusChanged, review:created). No backend
  // change: these events are already emitted by the existing order/review controllers.
  useAdminSocket({
    'order:created':       (p) => pushNotification('order:created', p),
    'order:statusChanged': (p) => pushNotification('order:statusChanged', p),
    'review:created':      (p) => pushNotification('review:created', p),
  });

  function pushNotification(event, payload) {
    setNotifications(prev => [{ id: `${event}-${Date.now()}`, event, payload, at: new Date() }, ...prev].slice(0, 8));
    setUnseenCount(c => c + 1);
  }

  useEffect(() => {
    const close = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return ALL_ITEMS.filter(i => (!i.roles || i.roles.includes(user?.role)) && i.label.toLowerCase().includes(q)).slice(0, 6);
  }, [searchQuery, user?.role]);

  const goTo = (path) => { navigate(path); setSearchOpen(false); setSearchQuery(''); setSidebarOpen(false); };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 ${SIDEBAR_WIDTH} flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ background: SIDEBAR_BG, borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo area — brightness-0/invert previously flattened this full-colour
            badge (black ring, white text, gold stars) into a plain white blob.
            The badge's own colours already read cleanly on the dark sidebar. */}
        <div className="flex items-center justify-between px-6" style={{ height: '92px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Logo imageClass="h-14 w-auto" />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-white/50 hover:text-white">
            <FiX size={18} />
          </button>
        </div>

        {/* Role badge */}
        {user?.role && (
          <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.2em] px-2.5 py-1"
              style={{
                color: 'var(--accent)',
                background: 'rgba(255,138,0,0.1)',
                border: '1px solid rgba(255,138,0,0.18)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {user.role.replace('_', ' ')}
            </span>
          </div>
        )}

        {/* Nav — grouped */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar space-y-4">
          {visibleGroups.map(group => (
            <div key={group.label}>
              <p className="px-3.5 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ label, path, icon: Icon }) => {
                  const active = isActive(path);
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 text-[12.5px] font-medium transition-all duration-150"
                      style={{
                        color: active ? '#ffffff' : 'rgba(255,255,255,0.45)',
                        background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
                        borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                        fontWeight: active ? 600 : 400,
                        letterSpacing: '0.01em',
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent'; }}}
                    >
                      <Icon size={14} strokeWidth={active ? 2.5 : 1.75} style={{ color: active ? 'var(--accent)' : 'inherit', flexShrink: 0 }} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-3 py-3 mb-2" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
            <div className="w-7 h-7 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ background: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold truncate" style={{ color: '#fff' }}>{user?.name}</p>
              <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-[12px] font-medium transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.35)', borderRadius: 'var(--radius-sm)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <FiLogOut size={13} strokeWidth={1.75} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-60 min-w-0 flex flex-col">

        {/* Topbar */}
        <div className="sticky top-0 z-20" style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', boxShadow: '0 1px 0 rgba(0,0,0,0.03)' }}>
          <div className="flex items-center justify-between px-6 lg:px-8 h-14 gap-4">
            {/* Left: hamburger + breadcrumb */}
            <div className="flex items-center gap-4 min-w-0">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 transition-colors flex-shrink-0" style={{ color: 'var(--text)' }}>
                <FiMenu size={20} strokeWidth={1.75} />
              </button>
              <div className="flex items-center gap-1.5 text-[13px] min-w-0" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="font-medium hidden sm:inline" style={{ color: 'var(--text-4)' }}>Admin</span>
                {currentGroup && (
                  <>
                    <FiChevronRight size={12} className="hidden sm:inline" style={{ color: 'var(--text-5)' }} />
                    <span className="font-medium hidden sm:inline" style={{ color: 'var(--text-4)' }}>{currentGroup}</span>
                  </>
                )}
                <FiChevronRight size={12} className="hidden sm:inline" style={{ color: 'var(--text-5)' }} />
                <span className="font-semibold truncate" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>{currentLabel}</span>
              </div>
            </div>

            {/* Right: search, notifications, view store, user */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative" ref={searchRef}>
                <div
                  className="flex items-center transition-all"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    width: searchOpen ? '220px' : '36px',
                    overflow: 'hidden',
                  }}
                >
                  <button onClick={() => setSearchOpen(o => !o)} className="p-2 flex-shrink-0" style={{ color: 'var(--text-3)' }} aria-label="Search admin pages">
                    <FiSearch size={15} strokeWidth={1.75} />
                  </button>
                  {searchOpen && (
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search pages…"
                      className="bg-transparent outline-none text-[12.5px] pr-3 w-full"
                      style={{ color: 'var(--text)' }}
                    />
                  )}
                </div>
                {searchOpen && searchResults.length > 0 && (
                  <div
                    className="absolute right-0 mt-2 w-60 overflow-hidden"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}
                  >
                    {searchResults.map(r => (
                      <button
                        key={r.path}
                        onClick={() => goTo(r.path)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[12.5px] font-medium transition-colors"
                        style={{ color: 'var(--text-2)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <r.icon size={14} style={{ color: 'var(--text-4)' }} /> {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(o => !o); setUnseenCount(0); }}
                  className="relative p-2 transition-colors"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                  aria-label="Notifications"
                >
                  <FiBell size={17} strokeWidth={1.75} />
                  {unseenCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2" style={{ borderColor: 'var(--card)' }} />
                  )}
                </button>
                {notifOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 overflow-hidden"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Notifications</p>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-[12px]" style={{ color: 'var(--text-4)' }}>No new activity this session.</p>
                    ) : (
                      <div className="max-h-72 overflow-y-auto no-scrollbar">
                        {notifications.map(n => {
                          const meta = NOTIFICATION_META[n.event];
                          const Icon = meta?.icon || FiBell;
                          return (
                            <button
                              key={n.id}
                              onClick={() => { navigate(meta?.path || '/admin'); setNotifOpen(false); }}
                              className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                              style={{ borderBottom: '1px solid var(--border)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <Icon size={14} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }} />
                              <div className="min-w-0">
                                <p className="text-[12.5px] font-medium leading-snug" style={{ color: 'var(--text)' }}>{meta?.text(n.payload) || n.event}</p>
                                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-4)' }}>{n.at.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* View Store */}
              <Link
                to="/"
                className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-4 py-2 transition-all"
                style={{ color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--bg-2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }}
              >
                View Store <FiArrowUpRight size={12} strokeWidth={2.5} />
              </Link>

              {/* User dropdown */}
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserOpen(o => !o)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 transition-colors"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                >
                  <div className="w-7 h-7 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ background: 'var(--text)', borderRadius: 'var(--radius-sm)' }}>
                    {user?.name?.[0]?.toUpperCase() || <FiUser size={13} />}
                  </div>
                  <FiChevronDown size={13} style={{ color: 'var(--text-4)' }} />
                </button>
                {userOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 overflow-hidden"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <p className="text-[12.5px] font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.name}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-4)' }}>{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-medium transition-colors"
                      style={{ color: '#DC2626' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <FiLogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-6 lg:p-10" style={{ maxWidth: '80rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

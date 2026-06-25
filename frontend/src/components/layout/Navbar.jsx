import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth, logout } from '../../redux/slices/authSlice';
import { fetchCategories } from '../../redux/slices/shopSlices';
import {
  FiShoppingCart, FiHeart, FiUser, FiSearch, FiMenu, FiX,
  FiChevronDown, FiPackage, FiLogOut, FiGrid, FiList, FiBell,
} from 'react-icons/fi';
import Logo from '../ui/Logo';
import SearchPanel from '../ui/SearchPanel';
import NotificationCenter from '../ui/NotificationCenter';

// path     = where the link navigates to
// activePath = pathname used for active-state matching (avoids dual-highlight
//              when two links share the same destination)
const NAV_LINKS = [
  { label: 'Home',        path: '/',        activePath: '/'        },
  { label: 'Products',    path: '/shop',    activePath: '/shop'    },
  { label: 'About',       path: '/about',   activePath: '/about'   },
  { label: 'Blogs',       path: '/about',   activePath: '/blog'    },
  { label: 'Contact',     path: '/contact', activePath: '/contact' },
  { label: 'Track Order', path: '/orders',  activePath: '/orders'  },
];

export default function Navbar() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, token }         = useSelector(s => s.auth);
  const { items: cartItems }    = useSelector(s => s.cart);
  const { products: wishItems } = useSelector(s => s.wishlist);
  const { categories }          = useSelector(s => s.products);

  const unreadCount = useSelector(s => s.notifications?.unreadCount || 0);

  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userOpen,    setUserOpen]    = useState(false);
  const [catsOpen,    setCatsOpen]    = useState(false);
  const [mobCatOpen,  setMobCatOpen]  = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const searchRef  = useRef(null);
  const userRef    = useRef(null);
  const notifRef   = useRef(null);

  useEffect(() => { dispatch(fetchCategories()); }, [dispatch]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close all panels on route change
  useEffect(() => {
    setMobileOpen(false); setSearchOpen(false); setUserOpen(false); setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const close = (e) => {
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Global ESC handler
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setSearchOpen(false); setMobileOpen(false); setUserOpen(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = useCallback(() => {
    dispatch(clearAuth()); dispatch(logout()); navigate('/');
  }, [dispatch, navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) { navigate(`/shop?search=${encodeURIComponent(q)}`); setSearchQuery(''); setSearchOpen(false); }
  };

  const cartCount = cartItems?.length || 0;
  const wishCount = wishItems?.length || 0;
  const isActive  = (link) => location.pathname === link.activePath;

  return (
    <>
      {/* ── Main Nav ───────────────────────────────────────────────── */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        className={`fixed left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'top-0 border-b border-[rgba(17,17,17,0.08)]'
            : 'top-0 border-b border-transparent'
        }`}
        style={{
          background: scrolled
            ? 'rgba(255,255,255,0.92)'
            : 'rgba(245,245,245,0.96)',
          backdropFilter:         'blur(20px) saturate(180%)',
          WebkitBackdropFilter:   'blur(20px) saturate(180%)',
          boxShadow: scrolled ? '0 1px 0 rgba(17,17,17,0.06), 0 4px 16px rgba(0,0,0,0.04)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[72px]">

            {/* ── Logo ──────────────────────────────────────────────── */}
            <Logo imageClass="h-12 sm:h-14 w-auto" />

            {/* ── Desktop nav links ─────────────────────────────────── */}
            <div className="hidden lg:flex items-center">
              {NAV_LINKS.map(l => (
                <Link
                  key={l.label}
                  to={l.path}
                  aria-current={isActive(l) ? 'page' : undefined}
                  className={`relative px-3 xl:px-4 py-2 text-[11px] tracking-[0.12em] font-bold uppercase transition-colors duration-200 ${
                    isActive(l) ? 'text-[#111111]' : 'text-[#888888] hover:text-[#111111]'
                  }`}
                >
                  {l.label}
                  {isActive(l) && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-3 xl:left-4 right-3 xl:right-4 h-px bg-[#111111]"
                    />
                  )}
                </Link>
              ))}

              {/* Collections dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setCatsOpen(true)}
                onMouseLeave={() => setCatsOpen(false)}
              >
                <button
                  aria-expanded={catsOpen}
                  aria-haspopup="true"
                  className={`relative flex items-center gap-1.5 px-3 xl:px-4 py-2 text-[11px] tracking-[0.12em] uppercase font-bold transition-colors duration-200 ${
                    catsOpen ? 'text-[#111111]' : 'text-[#888888] hover:text-[#111111]'
                  }`}
                >
                  Collections
                  <FiChevronDown
                    size={12}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className={`transition-transform duration-200 ${catsOpen ? 'rotate-180' : ''}`}
                    style={{ transitionTimingFunction: 'var(--ease)' }}
                  />
                </button>

                {/* Dropdown panel */}
                <div
                  role="menu"
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50"
                  style={{
                    opacity:      catsOpen ? 1 : 0,
                    transform:    catsOpen ? 'translate(-50%, 0) scale(1)' : 'translate(-50%, -8px) scale(0.97)',
                    pointerEvents: catsOpen ? 'auto' : 'none',
                    transition:   'opacity 0.22s var(--ease), transform 0.22s var(--ease)',
                  }}
                >
                  <div
                    className="w-[560px] bg-white border border-[rgba(17,17,17,0.08)] shadow-[0_16px_40px_rgba(0,0,0,0.10)] p-7 max-h-[70vh] overflow-y-auto no-scrollbar"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-5" style={{ color: 'var(--text-4)' }}>
                      Metro Product Collections
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                      {categories?.map((cat) => (
                        <Link
                          key={cat.slug}
                          to={`/shop?category=${cat.slug}`}
                          role="menuitem"
                          className="flex items-center gap-3 p-2.5 -mx-2.5 group hover:bg-[#F5F5F5] transition-colors duration-150"
                          style={{ borderRadius: 'var(--radius-sm)' }}
                        >
                          <div className="w-8 h-8 bg-[#F5F5F5] flex items-center justify-center flex-shrink-0 group-hover:bg-[#111111] transition-colors duration-200" style={{ borderRadius: 'var(--radius-sm)' }}>
                            <FiList size={13} aria-hidden="true" className="text-[#666666] group-hover:text-white transition-colors" />
                          </div>
                          <span className="text-[13px] font-semibold text-[#111111] leading-tight">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right icon cluster ────────────────────────────────── */}
            <div className="flex items-center gap-0.5">

              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                className="p-2.5 text-[#888888] hover:text-[#111111] transition-colors duration-150 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <FiSearch size={18} strokeWidth={2} aria-hidden="true" />
              </button>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                aria-label={`Wishlist${wishCount > 0 ? ` (${wishCount} items)` : ''}`}
                className="relative p-2.5 text-[#888888] hover:text-[#111111] transition-colors duration-150 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <FiHeart size={18} strokeWidth={2} aria-hidden="true" />
                {wishCount > 0 && (
                  <span aria-hidden="true" className="absolute top-1.5 right-1.5 w-[14px] h-[14px] bg-[#111111] text-white text-[8px] font-bold flex items-center justify-center rounded-full leading-none">
                    {wishCount > 9 ? '9+' : wishCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                aria-label={`Cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
                className="relative p-2.5 text-[#888888] hover:text-[#111111] transition-colors duration-150 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <FiShoppingCart size={18} strokeWidth={2} aria-hidden="true" />
                {cartCount > 0 && (
                  <span aria-hidden="true" className="absolute top-1.5 right-1.5 w-[14px] h-[14px] bg-[#111111] text-white text-[8px] font-bold flex items-center justify-center rounded-full leading-none">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Notifications (logged-in only) */}
              {token && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(o => !o)}
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                    className="relative p-2.5 text-[#888888] hover:text-[#111111] transition-colors duration-150 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <FiBell size={18} strokeWidth={2} aria-hidden="true" />
                    {unreadCount > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute top-1.5 right-1.5 w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full leading-none"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
                  )}
                </div>
              )}

              {/* User */}
              {token ? (
                <div className="relative ml-2" ref={userRef}>
                  <button
                    onClick={() => setUserOpen(!userOpen)}
                    aria-expanded={userOpen}
                    aria-haspopup="true"
                    aria-label="Account menu"
                    className="flex items-center gap-2 px-2.5 py-1.5 border border-[rgba(17,17,17,0.12)] hover:border-[rgba(17,17,17,0.28)] transition-all duration-150 bg-white/60 min-w-[44px] min-h-[44px]"
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  >
                    <div aria-hidden="true" className="w-7 h-7 bg-[#111111] text-white flex items-center justify-center text-[11px] font-bold" style={{ borderRadius: '2px' }}>
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <FiChevronDown
                      size={12}
                      strokeWidth={2.5}
                      aria-hidden="true"
                      className={`text-[#888888] transition-transform duration-200 ${userOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* User dropdown */}
                  {userOpen && (
                    <div
                      role="menu"
                      className="absolute top-full right-0 mt-2 w-56 bg-white border border-[rgba(17,17,17,0.08)] shadow-[0_12px_32px_rgba(0,0,0,0.10)] animate-slideDown z-50"
                      style={{ borderRadius: 'var(--radius-md)' }}
                    >
                      <div className="px-4 py-4 border-b border-[rgba(17,17,17,0.06)] bg-[#F5F5F5]" style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
                        <p className="font-bold text-[13px] text-[#111111] truncate leading-tight">{user?.name}</p>
                        <p className="text-[11px] text-[#888888] mt-0.5 truncate">{user?.email}</p>
                      </div>
                      <div className="p-1.5">
                        {['admin', 'super_admin', 'moderator'].includes(user?.role) && (
                          <Link to="/admin" role="menuitem" className="flex items-center gap-3 px-3 py-2.5 text-[12px] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#111111] font-semibold uppercase tracking-widest transition-colors" style={{ borderRadius: 'var(--radius-sm)' }}>
                            <FiGrid size={14} aria-hidden="true" /> Admin Panel
                          </Link>
                        )}
                        <Link to="/profile" role="menuitem" className="flex items-center gap-3 px-3 py-2.5 text-[12px] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#111111] font-semibold uppercase tracking-widest transition-colors" style={{ borderRadius: 'var(--radius-sm)' }}>
                          <FiUser size={14} aria-hidden="true" /> My Profile
                        </Link>
                        <Link to="/orders" role="menuitem" className="flex items-center gap-3 px-3 py-2.5 text-[12px] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#111111] font-semibold uppercase tracking-widest transition-colors" style={{ borderRadius: 'var(--radius-sm)' }}>
                          <FiPackage size={14} aria-hidden="true" /> My Orders
                        </Link>
                        <Link to="/wishlist" role="menuitem" className="flex items-center gap-3 px-3 py-2.5 text-[12px] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#111111] font-semibold uppercase tracking-widest transition-colors" style={{ borderRadius: 'var(--radius-sm)' }}>
                          <FiHeart size={14} aria-hidden="true" /> Wishlist
                        </Link>
                      </div>
                      <div className="p-1.5 border-t border-[rgba(17,17,17,0.06)]">
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] text-red-500 hover:bg-red-50 font-semibold uppercase tracking-widest transition-colors"
                          style={{ borderRadius: 'var(--radius-sm)' }}
                        >
                          <FiLogOut size={14} aria-hidden="true" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 ml-3 px-5 py-2.5 border border-[#111111] text-[#111111] text-[11px] font-bold uppercase tracking-[0.1em] hover:bg-[#111111] hover:text-white transition-all duration-200 bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                >
                  Sign In
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
                className="lg:hidden p-2.5 text-[#888888] hover:text-[#111111] ml-1 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                {mobileOpen
                  ? <FiX    size={22} strokeWidth={2} aria-hidden="true" />
                  : <FiMenu size={22} strokeWidth={2} aria-hidden="true" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile drawer — CSS max-height transition, no remount ── */}
        <div
          id="mobile-nav"
          aria-hidden={!mobileOpen}
          className="lg:hidden overflow-hidden"
          style={{
            maxHeight:    mobileOpen ? '80vh' : '0',
            opacity:      mobileOpen ? 1      : 0,
            pointerEvents: mobileOpen ? 'auto' : 'none',
            transition: 'max-height 320ms var(--ease), opacity 220ms var(--ease)',
          }}
        >
          <div
            className="overflow-y-auto no-scrollbar"
            style={{
              maxHeight:              '80vh',
              background:             'rgba(255,255,255,0.98)',
              backdropFilter:         'blur(24px)',
              WebkitBackdropFilter:   'blur(24px)',
              borderTop:              '1px solid rgba(17,17,17,0.07)',
            }}
          >
            <div className="px-4 py-6 space-y-4">

              {/* Mobile search */}
              <form onSubmit={handleSearch} className="relative">
                <FiSearch size={15} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888888]" strokeWidth={2} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search appliances..."
                  aria-label="Search"
                  className="w-full pl-10 pr-4 py-3.5 bg-[#F5F5F5] border border-[rgba(17,17,17,0.08)] focus:border-[#111111] outline-none text-sm font-medium"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </form>

              {/* Nav links */}
              <nav role="navigation" aria-label="Mobile navigation">
                <div className="space-y-0.5">
                  {NAV_LINKS.map(l => (
                    <Link
                      key={l.label}
                      to={l.path}
                      aria-current={isActive(l) ? 'page' : undefined}
                      className={`block px-4 py-3.5 text-[12px] font-bold uppercase tracking-widest transition-colors ${
                        isActive(l) ? 'text-[#111111] bg-[#F5F5F5]' : 'text-[#666666] hover:text-[#111111]'
                      }`}
                      style={{ borderRadius: 'var(--radius-sm)' }}
                      onClick={() => setMobileOpen(false)}
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Collections accordion */}
              <div style={{ borderTop: '1px solid rgba(17,17,17,0.06)' }}>
                <button
                  type="button"
                  aria-expanded={mobCatOpen}
                  onClick={() => setMobCatOpen(!mobCatOpen)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-[12px] font-bold uppercase tracking-widest text-[#666666]"
                >
                  Collections
                  <FiChevronDown aria-hidden="true" size={16} strokeWidth={2} className={`transition-transform duration-200 ${mobCatOpen ? 'rotate-180' : ''}`} />
                </button>
                <div
                  className="overflow-hidden"
                  style={{
                    maxHeight: mobCatOpen ? '400px' : '0',
                    transition: 'max-height 280ms var(--ease)',
                  }}
                >
                  <div className="pb-2 grid grid-cols-1 gap-0.5 px-2">
                    {categories?.map((cat) => (
                      <Link
                        key={cat.slug}
                        to={`/shop?category=${cat.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-[#111111] font-semibold hover:bg-[#F5F5F5] transition-colors"
                        style={{ borderRadius: 'var(--radius-sm)' }}
                      >
                        <FiList size={13} aria-hidden="true" className="text-[#888888] flex-shrink-0" />
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Auth buttons for guests */}
              {!token && (
                <div className="pt-2 flex gap-3" style={{ borderTop: '1px solid rgba(17,17,17,0.06)' }}>
                  <Link
                    to="/login"
                    className="flex-1 py-3.5 bg-[#111111] text-white text-center text-[11px] font-bold uppercase tracking-widest"
                    style={{ borderRadius: 'var(--radius-sm)' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 py-3.5 border border-[#111111] text-[#111111] text-center text-[11px] font-bold uppercase tracking-widest"
                    style={{ borderRadius: 'var(--radius-sm)' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Search panel (premium) ───────────────────────────────────── */}
      <SearchPanel isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

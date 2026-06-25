import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../redux/slices/authSlice';
import API from '../services/api';
import { toast } from 'react-toastify';
import { estimateExpectedDelivery } from '../utils/orderTracking';
import OrderStatusBadge from '../components/ui/OrderStatusBadge';
import { Skeleton } from '../components/ui/Skeleton';
import {
  FiUser, FiLock, FiMapPin, FiPlus, FiTrash2, FiEdit2,
  FiEye, FiEyeOff, FiPackage, FiHeart, FiGrid, FiMessageSquare,
  FiChevronRight, FiShield, FiMail, FiPhone, FiGlobe,
  FiAward, FiBell,
} from 'react-icons/fi';

const ADDR_LABELS = ['Home', 'Office', 'Other'];
const BLANK_ADDR  = { label: 'Home', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', isDefault: false };

function getGreeting(name) {
  const h = new Date().getHours();
  const t = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${t}, ${name?.split(' ')[0] || 'there'}`;
}

function calcCompletion(user) {
  const checks = [!!user?.name, !!user?.phone, (user?.addresses?.length || 0) >= 1, !!user?.email];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// Shared input style
const inputStyle = {
  width: '100%', padding: '11px 14px', background: 'var(--card)',
  border: '1px solid var(--border)', color: 'var(--text)',
  fontSize: '14px', outline: 'none', borderRadius: 'var(--radius-sm)',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block', fontSize: '10px', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.2em',
  color: 'var(--text-4)', marginBottom: '7px',
};

const primaryBtn = {
  width: '100%', padding: '13px', background: 'var(--text)', color: '#fff',
  border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700,
  fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em',
  cursor: 'pointer', transition: 'background 0.2s',
};

const TABS = [
  { key: 'Overview',  icon: FiGrid,         label: 'Overview'  },
  { key: 'Profile',   icon: FiUser,          label: 'Profile'   },
  { key: 'Addresses', icon: FiMapPin,        label: 'Addresses' },
  { key: 'Security',  icon: FiShield,        label: 'Security'  },
  { key: 'Support',   icon: FiMessageSquare, label: 'Support'   },
];

export default function Profile() {
  const dispatch   = useDispatch();
  const { user }   = useSelector(s => s.auth);
  const wishItems  = useSelector(s => s.wishlist.products);

  const [tab,     setTab]     = useState('Overview');
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwd,     setPwd]     = useState({ currentPassword: '', newPassword: '', confirmNew: '' });
  const [showPwd, setShowPwd] = useState({});
  const [addForm, setAddForm] = useState(null);
  const [editId,  setEditId]  = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Support ticket
  const [ticketType,    setTicketType]    = useState('General');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  // Dashboard data
  const [recentOrders,  setRecentOrders]  = useState([]);
  const [totalOrders,   setTotalOrders]   = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    API.get('/orders/my-orders').then(r => {
      const list = r.data.orders || [];
      setTotalOrders(list.length);
      setRecentOrders(list.slice(0, 3));
    }).catch(() => {}).finally(() => setOrdersLoading(false));
  }, [user?._id]);

  const completion = useMemo(() => calcCompletion(user), [user]);

  // ── Handlers (all kept identical to existing logic) ──────────────────────

  const handleProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data } = await API.put('/auth/profile', profile);
      dispatch(setUser(data.user));
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirmNew) { toast.error('Passwords do not match'); return; }
    if (pwd.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      setSaving(true);
      await API.put('/auth/password', { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      setPwd({ currentPassword: '', newPassword: '', confirmNew: '' });
      toast.success('Password changed!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      let data;
      if (editId) {
        const r = await API.put(`/auth/addresses/${editId}`, addForm);
        data = r.data;
      } else {
        const r = await API.post('/auth/addresses', addForm);
        data = r.data;
      }
      dispatch(setUser({ ...user, addresses: data.addresses }));
      setAddForm(null); setEditId(null);
      toast.success(editId ? 'Address updated!' : 'Address added!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteAddr = async (id) => {
    try {
      const { data } = await API.delete(`/auth/addresses/${id}`);
      dispatch(setUser({ ...user, addresses: data.addresses }));
      setConfirmDeleteId(null);
      toast.success('Address removed');
    } catch { toast.error('Failed'); }
  };

  const handleTicketSubmit = () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) { toast.info('Please fill in all fields'); return; }
    toast.success('Ticket submitted — we\'ll respond within 24 hours.');
    setTicketSubject(''); setTicketMessage(''); setTicketType('General');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pt-32 pb-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* ── Account Header ── */}
        <div className="flex items-center gap-5 mb-10">
          <div
            className="w-16 h-16 flex-shrink-0 flex items-center justify-center font-extrabold text-2xl"
            style={{ background: 'var(--text)', color: '#fff', borderRadius: '50%', fontFamily: 'var(--font-display)', lineHeight: 1, letterSpacing: '-0.02em' }}
            aria-hidden="true"
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h1
              className="font-extrabold"
              style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
            >
              {user?.name || 'My Account'}
            </h1>
            <p style={{ color: 'var(--text-4)', fontSize: '13px', marginTop: '3px' }}>{user?.email}</p>
          </div>
          {user?.role === 'admin' && (
            <span
              className="flex-shrink-0 px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)' }}
            >
              Admin
            </span>
          )}
        </div>

        {/* ── Tab Bar ── */}
        <nav aria-label="Account sections">
          <div className="flex overflow-x-auto no-scrollbar" style={{ borderBottom: '1px solid var(--border)', marginBottom: '40px' }}>
            {TABS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={tab === key ? 'page' : undefined}
                className="flex items-center gap-2 px-5 py-4 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap border-b-2 -mb-px transition-all"
                style={{ color: tab === key ? 'var(--text)' : 'var(--text-4)', borderColor: tab === key ? 'var(--text)' : 'transparent' }}
              >
                <Icon size={13} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* ════════════════════════════════════════════ OVERVIEW */}
        {tab === 'Overview' && (
          <div className="space-y-10">

            {/* Greeting banner */}
            <div style={{ padding: '28px 32px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>My Account</p>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(20px,4vw,30px)', color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                {getGreeting(user?.name)}
              </h2>
              {completion < 100 && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>Profile Complete</p>
                    <p className="text-[11px] font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-numbers)' }}>{completion}%</p>
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg-2)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${completion}%`, height: '100%', background: 'var(--text)', borderRadius: '99px', transition: 'width 1.2s var(--ease)' }} />
                  </div>
                  {!user?.phone && (
                    <p className="mt-2 text-[11px]" style={{ color: 'var(--text-4)' }}>
                      Add your phone number.{' '}
                      <button
                        onClick={() => setTab('Profile')}
                        className="font-bold"
                        style={{ color: 'var(--text)', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                      >
                        Update now →
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: FiPackage, label: 'Total Orders',   value: ordersLoading ? '…' : totalOrders,           link: '/my-orders'  },
                { icon: FiHeart,   label: 'Wishlist',       value: wishItems?.length || 0,                        link: '/wishlist'   },
                { icon: FiMapPin,  label: 'Addresses',      value: user?.addresses?.length || 0,                 action: () => setTab('Addresses') },
                { icon: FiAward,   label: 'Reward Points',  value: '—',  note: 'Coming soon', link: null },
              ].map(({ icon: Icon, label, value, link, action, note }) => {
                const cardStyle = {
                  padding: '20px', background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', transition: 'border-color 0.2s',
                  cursor: (link || action) ? 'pointer' : 'default',
                };
                const inner = (
                  <>
                    <Icon size={16} style={{ color: 'var(--text-3)', marginBottom: '10px', display: 'block' }} aria-hidden="true" />
                    <p style={{ fontFamily: 'var(--font-numbers)', fontSize: '30px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</p>
                    <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-4)', marginTop: '8px' }}>{label}</p>
                    {note && <p style={{ fontSize: '9px', color: 'var(--text-5)', marginTop: '3px' }}>{note}</p>}
                  </>
                );
                if (link) return (
                  <Link key={label} to={link} style={cardStyle}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    {inner}
                  </Link>
                );
                if (action) return (
                  <button key={label} onClick={action} style={cardStyle} className="text-left"
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    {inner}
                  </button>
                );
                return <div key={label} style={cardStyle}>{inner}</div>;
              })}
            </div>

            {/* Quick actions */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-4)' }}>Quick Actions</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'View All Orders',  icon: FiPackage,        to: '/my-orders' },
                  { label: 'My Wishlist',       icon: FiHeart,          to: '/wishlist' },
                  { label: 'Edit Profile',      icon: FiUser,           action: () => setTab('Profile') },
                  { label: 'Add Address',       icon: FiMapPin,         action: () => { setTab('Addresses'); setTimeout(() => setAddForm({ ...BLANK_ADDR }), 80); } },
                  { label: 'Change Password',   icon: FiLock,           action: () => setTab('Security') },
                  { label: 'Get Support',       icon: FiMessageSquare,  action: () => setTab('Support') },
                ].map(({ label, icon: Icon, to, action }) => {
                  const inner = (
                    <div
                      className="flex items-center gap-3"
                      style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', transition: 'border-color 0.2s', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <Icon size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} aria-hidden="true" />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', flex: 1 }}>{label}</span>
                      <FiChevronRight size={11} style={{ color: 'var(--text-5)', flexShrink: 0 }} aria-hidden="true" />
                    </div>
                  );
                  return to ? (
                    <Link key={label} to={to}>{inner}</Link>
                  ) : (
                    <button key={label} onClick={action} className="text-left w-full">{inner}</button>
                  );
                })}
              </div>
            </div>

            {/* Recent Orders */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>Recent Orders</p>
                <Link
                  to="/my-orders"
                  className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors"
                  style={{ color: 'var(--text-4)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
                >
                  View All <FiChevronRight size={11} aria-hidden="true" />
                </Link>
              </div>
              {ordersLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : recentOrders.length === 0 ? (
                <div
                  className="py-16 text-center"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                >
                  <FiPackage size={28} className="mx-auto mb-3" style={{ color: 'var(--text-5)' }} aria-hidden="true" />
                  <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-4)' }}>No orders yet</p>
                  <Link
                    to="/shop"
                    className="inline-block px-6 py-3 font-bold uppercase tracking-widest text-[11px]"
                    style={{ background: 'var(--text)', color: '#fff', borderRadius: 'var(--radius-sm)' }}
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map(order => {
                    const expected = estimateExpectedDelivery(order);
                    return (
                      <div
                        key={order._id}
                        className="flex items-center gap-4"
                        style={{ padding: '14px 18px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', transition: 'border-color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                      >
                        <div
                          className="w-11 h-11 flex-shrink-0 overflow-hidden"
                          style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)' }}
                        >
                          {order.items?.[0]?.image && (
                            <img src={order.items[0].image} alt="" className="w-full h-full object-cover" loading="lazy" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>
                            {order.items?.[0]?.name}{order.items?.length > 1 ? ` +${order.items.length - 1} more` : ''}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-4)' }}>
                            #{order.orderNumber || order._id?.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right mr-2">
                          <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-numbers)', color: 'var(--text)' }}>
                            ₹{order.totalPrice?.toLocaleString('en-IN')}
                          </p>
                          <div className="mt-0.5"><OrderStatusBadge status={order.status} /></div>
                        </div>
                        <Link
                          to={`/order/${order._id}`}
                          style={{ color: 'var(--text-4)', flexShrink: 0 }}
                          aria-label={`View order ${order.orderNumber || order._id}`}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
                        >
                          <FiChevronRight size={16} aria-hidden="true" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notifications — architecture only, graceful empty state */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-4)' }}>Notifications</p>
              <div
                className="py-14 text-center"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
              >
                <FiBell size={26} className="mx-auto mb-3" style={{ color: 'var(--text-5)' }} aria-hidden="true" />
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>You're all caught up</p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--text-4)' }}>No new notifications</p>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ PROFILE */}
        {tab === 'Profile' && (
          <div className="max-w-lg">
            <h2 className="text-xl font-extrabold mb-8" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.025em' }}>
              Personal Information
            </h2>
            <form onSubmit={handleProfile} className="space-y-5">
              <div>
                <label style={labelStyle} htmlFor="pf-name">Full Name</label>
                <input
                  id="pf-name"
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  required
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--text)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="pf-email">Email Address</label>
                <input
                  id="pf-email"
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  style={{ ...inputStyle, background: 'var(--bg-2)', color: 'var(--text-4)', cursor: 'not-allowed' }}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-5)', marginTop: '5px' }}>Email cannot be changed.</p>
              </div>
              <div>
                <label style={labelStyle} htmlFor="pf-phone">Phone Number</label>
                <input
                  id="pf-phone"
                  type="tel"
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 XXXXX XXXXX"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--text)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
              <button type="submit" disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.5 : 1 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* ════════════════════════════════════════════ ADDRESSES */}
        {tab === 'Addresses' && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.025em' }}>
                Saved Addresses
              </h2>
              {!addForm && (
                <button
                  onClick={() => { setAddForm({ ...BLANK_ADDR }); setEditId(null); }}
                  className="flex items-center gap-2"
                  style={{ padding: '8px 14px', border: '1.5px solid var(--text)', color: 'var(--text)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--text)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}
                >
                  <FiPlus size={12} aria-hidden="true" /> Add Address
                </button>
              )}
            </div>

            {/* Add / Edit form */}
            {addForm && (
              <form
                onSubmit={handleSaveAddress}
                className="mb-6 space-y-4"
                style={{ padding: '24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
              >
                {/* Label chips */}
                <div>
                  <label style={labelStyle}>Address Type</label>
                  <div className="flex gap-2">
                    {ADDR_LABELS.map(l => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setAddForm(p => ({ ...p, label: l }))}
                        style={{
                          padding: '6px 14px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                          border: `1.5px solid ${addForm.label === l ? 'var(--text)' : 'var(--border)'}`,
                          background: addForm.label === l ? 'var(--text)' : 'transparent',
                          color: addForm.label === l ? '#fff' : 'var(--text-3)',
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Full Name', key: 'fullName', full: false, required: true },
                    { label: 'Phone',     key: 'phone',    full: false, required: true },
                    { label: 'Address Line 1', key: 'addressLine1', full: true,  required: true },
                    { label: 'Address Line 2', key: 'addressLine2', full: true,  required: false, placeholder: 'Optional' },
                    { label: 'City',    key: 'city',    full: false, required: true },
                    { label: 'State',   key: 'state',   full: false, required: true },
                    { label: 'Pincode', key: 'pincode', full: false, required: true },
                  ].map(({ label, key, full, required, placeholder }) => (
                    <div key={key} className={full ? 'col-span-2' : ''}>
                      <label style={labelStyle}>{label}</label>
                      <input
                        type="text"
                        value={addForm[key] || ''}
                        onChange={e => setAddForm(p => ({ ...p, [key]: e.target.value }))}
                        required={required}
                        placeholder={placeholder}
                        style={{ ...inputStyle, padding: '10px 12px', background: 'var(--bg)', fontSize: '13px' }}
                        onFocus={e => (e.target.style.borderColor = 'var(--text)')}
                        onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                      />
                    </div>
                  ))}
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addForm.isDefault}
                    onChange={e => setAddForm(p => ({ ...p, isDefault: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-3)' }}>Set as default address</span>
                </label>

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3"
                    style={{ ...primaryBtn, width: 'auto', flex: 1, fontSize: '10px', opacity: saving ? 0.5 : 1 }}
                  >
                    {saving ? 'Saving…' : editId ? 'Update Address' : 'Save Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddForm(null); setEditId(null); }}
                    style={{ padding: '12px 20px', border: '1px solid var(--border)', color: 'var(--text-3)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Address cards */}
            {user?.addresses?.length > 0 ? (
              <div className="space-y-3">
                {user.addresses.map(a => (
                  <div
                    key={a._id}
                    style={{ padding: '20px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', transition: 'border-color 0.2s' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {a.label && (
                            <span
                              style={{ padding: '2px 8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', background: 'var(--bg-2)', color: 'var(--text-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                            >
                              {a.label}
                            </span>
                          )}
                          <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{a.fullName}</p>
                          {a.isDefault && (
                            <span style={{ padding: '2px 8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', background: 'rgba(22,163,74,0.1)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 'var(--radius-sm)' }}>
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                          {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                          {a.city}, {a.state} — {a.pincode}
                        </p>
                        {a.phone && (
                          <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '4px' }}>📞 {a.phone}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => { setAddForm(a); setEditId(a._id); }}
                          aria-label={`Edit address for ${a.fullName}`}
                          className="w-8 h-8 flex items-center justify-center transition-colors"
                          style={{ color: 'var(--text-4)', borderRadius: 'var(--radius-sm)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
                        >
                          <FiEdit2 size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(confirmDeleteId === a._id ? null : a._id)}
                          aria-label={`Delete address for ${a.fullName}`}
                          className="w-8 h-8 flex items-center justify-center transition-colors"
                          style={{ color: 'var(--text-4)', borderRadius: 'var(--radius-sm)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#DC2626')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
                        >
                          <FiTrash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {/* Inline delete confirmation */}
                    {confirmDeleteId === a._id && (
                      <div
                        className="flex items-center justify-between gap-3 flex-wrap mt-4 pt-4"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>Remove this address?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            style={{ padding: '7px 14px', border: '1px solid var(--border)', color: 'var(--text-3)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                          >
                            Keep
                          </button>
                          <button
                            onClick={() => handleDeleteAddr(a._id)}
                            style={{ padding: '7px 14px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : !addForm && (
              <div
                className="py-20 text-center"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
              >
                <div
                  className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'var(--bg-2)', borderRadius: '50%' }}
                >
                  <FiMapPin size={22} style={{ color: 'var(--text-4)' }} aria-hidden="true" />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                  No saved addresses
                </h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-4)' }}>
                  Add an address to speed up checkout.
                </p>
                <button
                  onClick={() => setAddForm({ ...BLANK_ADDR })}
                  className="inline-flex items-center gap-2"
                  style={{ ...primaryBtn, width: 'auto', display: 'inline-flex', padding: '12px 24px' }}
                >
                  <FiPlus size={13} aria-hidden="true" /> Add Address
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════ SECURITY */}
        {tab === 'Security' && (
          <div className="max-w-md">
            <h2 className="text-xl font-extrabold mb-8" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.025em' }}>
              Change Password
            </h2>
            <form onSubmit={handlePassword} className="space-y-5">
              {[
                { label: 'Current Password', field: 'currentPassword', placeholder: 'Your current password' },
                { label: 'New Password',     field: 'newPassword',     placeholder: 'At least 6 characters'  },
                { label: 'Confirm Password', field: 'confirmNew',      placeholder: 'Repeat new password'    },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label style={labelStyle} htmlFor={`pwd-${field}`}>{label}</label>
                  <div className="relative">
                    <input
                      id={`pwd-${field}`}
                      type={showPwd[field] ? 'text' : 'password'}
                      value={pwd[field]}
                      onChange={e => setPwd(p => ({ ...p, [field]: e.target.value }))}
                      placeholder={placeholder}
                      required
                      style={{ ...inputStyle, paddingRight: '44px' }}
                      onFocus={e => (e.target.style.borderColor = 'var(--text)')}
                      onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(p => ({ ...p, [field]: !p[field] }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer' }}
                      aria-label={showPwd[field] ? 'Hide password' : 'Show password'}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
                    >
                      {showPwd[field] ? <FiEyeOff size={15} aria-hidden="true" /> : <FiEye size={15} aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              ))}
              <button type="submit" disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.5 : 1 }}>
                {saving ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {/* ════════════════════════════════════════════ SUPPORT */}
        {tab === 'Support' && (
          <div className="max-w-xl">
            <h2 className="text-xl font-extrabold mb-8" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.025em' }}>
              Customer Support
            </h2>

            {/* Contact options */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: FiPhone,   label: 'Call Us',     value: '1800-000-0000',   sub: 'Mon–Sat 9AM–9PM',       href: 'tel:+180000000000',            primary: true  },
                { icon: FiMail,    label: 'Email',        value: 'support@metro.in', sub: 'Reply within 24 hrs',   href: 'mailto:support@metro.in',      primary: false },
                { icon: FiGlobe,   label: 'WhatsApp',     value: 'Chat with us',    sub: 'Quick response',         href: 'https://wa.me/919999999999',   primary: false },
                { icon: FiPackage, label: 'My Orders',    value: 'Track & Manage',  sub: 'View all your orders',   href: '/my-orders',                   primary: false },
              ].map(({ icon: Icon, label, value, sub, href, primary }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  style={{
                    display: 'block', padding: '18px', textDecoration: 'none',
                    background: primary ? 'var(--text)' : 'var(--card)',
                    border: `1px solid ${primary ? 'var(--text)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)', transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => { if (!primary) e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                  onMouseLeave={e => { if (!primary) e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <Icon size={16} style={{ color: primary ? '#fff' : 'var(--text-3)', display: 'block', marginBottom: '10px' }} aria-hidden="true" />
                  <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: primary ? 'rgba(255,255,255,0.55)' : 'var(--text-4)', marginBottom: '3px' }}>
                    {label}
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: primary ? '#fff' : 'var(--text)' }}>{value}</p>
                  <p style={{ fontSize: '11px', color: primary ? 'rgba(255,255,255,0.4)' : 'var(--text-4)', marginTop: '2px' }}>{sub}</p>
                </a>
              ))}
            </div>

            {/* Support ticket */}
            <div style={{ padding: '24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <h3 className="font-bold text-base mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                Submit a Support Ticket
              </h3>
              <div className="space-y-4">
                <div>
                  <label style={labelStyle} htmlFor="tk-type">Issue Type</label>
                  <select
                    id="tk-type"
                    value={ticketType}
                    onChange={e => setTicketType(e.target.value)}
                    style={{ ...inputStyle, background: 'var(--bg)', cursor: 'pointer' }}
                  >
                    {['General', 'Order Issue', 'Return / Refund', 'Product Query', 'Payment Issue', 'Account Help'].map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle} htmlFor="tk-subject">Subject</label>
                  <input
                    id="tk-subject"
                    type="text"
                    value={ticketSubject}
                    onChange={e => setTicketSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    style={{ ...inputStyle, background: 'var(--bg)' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--text)')}
                    onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="tk-message">Message</label>
                  <textarea
                    id="tk-message"
                    value={ticketMessage}
                    onChange={e => setTicketMessage(e.target.value)}
                    placeholder="Describe your issue in detail…"
                    rows={4}
                    style={{ ...inputStyle, background: 'var(--bg)', resize: 'none' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--text)')}
                    onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
                <button onClick={handleTicketSubmit} style={primaryBtn}>
                  Submit Ticket
                </button>
                <p className="text-center text-[10px]" style={{ color: 'var(--text-5)' }}>
                  Ticket system integration coming soon — responses within 24 hours.
                </p>
              </div>
            </div>

            {/* FAQ link */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <span style={{ color: 'var(--text-4)', fontSize: '13px' }}>General question?</span>
              <Link
                to="/contact"
                style={{ color: 'var(--text)', fontWeight: 700, fontSize: '13px', textDecoration: 'underline' }}
              >
                Visit our FAQ →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

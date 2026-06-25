import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import useAdminSocket from '../../hooks/useAdminSocket';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  FiTrendingUp, FiShoppingBag, FiUsers, FiPackage, FiDollarSign,
  FiArrowUp, FiArrowDown, FiEye, FiChevronRight,
} from 'react-icons/fi';

const STATUS_COLORS = {
  Pending:    { bg: 'rgba(255,138,0,0.07)',  text: '#B45309', border: 'rgba(255,138,0,0.18)' },
  Processing: { bg: 'rgba(37,99,235,0.07)',  text: '#1D4ED8', border: 'rgba(37,99,235,0.18)' },
  Shipped:    { bg: 'rgba(109,40,217,0.07)', text: '#6D28D9', border: 'rgba(109,40,217,0.18)' },
  Delivered:  { bg: 'rgba(22,163,74,0.07)',  text: '#15803D', border: 'rgba(22,163,74,0.18)' },
  Cancelled:  { bg: 'rgba(239,68,68,0.07)',  text: '#DC2626', border: 'rgba(239,68,68,0.18)' },
};

export default function AdminDashboard() {
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  const refreshStats = () => {
    API.get('/admin/stats').then(r => setStats(r.data.stats)).catch(() => {});
    API.get('/admin/orders?limit=5').then(r => setRecentOrders(r.data.orders || [])).catch(() => {});
  };
  useAdminSocket({
    'order:created':       refreshStats,
    'order:statusChanged': refreshStats,
    'review:created':      refreshStats,
  });

  useEffect(() => {
    Promise.all([
      API.get('/admin/stats'),
      API.get('/admin/orders?limit=5&sort=-createdAt'),
    ])
      .then(([s, o]) => {
        setStats(s.data.stats || s.data);
        setRecentOrders(o.data.orders || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = stats ? [
    { label: 'Total Revenue',    value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, icon: FiDollarSign, change: '+12%', up: true,  accent: 'var(--accent)' },
    { label: 'Total Orders',     value: (stats.totalOrders || 0).toLocaleString(),               icon: FiShoppingBag, change: '+8%', up: true,  accent: '#2563EB' },
    { label: 'Total Products',   value: (stats.totalProducts || 0).toLocaleString(),             icon: FiPackage,    change: '+3',   up: true,  accent: '#16A34A' },
    { label: 'Total Customers',  value: (stats.totalUsers || 0).toLocaleString(),                icon: FiUsers,      change: '+24',  up: true,  accent: '#7C3AED' },
  ] : [];

  return (
    <AdminLayout>
      <div className="space-y-8">

        {/* ── Page header ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-extrabold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.025em' }}
            >
              Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
              Welcome back. Here's your store overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: 'rgba(22,163,74,0.07)', color: '#15803D', border: '1px solid rgba(22,163,74,0.18)', borderRadius: 'var(--radius-sm)' }}
            >
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
            <span className="text-[11px] font-medium hidden sm:block" style={{ color: 'var(--text-4)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* ── Stat cards ───────────────────────────────────────── */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-36 skeleton" style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--card)' }} />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CARDS.map(({ label, value, icon: Icon, change, up, accent }) => (
              <div
                key={label}
                className="p-6 transition-all duration-200"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="w-10 h-10 flex items-center justify-center"
                    style={{ background: `rgba(0,0,0,0.04)`, borderRadius: 'var(--radius-sm)' }}
                  >
                    <Icon size={18} strokeWidth={1.75} style={{ color: accent }} />
                  </div>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5"
                    style={{
                      color: up ? '#15803D' : '#DC2626',
                      background: up ? 'rgba(22,163,74,0.07)' : 'rgba(239,68,68,0.07)',
                      border: `1px solid ${up ? 'rgba(22,163,74,0.18)' : 'rgba(239,68,68,0.18)'}`,
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {up ? <FiArrowUp size={9} strokeWidth={2.5} /> : <FiArrowDown size={9} strokeWidth={2.5} />}
                    {change}
                  </span>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-4)' }}>
                  {label}
                </p>
                <p
                  className="font-bold text-2xl leading-none"
                  style={{ fontFamily: 'var(--font-numbers)', color: 'var(--text)', letterSpacing: '-0.03em' }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Quick links ──────────────────────────────────────── */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Manage Products',  path: '/admin/products', icon: FiPackage,     desc: 'Add, edit, and remove products' },
            { label: 'View All Orders',  path: '/admin/orders',   icon: FiShoppingBag, desc: 'Process and manage orders' },
            { label: 'Manage Customers', path: '/admin/users',    icon: FiUsers,       desc: 'View and manage customer accounts' },
          ].map(({ label, path, icon: Icon, desc }) => (
            <Link
              key={path}
              to={path}
              className="flex items-center gap-4 p-5 group transition-all duration-200"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div
                className="w-10 h-10 flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}
              >
                <Icon size={17} strokeWidth={1.75} style={{ color: 'var(--text)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{label}</p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-4)' }}>{desc}</p>
              </div>
              <FiChevronRight size={15} strokeWidth={2} style={{ color: 'var(--text-4)', flexShrink: 0 }} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>

        {/* ── Recent Orders ─────────────────────────────────────── */}
        <div
          className="overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
        >
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Recent Orders
            </h2>
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest transition-colors"
              style={{ color: 'var(--text-3)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
            >
              View All <FiChevronRight size={13} strokeWidth={2.5} />
            </Link>
          </div>

          {loading ? (
            <div className="p-6"><TableSkeleton rows={5} cols={5} /></div>
          ) : recentOrders.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      {['Order ID', 'Customer', 'Amount', 'Status', 'Date', ''].map((h, i) => (
                        <th
                          key={h || i}
                          className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: 'var(--text-4)', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => {
                      const sc = STATUS_COLORS[order.status] || STATUS_COLORS.Pending;
                      return (
                        <tr
                          key={order._id}
                          className="transition-colors"
                          style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td className="px-5 py-4 font-mono text-[12px] font-semibold" style={{ color: 'var(--text)' }}>
                            #{order.orderNumber || order._id?.slice(-6).toUpperCase()}
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>{order.user?.name || 'N/A'}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-4)' }}>{order.user?.email || ''}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-[13px]" style={{ fontFamily: 'var(--font-numbers)', color: 'var(--text)' }}>
                              ₹{order.totalPrice?.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className="inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                              style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 'var(--radius-sm)' }}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-[12px] font-medium" style={{ color: 'var(--text-3)' }}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              to="/admin/orders"
                              className="inline-flex p-2 transition-colors"
                              style={{ color: 'var(--text-4)', borderRadius: 'var(--radius-sm)' }}
                              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--bg-2)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'transparent'; }}
                            >
                              <FiEye size={15} strokeWidth={1.75} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="block lg:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
                {recentOrders.map(order => {
                  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.Pending;
                  return (
                    <div key={order._id} className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono font-bold text-[13px]" style={{ color: 'var(--text)' }}>#{order.orderNumber || order._id?.slice(-6).toUpperCase()}</p>
                          <p className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--text-4)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[13px]" style={{ fontFamily: 'var(--font-numbers)', color: 'var(--text)' }}>₹{order.totalPrice?.toLocaleString('en-IN')}</p>
                          <span
                            className="inline-flex mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                            style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 'var(--radius-sm)' }}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div
                        className="flex justify-between items-center p-3"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <div>
                          <p className="font-semibold text-[13px]" style={{ color: 'var(--text)' }}>{order.user?.name || 'N/A'}</p>
                          <p className="text-[11px]" style={{ color: 'var(--text-4)' }}>{order.user?.email || ''}</p>
                        </div>
                        <Link to="/admin/orders" className="p-2" style={{ color: 'var(--text-3)' }}>
                          <FiEye size={16} strokeWidth={1.75} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16" style={{ background: 'var(--bg)' }}>
              <FiShoppingBag size={36} className="mx-auto mb-4" style={{ color: 'var(--text-5)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>No orders yet.</p>
            </div>
          )}
        </div>

        {/* ── Sub stats ─────────────────────────────────────────── */}
        {stats && (
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Pending Orders',  value: stats.pendingOrders  || 0, color: 'var(--accent)' },
              { label: 'Delivered Today', value: stats.deliveredToday || 0, color: '#16A34A' },
              { label: 'Out of Stock',    value: stats.outOfStock     || 0, color: '#DC2626' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="p-6"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>{label}</p>
                <p
                  className="font-bold text-3xl leading-none"
                  style={{ fontFamily: 'var(--font-numbers)', color, letterSpacing: '-0.03em' }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

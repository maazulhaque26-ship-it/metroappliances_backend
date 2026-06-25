import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { agentLogout, clearAgentAuth } from '../../redux/slices/agentAuthSlice';

const NAV = [
  { label: 'Dashboard',     path: '/agent/dashboard', icon: '🏠' },
  { label: 'My Leads',      path: '/agent/leads',     icon: '🎯' },
  { label: 'My Dealers',    path: '/agent/dealers',   icon: '🏪' },
  { label: 'Visit Reports', path: '/agent/visits',    icon: '📍' },
  { label: 'Tasks',         path: '/agent/tasks',     icon: '✅' },
  { label: 'Profile',       path: '/agent/profile',   icon: '👤' },
];

const STATUS_COLORS = { active: '#10B981', inactive: '#9CA3AF', suspended: '#EF4444' };

export default function AgentLayout() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { agent } = useSelector(s => s.agentAuth);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(agentLogout());
    dispatch(clearAgentAuth());
    navigate('/agent/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const Sidebar = () => (
    <div style={{ width: '220px', minWidth: '220px', background: '#0C0C0C', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '0' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#FF7A00', marginBottom: '4px' }}>Metro Appliances</div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Sales Portal</div>
      </div>

      {/* Agent info */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{agent?.name || 'Agent'}</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '6px' }}>{agent?.agentCode}</div>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: STATUS_COLORS[agent?.status] + '22', color: STATUS_COLORS[agent?.status] || '#9CA3AF', textTransform: 'capitalize' }}>
          {agent?.status || 'active'}
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {NAV.map(({ label, path, icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px',
                borderRadius: '8px', marginBottom: '2px', textDecoration: 'none',
                background: active ? 'rgba(255,122,0,0.15)' : 'transparent',
                color: active ? '#FF7A00' : 'rgba(255,255,255,0.55)',
                fontSize: '13px', fontWeight: active ? 700 : 500, transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '15px' }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>
          <span>🚪</span> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex" style={{ display: 'flex' }}>
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div onClick={() => setMobileOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}><Sidebar /></div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Mobile header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#fff', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#374151' }}>☰</button>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>Sales Agent Portal</div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#9CA3AF' }}>{agent?.name}</div>
        </div>

        <div style={{ flex: 1, padding: '24px', maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

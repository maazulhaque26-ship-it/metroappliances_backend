import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiGrid, FiList, FiUser, FiLogOut, FiTool, FiMapPin } from 'react-icons/fi';
import { engineerLogout } from '../../redux/slices/engineerAuthSlice';

const NAV = [
  { to: '/engineer/dashboard', icon: <FiGrid size={18} />, label: 'Dashboard' },
  { to: '/engineer/jobs',      icon: <FiList size={18} />, label: 'My Jobs' },
  { to: '/engineer/route',     icon: <FiMapPin size={18} />, label: 'Route' },
  { to: '/engineer/profile',   icon: <FiUser size={18} />, label: 'Profile' },
];

export default function EngineerLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { engineer } = useSelector(s => s.engineerAuth);

  const handleLogout = async () => {
    await dispatch(engineerLogout());
    navigate('/engineer/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      <aside style={{ width: 220, background: '#064E3B', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#059669', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiTool size={16} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Engineer Portal</div>
              <div style={{ color: '#6EE7B7', fontSize: 11 }}>{engineer?.name || 'Engineer'}</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
                color: isActive ? '#fff' : '#A7F3D0', background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 600 : 400, marginBottom: 4,
              })}>
              {icon}{label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '0 12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 8, color: '#FCA5A5', fontSize: 13, cursor: 'pointer' }}>
            <FiLogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, background: '#F9FAFB', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

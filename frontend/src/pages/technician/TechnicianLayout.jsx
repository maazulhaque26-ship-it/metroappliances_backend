import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiGrid, FiBriefcase, FiUser, FiLogOut, FiTool, FiMapPin } from 'react-icons/fi';
import { technicianLogout } from '../../redux/slices/technicianAuthSlice';

const NAV = [
  { to: '/technician/dashboard', icon: <FiGrid size={18} />, label: 'Dashboard' },
  { to: '/technician/jobs', icon: <FiBriefcase size={18} />, label: 'My Jobs' },
  { to: '/technician/profile', icon: <FiUser size={18} />, label: 'Profile' },
];

export default function TechnicianLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { technician } = useSelector(s => s.technicianAuth);

  const handleLogout = async () => {
    await dispatch(technicianLogout());
    navigate('/technician/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#111827', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#3B82F6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiTool size={16} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Tech Portal</div>
              <div style={{ color: '#9CA3AF', fontSize: 11 }}>{technician?.name || 'Technician'}</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
                color: isActive ? '#fff' : '#9CA3AF', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
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

      {/* Main */}
      <main style={{ flex: 1, background: '#F9FAFB', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

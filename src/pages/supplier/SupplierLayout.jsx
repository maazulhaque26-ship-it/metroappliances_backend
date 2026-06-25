import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiGrid, FiShoppingBag, FiFileText, FiFile, FiBell, FiUser, FiLogOut } from 'react-icons/fi';
import { supplierLogout } from '../../redux/slices/supplierAuthSlice';

const NAV_ITEMS = [
  { to: '/supplier/dashboard',    icon: FiGrid,        label: 'Dashboard' },
  { to: '/supplier/orders',       icon: FiShoppingBag, label: 'Purchase Orders' },
  { to: '/supplier/rfq',          icon: FiFileText,    label: 'RFQs' },
  { to: '/supplier/invoices',     icon: FiFile,        label: 'Invoices' },
  { to: '/supplier/documents',    icon: FiFile,        label: 'Documents' },
  { to: '/supplier/notifications',icon: FiBell,        label: 'Notifications' },
  { to: '/supplier/profile',      icon: FiUser,        label: 'Profile' },
];

export default function SupplierLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { supplierUser } = useSelector(s => s.supplierAuth);

  const handleLogout = () => {
    dispatch(supplierLogout());
    navigate('/supplier/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {/* Brand */}
        <div className="px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FF7A00' }}>
              <span className="text-white font-black text-sm">S</span>
            </div>
            <div>
              <p className="text-sm font-black" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Supplier Portal</p>
              <p className="text-xs truncate max-w-28" style={{ color: 'var(--text-4)' }}>{supplierUser?.name}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'text-white' : 'hover:bg-opacity-50'}`
              }
              style={({ isActive }) => ({
                background: isActive ? '#FF7A00' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-4)',
              })}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          <button onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium"
            style={{ color: '#EF4444' }}>
            <FiLogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

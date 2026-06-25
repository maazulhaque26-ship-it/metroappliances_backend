import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { warehouseLogout } from '../../redux/slices/warehouseAuthSlice';
import {
  FiHome, FiPackage, FiFileText, FiRefreshCw,
  FiSliders, FiLogOut, FiMenu, FiX, FiUser,
  FiList, FiBox, FiTruck, FiRepeat, FiRadio,
  FiCamera, FiArrowUp, FiSearch, FiRotateCcw,
} from 'react-icons/fi';

const NAV_ITEMS = [
  { label: 'Dashboard',       path: '/warehouse/dashboard',         icon: FiHome },
  { label: 'Inventory',       path: '/warehouse/inventory',         icon: FiPackage },
  { label: 'Receive Stock',   path: '/warehouse/receive',           icon: FiFileText },
  { label: 'GRN Processing',  path: '/warehouse/grn',               icon: FiFileText },
  { label: 'Cycle Count',     path: '/warehouse/cycle-count',       icon: FiRefreshCw },
  { label: 'Adjustments',     path: '/warehouse/adjustments',       icon: FiSliders },
  // Sprint 10D: Logistics
  { label: 'Picking Lists',   path: '/warehouse/picking',           icon: FiList },
  { label: 'Packing',         path: '/warehouse/packing',           icon: FiBox },
  { label: 'Dispatch',        path: '/warehouse/dispatch',          icon: FiTruck },
  { label: 'Transfers',       path: '/warehouse/transfers',         icon: FiRefreshCw },
  { label: 'Shipment Track',  path: '/warehouse/shipment-tracking', icon: FiRadio },
  // Sprint 10E: Mobile operations
  { label: 'Mobile Dashboard', path: '/warehouse/mobile/dashboard', icon: FiHome },
  { label: 'Scanner',          path: '/warehouse/mobile/scan',      icon: FiCamera },
  { label: 'Smart Putaway',    path: '/warehouse/mobile/putaway',   icon: FiArrowUp },
  { label: 'Bin Lookup',       path: '/warehouse/mobile/bin-lookup',icon: FiSearch },
  { label: 'Returns',          path: '/warehouse/mobile/returns',   icon: FiRotateCcw },
];

const activeStyle = { color: '#FF7A00', background: 'rgba(255,122,0,0.1)', fontWeight: 700 };

export default function WarehouseLayout() {
  const dispatch          = useDispatch();
  const navigate          = useNavigate();
  const { warehouseUser } = useSelector(s => s.warehouseAuth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(warehouseLogout());
    navigate('/warehouse/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex`}
        style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#FF7A00' }}>
            <FiPackage size={18} color="#fff" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Warehouse</p>
            <p className="text-xs" style={{ color: 'var(--text-4)' }}>Portal</p>
          </div>
          <button className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
            <FiX size={18} style={{ color: 'var(--text-4)' }} />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                 style={{ background: '#FF7A00' }}>
              {warehouseUser?.name?.charAt(0)?.toUpperCase() || 'W'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{warehouseUser?.name || 'Warehouse Staff'}</p>
              <p className="text-xs capitalize truncate" style={{ color: 'var(--text-4)' }}>{warehouseUser?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={({ isActive }) => isActive ? activeStyle : { color: 'var(--text-4)' }}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm"
            style={{ color: 'var(--text-4)' }}
          >
            <FiLogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-5 py-3 border-b sticky top-0 z-20"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <FiMenu size={20} style={{ color: 'var(--text)' }} />
          </button>
          <h1 className="text-sm font-bold" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>
            Metro Appliances — Warehouse
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: '#FFF7ED', color: '#FF7A00' }}>
              {warehouseUser?.role?.replace(/_/g, ' ')}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

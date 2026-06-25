import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiFileText, FiRefreshCw, FiSliders, FiTrendingUp, FiAlertTriangle } from 'react-icons/fi';
import warehouseAPI from '../../services/warehouseAPI';

export default function WarehouseDashboard() {
  const navigate = useNavigate();
  const { warehouseUser } = useSelector(s => s.warehouseAuth);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const whId = warehouseUser?.warehouse;
    if (!whId) return;
    Promise.all([
      warehouseAPI.get('/admin/grn/stats', { params: { warehouseId: whId } }).catch(() => ({ data: { data: {} } })),
      warehouseAPI.get('/admin/inventory/dashboard', { params: { warehouseId: whId } }).catch(() => ({ data: { data: {} } })),
    ]).then(([grnR, invR]) => {
      setStats({ grn: grnR.data.data || {}, inv: invR.data.data || {} });
    }).finally(() => setLoading(false));
  }, [warehouseUser]);

  const quickLinks = [
    { label: 'Receive Stock',  path: '/warehouse/receive',     icon: FiFileText,  color: '#10B981' },
    { label: 'GRN Processing', path: '/warehouse/grn',         icon: FiPackage,   color: '#3B82F6' },
    { label: 'Inventory',      path: '/warehouse/inventory',   icon: FiTrendingUp,color: '#FF7A00' },
    { label: 'Cycle Count',    path: '/warehouse/cycle-count', icon: FiRefreshCw, color: '#8B5CF6' },
    { label: 'Adjustments',    path: '/warehouse/adjustments', icon: FiSliders,   color: '#F59E0B' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>
          Welcome, {warehouseUser?.name?.split(' ')[0] || 'Staff'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-4)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      {!loading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending GRNs',   value: stats.grn.byStatus?.pending || 0,    color: '#F59E0B' },
            { label: 'Total SKUs',     value: stats.inv.totalSKUs || 0,             color: '#FF7A00' },
            { label: 'Low Stock',      value: stats.inv.lowStock || 0,              color: '#EF4444' },
            { label: "Today's Moves",  value: stats.inv.todayTransactions || 0,     color: '#3B82F6' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Low stock alert */}
      {stats?.inv.lowStock > 0 && (
        <div className="rounded-xl p-4 flex items-center gap-3 border" style={{ borderColor: '#F59E0B', background: '#FFFBEB' }}>
          <FiAlertTriangle size={18} style={{ color: '#F59E0B' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
              {stats.inv.lowStock} item{stats.inv.lowStock > 1 ? 's' : ''} below reorder level
            </p>
            <p className="text-xs" style={{ color: '#92400E' }}>Check inventory for reorder</p>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div>
        <p className="text-sm font-bold mb-3" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickLinks.map(l => (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl text-center transition-all hover:opacity-80"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${l.color}20` }}>
                <l.icon size={20} style={{ color: l.color }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{l.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiMapPin, FiUsers, FiGrid, FiCheckSquare, FiAlertCircle, FiPlus } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import {
  MetricCard, SectionHeader, LoadingState, ErrorState, StatusBadge, Timeline, ChartCard,
} from '../../components/shared';
import api from '../../services/api';
import { toast } from 'react-toastify';

const ZONE_TYPE_COLORS = {
  receiving: '#3B82F6', storage: '#8B5CF6', picking: '#F59E0B', packing: '#10B981',
  returns: '#EF4444', damaged: '#F97316', dispatch: '#06B6D4', custom: '#6B7280',
};

export default function AdminWarehouseDashboard() {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/admin/warehouse/dashboard')
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><LoadingState rows={8} /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} onRetry={() => window.location.reload()} /></AdminLayout>;

  const { summary, warehouses = [], zoneTypeBreakdown = [] } = data || {};
  const capacityPct = summary?.capacityUsedPct ?? 0;

  const kpis = [
    { label: 'Total Warehouses',  value: summary?.total ?? 0,        icon: FiPackage,     color: '#FF7A00' },
    { label: 'Active Warehouses', value: summary?.active ?? 0,        icon: FiCheckSquare, color: '#10B981', change: summary?.maintenance > 0 ? `${summary.maintenance} in maintenance` : undefined },
    { label: 'Total Zones',       value: summary?.totalZones ?? 0,    icon: FiGrid,        color: '#8B5CF6' },
    { label: 'Storage Locations', value: summary?.totalLocations ?? 0, icon: FiMapPin,     color: '#3B82F6' },
    { label: 'Available Bins',    value: summary?.availableLocations ?? 0, icon: FiCheckSquare, color: '#10B981' },
    { label: 'Occupied Bins',     value: summary?.occupiedLocations ?? 0, icon: FiAlertCircle, color: '#EF4444' },
    { label: 'Warehouse Users',   value: summary?.totalUsers ?? 0,    icon: FiUsers,       color: '#6B7280' },
    { label: 'Active Users',      value: summary?.activeUsers ?? 0,   icon: FiUsers,       color: '#10B981' },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <SectionHeader
          title="Warehouse Dashboard"
          subtitle="Multi-warehouse overview — capacity, zones, locations"
          actions={
            <button
              onClick={() => navigate('/admin/warehouses')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg"
              style={{ background: '#FF7A00' }}
            >
              <FiPlus size={14} /> Manage Warehouses
            </button>
          }
        />

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(k => (
            <MetricCard key={k.label} label={k.label} value={k.value} icon={k.icon} accentColor={k.color} />
          ))}
        </div>

        {/* Capacity gauge */}
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Overall Capacity Utilisation</h3>
            <span className="text-sm font-bold" style={{ color: capacityPct >= 80 ? '#EF4444' : '#FF7A00' }}>
              {capacityPct}%
            </span>
          </div>
          <div className="h-3 rounded-full" style={{ background: 'var(--border)' }}>
            <div
              className="h-3 rounded-full transition-all"
              style={{
                width: `${Math.min(capacityPct, 100)}%`,
                background: capacityPct >= 80 ? '#EF4444' : capacityPct >= 60 ? '#F59E0B' : '#10B981',
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-4)' }}>
            {summary?.occupiedLocations ?? 0} occupied of {summary?.totalLocations ?? 0} total locations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Warehouses list */}
          <ChartCard title="Warehouses" subtitle="Status and capacity">
            {warehouses.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-4)' }}>No warehouses yet. <button onClick={() => navigate('/admin/warehouses')} className="underline" style={{ color: '#FF7A00' }}>Add one</button></p>
            ) : (
              <div className="space-y-3">
                {warehouses.slice(0, 6).map(wh => {
                  const pct = wh.totalCapacity > 0 ? Math.round((wh.usedCapacity / wh.totalCapacity) * 100) : 0;
                  return (
                    <div
                      key={wh._id}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:opacity-80 transition"
                      style={{ background: 'var(--bg-2)' }}
                      onClick={() => navigate(`/admin/warehouses/${wh._id}`)}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: '#FF7A00', color: '#fff' }}>
                        {wh.code.slice(0, 3)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{wh.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-4)' }}>{wh.city}, {wh.state}</p>
                      </div>
                      <StatusBadge status={wh.status} />
                    </div>
                  );
                })}
                {warehouses.length > 6 && (
                  <button onClick={() => navigate('/admin/warehouses')} className="w-full text-sm text-center py-2" style={{ color: '#FF7A00' }}>
                    View all {warehouses.length} warehouses →
                  </button>
                )}
              </div>
            )}
          </ChartCard>

          {/* Zone type breakdown */}
          <ChartCard title="Zone Type Breakdown" subtitle="Distribution across all warehouses">
            {zoneTypeBreakdown.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-4)' }}>No zones configured yet.</p>
            ) : (
              <div className="space-y-3">
                {zoneTypeBreakdown.map(z => (
                  <div key={z._id} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: ZONE_TYPE_COLORS[z._id] || '#6B7280' }} />
                    <span className="flex-1 text-sm capitalize" style={{ color: 'var(--text)' }}>{z._id}</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{z.count}</span>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'New Warehouse',   path: '/admin/warehouses',          icon: FiPackage },
              { label: 'Manage Zones',    path: '/admin/warehouse-zones',     icon: FiGrid },
              { label: 'Storage Bins',    path: '/admin/warehouse-locations', icon: FiMapPin },
              { label: 'Warehouse Users', path: '/admin/warehouse-users',     icon: FiUsers },
              { label: 'Settings',        path: '/admin/warehouse-settings',  icon: FiGrid },
            ].map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border hover:opacity-80 transition"
                style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg-2)' }}
              >
                <a.icon size={14} /> {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

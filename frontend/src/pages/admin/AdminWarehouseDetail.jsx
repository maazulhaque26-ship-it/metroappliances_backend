import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiGrid, FiMapPin, FiUsers, FiSettings } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import { SectionHeader, StatusBadge, LoadingState, ErrorState, MetricCard } from '../../components/shared';
import api from '../../services/api';
import { toast } from 'react-toastify';

const TABS = [
  { id: 'overview',   label: 'Overview',   icon: FiGrid },
  { id: 'zones',      label: 'Zones',      icon: FiGrid },
  { id: 'locations',  label: 'Locations',  icon: FiMapPin },
  { id: 'users',      label: 'Users',      icon: FiUsers },
];

const ZONE_TYPE_COLORS = {
  receiving: '#3B82F6', storage: '#8B5CF6', picking: '#F59E0B', packing: '#10B981',
  returns: '#EF4444', damaged: '#F97316', dispatch: '#06B6D4', custom: '#6B7280',
};

export default function AdminWarehouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data,       setData]       = useState(null);
  const [zones,      setZones]      = useState([]);
  const [locations,  setLocations]  = useState([]);
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [activeTab,  setActiveTab]  = useState('overview');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/admin/warehouses/${id}`),
      api.get('/admin/warehouse-zones',     { params: { warehouseId: id, limit: 100 } }),
      api.get('/admin/warehouse-locations', { params: { warehouseId: id, limit: 100 } }),
      api.get('/admin/warehouse-users',     { params: { warehouseId: id, limit: 100 } }),
    ])
      .then(([wh, z, l, u]) => {
        setData(wh.data.data);
        setZones(z.data.data || []);
        setLocations(l.data.data || []);
        setUsers(u.data.data || []);
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load warehouse'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AdminLayout><LoadingState rows={8} /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} onRetry={() => window.location.reload()} /></AdminLayout>;

  const { warehouse, totalLocations, activeUsers } = data || {};

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/warehouses')} className="p-2 rounded-lg hover:opacity-70" style={{ color: 'var(--text-4)' }}>
            <FiArrowLeft size={18} />
          </button>
          <SectionHeader
            title={warehouse?.name}
            subtitle={`${warehouse?.city}, ${warehouse?.state} · ${warehouse?.code}`}
            actions={
              <div className="flex gap-2">
                <StatusBadge status={warehouse?.status} />
                <button
                  onClick={() => navigate('/admin/warehouse-settings')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <FiSettings size={14} /> Settings
                </button>
              </div>
            }
          />
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Zones"     value={zones.length}          icon={FiGrid}    accentColor="#8B5CF6" />
          <MetricCard label="Total Locations" value={totalLocations}        icon={FiMapPin}  accentColor="#3B82F6" />
          <MetricCard label="Active Users"    value={activeUsers}           icon={FiUsers}   accentColor="#10B981" />
          <MetricCard label="Capacity Used"   value={`${warehouse?.usedCapacity ?? 0}/${warehouse?.totalCapacity ?? 0}`} icon={FiGrid} accentColor="#FF7A00" />
        </div>

        {/* Warehouse info card */}
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>Warehouse Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Address',  value: warehouse?.address },
              { label: 'City',     value: warehouse?.city },
              { label: 'State',    value: warehouse?.state },
              { label: 'Country',  value: warehouse?.country },
              { label: 'Pincode',  value: warehouse?.pincode || '—' },
              { label: 'GST',      value: warehouse?.gst || '—' },
              { label: 'Phone',    value: warehouse?.phone || '—' },
              { label: 'Email',    value: warehouse?.email || '—' },
              { label: 'Timezone', value: warehouse?.timezone },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-4)' }}>{f.label}</p>
                <p className="font-medium" style={{ color: 'var(--text)' }}>{f.value}</p>
              </div>
            ))}
            {warehouse?.notes && (
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-4)' }}>Notes</p>
                <p style={{ color: 'var(--text)' }}>{warehouse.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition"
              style={{
                borderColor: activeTab === t.id ? '#FF7A00' : 'transparent',
                color: activeTab === t.id ? '#FF7A00' : 'var(--text-4)',
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>Zones ({zones.length})</h4>
              {zones.length === 0 ? <p className="text-sm" style={{ color: 'var(--text-4)' }}>No zones. <button onClick={() => navigate('/admin/warehouse-zones')} className="underline" style={{ color: '#FF7A00' }}>Add zone</button></p> : (
                <div className="space-y-2">
                  {zones.slice(0, 5).map(z => (
                    <div key={z._id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: ZONE_TYPE_COLORS[z.type] || '#6B7280' }} />
                        <span className="text-sm" style={{ color: 'var(--text)' }}>{z.name}</span>
                        <span className="text-xs capitalize" style={{ color: 'var(--text-4)' }}>({z.type})</span>
                      </div>
                      <StatusBadge status={z.isActive ? 'active' : 'inactive'} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>Staff ({users.length})</h4>
              {users.length === 0 ? <p className="text-sm" style={{ color: 'var(--text-4)' }}>No users. <button onClick={() => navigate('/admin/warehouse-users')} className="underline" style={{ color: '#FF7A00' }}>Add user</button></p> : (
                <div className="space-y-2">
                  {users.slice(0, 5).map(u => (
                    <div key={u._id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: '#FF7A00', color: '#fff' }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{u.name}</p>
                        <p className="text-xs capitalize" style={{ color: 'var(--text-4)' }}>{u.role.replace('_', ' ')}</p>
                      </div>
                      <StatusBadge status={u.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Zones */}
        {activeTab === 'zones' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button onClick={() => navigate('/admin/warehouse-zones')} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#FF7A00' }}>
                Manage All Zones
              </button>
            </div>
            {zones.length === 0 ? (
              <p className="text-center py-12 text-sm" style={{ color: 'var(--text-4)' }}>No zones configured for this warehouse.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {zones.map(z => (
                  <div key={z._id} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: ZONE_TYPE_COLORS[z.type] || '#6B7280' }} />
                        <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{z.name}</span>
                        <span className="font-mono text-xs" style={{ color: 'var(--text-4)' }}>{z.code}</span>
                      </div>
                      <StatusBadge status={z.isActive ? 'active' : 'inactive'} />
                    </div>
                    <p className="text-xs capitalize" style={{ color: 'var(--text-4)' }}>Type: {z.type}</p>
                    {z.description && <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>{z.description}</p>}
                    <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Capacity: {z.capacity || '—'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Locations */}
        {activeTab === 'locations' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button onClick={() => navigate('/admin/warehouse-locations')} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#FF7A00' }}>
                Manage All Locations
              </button>
            </div>
            {locations.length === 0 ? (
              <p className="text-center py-12 text-sm" style={{ color: 'var(--text-4)' }}>No storage locations configured.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    {['Rack','Shelf','Bin','Zone','Capacity','Occupied','Status','Barcode'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-4)' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {locations.slice(0, 50).map(l => (
                      <tr key={l._id} className="border-b hover:opacity-80" style={{ borderColor: 'var(--border)' }}>
                        <td className="px-3 py-2 font-mono font-bold text-xs" style={{ color: '#FF7A00' }}>{l.rack}</td>
                        <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--text)' }}>{l.shelf}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-4)' }}>{l.bin || '—'}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: 'var(--text)' }}>{l.zone?.name || '—'}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: 'var(--text)' }}>{l.capacity}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: 'var(--text)' }}>{l.occupied}</td>
                        <td className="px-3 py-2"><StatusBadge status={l.status} /></td>
                        <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--text-4)' }}>{l.barcode || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {locations.length > 50 && <p className="text-xs text-center py-3" style={{ color: 'var(--text-4)' }}>Showing 50 of {locations.length}. <button onClick={() => navigate('/admin/warehouse-locations')} className="underline" style={{ color: '#FF7A00' }}>View all</button></p>}
              </div>
            )}
          </div>
        )}

        {/* Tab: Users */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button onClick={() => navigate('/admin/warehouse-users')} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#FF7A00' }}>
                Manage All Users
              </button>
            </div>
            {users.length === 0 ? (
              <p className="text-center py-12 text-sm" style={{ color: 'var(--text-4)' }}>No warehouse users configured.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map(u => (
                  <div key={u._id} className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: '#FF7A00', color: '#fff' }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{u.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-4)' }}>{u.email}</p>
                      <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--text-4)' }}>{u.role.replace(/_/g, ' ')}</p>
                    </div>
                    <StatusBadge status={u.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

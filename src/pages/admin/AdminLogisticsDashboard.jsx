import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTruck, FiPackage, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import api from '../../services/api';
import MetricCard   from '../../components/shared/MetricCard';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState  from '../../components/shared/LoadingState';
import StatusBadge   from '../../components/shared/StatusBadge';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';

export default function AdminLogisticsDashboard() {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/logistics/dashboard')
      .then(r => setData(r.data.data))
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState message="Loading logistics dashboard…" />;

  const { kpis = {}, recentDispatches = [], recentShipments = [], courierBreakdown = [] } = data || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Logistics Dashboard" subtitle="Dispatch, shipment, and transfer overview" />
        <button onClick={load} className="p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>
          <FiRefreshCw size={16} style={{ color: 'var(--text-4)' }} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Pending Dispatches" value={kpis.pendingDispatches || 0} icon={FiPackage} color="#FF7A00" />
        <MetricCard title="Today Dispatched"   value={kpis.todayDispatches || 0}  icon={FiTruck}   color="#3B82F6" />
        <MetricCard title="In Transit"          value={kpis.inTransit || 0}        icon={FiTruck}   color="#8B5CF6" />
        <MetricCard title="Delivered (Month)"   value={kpis.deliveredMonth || 0}   icon={FiCheckCircle} color="#10B981" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Delivered Today"    value={kpis.deliveredToday || 0}    icon={FiCheckCircle} color="#10B981" />
        <MetricCard title="Failed Deliveries"  value={kpis.failed || 0}            icon={FiAlertCircle} color="#EF4444" />
        <MetricCard title="Returns"            value={kpis.returns || 0}           icon={FiRefreshCw}   color="#F59E0B" />
        <MetricCard title="Avg Delivery (days)" value={kpis.avgDeliveryDays || 0}  icon={FiTruck}       color="#06B6D4" suffix=" days" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Courier Breakdown */}
        {courierBreakdown.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Courier Performance (This Month)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={courierBreakdown}>
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total"     name="Total"     fill="#3B82F6" radius={[4,4,0,0]} />
                <Bar dataKey="delivered" name="Delivered" fill="#10B981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pending Transfers */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Pending Transfers</h3>
            <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: '#FFF7ED', color: '#FF7A00' }}>{kpis.pendingTransfers || 0}</span>
          </div>
          <button onClick={() => navigate('/admin/logistics/transfers')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm"
            style={{ background: 'var(--bg-2)', color: 'var(--text)' }}>
            <span>View all transfers</span>
            <FiArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Dispatches */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Recent Dispatches</h3>
            <button onClick={() => navigate('/admin/logistics/dispatches')} className="text-xs font-semibold" style={{ color: '#FF7A00' }}>View all</button>
          </div>
          <div className="space-y-2">
            {recentDispatches.map(d => (
              <div key={d._id} onClick={() => navigate(`/admin/logistics/dispatches/${d._id}`)}
                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:opacity-80"
                style={{ background: 'var(--bg-2)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: '#FF7A00' }}>{d.dispatchNumber}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-4)' }}>{d.recipientName}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
            {recentDispatches.length === 0 && <p className="text-xs text-center py-4" style={{ color: 'var(--text-4)' }}>No dispatches yet</p>}
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Recent Shipments</h3>
            <button onClick={() => navigate('/admin/logistics/shipments')} className="text-xs font-semibold" style={{ color: '#FF7A00' }}>View all</button>
          </div>
          <div className="space-y-2">
            {recentShipments.map(s => (
              <div key={s._id} onClick={() => navigate(`/admin/logistics/shipments/${s._id}`)}
                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:opacity-80"
                style={{ background: 'var(--bg-2)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: '#FF7A00' }}>{s.shipmentNumber}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-4)' }}>{s.courierName || '—'} · {s.trackingNumber || '—'}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
            {recentShipments.length === 0 && <p className="text-xs text-center py-4" style={{ color: 'var(--text-4)' }}>No shipments yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

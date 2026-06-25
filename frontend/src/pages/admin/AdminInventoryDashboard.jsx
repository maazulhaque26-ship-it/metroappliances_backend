import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiAlertTriangle, FiXCircle, FiDollarSign, FiRefreshCw, FiTrendingUp, FiList, FiFileText, FiSliders } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import { MetricCard, SectionHeader, ChartCard, LoadingState, ErrorState } from '../../components/shared';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const formatINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function AdminInventoryDashboard() {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [wh,      setWh]      = useState('');
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    api.get('/admin/warehouses', { params: { limit: 100 } })
      .then(r => setWarehouses(r.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true); setError(null);
    api.get('/admin/inventory/dashboard', { params: wh ? { warehouseId: wh } : {} })
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [wh]);

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} onRetry={() => setLoading(true)} /></AdminLayout>;

  const metrics = [
    { label: 'Total SKUs',         value: data?.totalSKUs || 0,                       icon: FiPackage,       color: '#FF7A00' },
    { label: 'Out of Stock',       value: data?.outOfStock || 0,                       icon: FiXCircle,       color: '#EF4444' },
    { label: 'Low Stock',          value: data?.lowStock || 0,                         icon: FiAlertTriangle, color: '#F59E0B' },
    { label: 'Inventory Value',    value: formatINR(data?.totalInventoryValue),        icon: FiDollarSign,    color: '#10B981' },
    { label: 'Active Reservations',value: data?.activeReservations || 0,              icon: FiRefreshCw,     color: '#8B5CF6' },
    { label: "Today's Movements",  value: data?.todayTransactions || 0,               icon: FiTrendingUp,    color: '#3B82F6' },
  ];

  const trendData = (data?.movementTrend || []).map(d => ({ date: d._id?.slice(5), count: d.count }));

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <SectionHeader
          title="Inventory Dashboard"
          subtitle="Live stock overview across all warehouses"
          actions={
            <select
              value={wh}
              onChange={e => setWh(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
            >
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map(m => (
            <MetricCard key={m.label} label={m.label} value={m.value} icon={m.icon} accentColor={m.color} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Movement Trend (7 days)">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trendData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#FF7A00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-center py-12" style={{ color: 'var(--text-4)' }}>No movement data</p>
            )}
          </ChartCard>

          <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="font-bold text-sm" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Quick Actions</p>
            {[
              { label: 'View Inventory List',     path: '/admin/inventory/list',         icon: FiList },
              { label: 'New GRN',                 path: '/admin/inventory/grn',          icon: FiFileText },
              { label: 'Stock Adjustments',       path: '/admin/inventory/adjustments',  icon: FiSliders },
              { label: 'Cycle Count',             path: '/admin/inventory/cycle-count',  icon: FiRefreshCw },
              { label: 'Inventory Transactions',  path: '/admin/inventory/transactions', icon: FiTrendingUp },
            ].map(a => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-left transition-colors hover:opacity-80"
                style={{ background: 'var(--bg-2)', color: 'var(--text)' }}
              >
                <a.icon size={15} style={{ color: '#FF7A00' }} />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

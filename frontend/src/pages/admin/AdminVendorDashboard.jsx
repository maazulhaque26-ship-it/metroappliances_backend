import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiShoppingCart, FiFileText, FiAlertTriangle, FiTrendingUp, FiClock, FiCheckCircle, FiList } from 'react-icons/fi';
import api from '../../services/api';
import MetricCard   from '../../components/shared/MetricCard';
import SectionHeader from '../../components/shared/SectionHeader';
import ChartCard    from '../../components/shared/ChartCard';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const fmtCurrency = (v) => `₹${(v || 0).toLocaleString('en-IN')}`;

export default function AdminVendorDashboard() {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/admin/vendors/dashboard')
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading procurement dashboard…" />;
  if (error)   return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const { vendors, requisitions, rfqs, purchaseOrders, pendingApprovals, spend, topVendors, lateDeliveries, spendTrend } = data || {};

  const metrics = [
    { label: 'Total Vendors',    value: vendors?.total || 0,        icon: FiUsers,        color: '#3B82F6' },
    { label: 'Active Vendors',   value: vendors?.active || 0,       icon: FiCheckCircle,  color: '#10B981' },
    { label: 'Pending Approvals',value: pendingApprovals || 0,      icon: FiClock,        color: '#F59E0B', onClick: () => navigate('/admin/procurement/approvals') },
    { label: 'Open POs',         value: purchaseOrders?.open || 0,  icon: FiShoppingCart, color: '#8B5CF6', onClick: () => navigate('/admin/procurement/orders') },
    { label: 'Open RFQs',        value: rfqs?.open || 0,            icon: FiFileText,     color: '#06B6D4', onClick: () => navigate('/admin/procurement/rfq') },
    { label: 'Late Deliveries',  value: lateDeliveries || 0,        icon: FiAlertTriangle,color: '#EF4444' },
    { label: 'This Month Spend', value: fmtCurrency(spend?.thisMonth), icon: FiTrendingUp, color: '#FF7A00', isText: true },
    { label: 'Total Spend',      value: fmtCurrency(spend?.total),  icon: FiList,         color: '#6366F1', isText: true },
  ];

  const quickActions = [
    { label: 'Add Vendor',             path: '/admin/procurement/vendors/new',  color: '#3B82F6' },
    { label: 'New Purchase Requisition', path: '/admin/procurement/requisitions', color: '#10B981' },
    { label: 'Create RFQ',             path: '/admin/procurement/rfq',           color: '#8B5CF6' },
    { label: 'Create Purchase Order',  path: '/admin/procurement/orders',        color: '#FF7A00' },
    { label: 'Approval Queue',         path: '/admin/procurement/approvals',     color: '#F59E0B' },
    { label: 'Reports',                path: '/admin/procurement/reports',       color: '#06B6D4' },
  ];

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Procurement Dashboard" subtitle="Vendor management & purchase overview" />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <MetricCard key={i} label={m.label} value={m.value} icon={m.icon} color={m.color} onClick={m.onClick} />
        ))}
      </div>

      {/* Spend Trend */}
      <ChartCard title="Monthly Spend Trend">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={spendTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--text-4)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-4)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmtCurrency(v)} />
            <Bar dataKey="total" fill="#FF7A00" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Top Vendors by Spend</h3>
          <div className="space-y-2">
            {(topVendors || []).map((v, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{v.vendorName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>{v.count} orders</p>
                </div>
                <span className="text-sm font-bold" style={{ color: '#FF7A00' }}>{fmtCurrency(v.total)}</span>
              </div>
            ))}
            {!topVendors?.length && <p className="text-xs text-center py-4" style={{ color: 'var(--text-4)' }}>No completed orders yet</p>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => navigate(a.path)}
                className="px-3 py-3 rounded-xl text-xs font-semibold text-white text-left"
                style={{ background: a.color }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

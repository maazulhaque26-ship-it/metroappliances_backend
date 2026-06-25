import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiClock, FiCheckCircle, FiFileText } from 'react-icons/fi';
import supplierAPI from '../../services/supplierAPI';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';

const fmtDate     = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtCurrency = v => `₹${(v || 0).toLocaleString('en-IN')}`;

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supplierAPI.get('/supplier/dashboard')
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard…" />;

  const kpis = [
    { label: 'Open Orders',       value: data?.openOrders      ?? 0, icon: FiShoppingBag, color: '#FF7A00' },
    { label: 'Pending RFQs',      value: data?.pendingRFQs     ?? 0, icon: FiFileText,    color: '#3B82F6' },
    { label: 'Delivered (Month)', value: data?.deliveredMonth  ?? 0, icon: FiCheckCircle, color: '#10B981' },
    { label: 'Avg Lead Time',     value: data?.avgLeadTime ? `${data.avgLeadTime}d` : '—', icon: FiClock, color: '#8B5CF6' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-black" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Supplier Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-4)' }}>Welcome back, {data?.name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>{kpi.label}</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Recent Purchase Orders</h2>
        <div className="space-y-2">
          {(data?.recentOrders || []).length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-4)' }}>No orders yet</p>
          )}
          {(data?.recentOrders || []).map(po => (
            <div key={po._id}
              onClick={() => navigate(`/supplier/orders/${po._id}`)}
              className="flex items-center justify-between p-4 rounded-2xl cursor-pointer hover:shadow-md transition-shadow"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div>
                <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{po.poNumber}</span>
                <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text)' }}>{fmtCurrency(po.totalAmount)}</p>
                <p className="text-xs" style={{ color: 'var(--text-4)' }}>Expected: {fmtDate(po.expectedDeliveryDate)}</p>
              </div>
              <StatusBadge status={po.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import MetricCard from '../../components/shared/MetricCard';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiHash, FiCheckCircle, FiPrinter, FiZap, FiBarChart2, FiAlertCircle } from 'react-icons/fi';

export default function AdminBarcodeDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/barcodes/stats')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const FORMAT_COLORS = {
    EAN13:'#FF7A00', EAN8:'#6366F1', UPCA:'#10B981',
    CODE128:'#F59E0B', CODE39:'#3B82F6', QR:'#EC4899', INTERNAL:'#8B5CF6',
  };

  const quickActions = [
    { label: 'Generate Barcode',  path: '/admin/barcodes/generate', color: '#FF7A00', icon: FiHash },
    { label: 'Label Center',      path: '/admin/barcodes/labels',   color: '#6366F1', icon: FiPrinter },
    { label: 'Warehouse Map',     path: '/admin/warehouse-map',     color: '#10B981', icon: FiBarChart2 },
    { label: 'Scanner Activity',  path: '/admin/scanner-activity',  color: '#F59E0B', icon: FiZap },
    { label: 'Bin Management',    path: '/admin/bin-management',    color: '#3B82F6', icon: FiCheckCircle },
    { label: 'Automation',        path: '/admin/automation',        color: '#EC4899', icon: FiAlertCircle },
  ];

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1200px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Poppins', fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginBottom: '6px' }}>
            Barcode &amp; Scanning
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-4)' }}>
            Enterprise barcode engine — EAN-13, EAN-8, UPC-A, Code128, Code39, QR, Internal SKU
          </p>
        </div>

        {/* Metrics */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} style={{ height: '100px', background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard title="Total Barcodes"  value={stats?.total ?? 0}       icon={FiHash}         accent="#FF7A00" />
            <MetricCard title="Active"           value={stats?.activeCount ?? 0} icon={FiCheckCircle}  accent="#10B981" />
            <MetricCard title="Printed"          value={stats?.printed ?? 0}     icon={FiPrinter}      accent="#6366F1" />
            <MetricCard title="Formats"          value={stats?.byFormat?.length ?? 0} icon={FiBarChart2} accent="#F59E0B" />
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: '14px' }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map(a => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px 12px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <a.icon size={22} style={{ color: a.color, marginBottom: '10px' }} />
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{a.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* By Format */}
        {stats?.byFormat?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: '16px' }}>
                By Format
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.byFormat.map(f => (
                  <div key={f._id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, width: '70px', color: FORMAT_COLORS[f._id] || '#6B7280' }}>{f._id}</span>
                    <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (f.count / (stats.total || 1)) * 100)}%`, height: '100%', background: FORMAT_COLORS[f._id] || '#6B7280', borderRadius: '99px' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', width: '40px', textAlign: 'right' }}>{f.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: '16px' }}>
                By Entity Type
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(stats.byEntity || []).map(e => (
                  <div key={e._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-2)', textTransform: 'capitalize' }}>{e._id?.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{e.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

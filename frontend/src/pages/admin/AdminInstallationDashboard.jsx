import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTool, FiClock, FiCheckCircle, FiUser, FiAlertTriangle, FiCalendar, FiStar, FiXCircle, FiPackage, FiTrendingUp } from 'react-icons/fi';
import MetricCard from '../../components/shared/MetricCard';
import api from '../../services/api';

export default function AdminInstallationDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/installation/dashboard')
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Installation Management Dashboard</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/admin/installation/requests" style={{ padding: '9px 18px', background: '#FF7A00', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>All Requests</Link>
          <Link to="/admin/installation-engineers" style={{ padding: '9px 18px', background: '#111827', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Engineers</Link>
        </div>
      </div>

      {/* Row 1: Volume */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <MetricCard title="Total Requests"  value={stats?.total || 0}       icon={<FiTool />}        accent="#3B82F6" />
        <MetricCard title="Pending"         value={stats?.pending || 0}     icon={<FiClock />}       accent="#F59E0B" />
        <MetricCard title="Assigned"        value={stats?.assigned || 0}    icon={<FiUser />}        accent="#8B5CF6" />
        <MetricCard title="Completed"       value={stats?.completed || 0}   icon={<FiCheckCircle />} accent="#10B981" />
      </div>

      {/* Row 2: Operational */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <MetricCard title="In Progress"     value={stats?.inProgress || 0}  icon={<FiTool />}        accent="#0EA5E9" />
        <MetricCard title="Today Scheduled" value={stats?.todayScheduled || 0} icon={<FiCalendar />} accent="#F97316" />
        <MetricCard title="Cancelled"       value={stats?.cancelled || 0}   icon={<FiXCircle />}     accent="#EF4444" />
        <MetricCard title="Active Engineers" value={stats?.engineers || 0}  icon={<FiUser />}        accent="#6366F1" />
      </div>

      {/* Row 3: Quality */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
        <MetricCard title="CSAT Score"      value={`${stats?.csat || 0}/5`}     icon={<FiStar />}        accent="#F59E0B" />
        <MetricCard title="Success Rate"    value={`${stats?.successRate || 0}%`} icon={<FiTrendingUp />} accent="#10B981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Status Overview</h3>
          {[
            { label: 'Confirmed',    value: stats?.confirmed || 0,  color: '#10B981' },
            { label: 'Assigned',     value: stats?.assigned || 0,   color: '#3B82F6' },
            { label: 'In Progress',  value: stats?.inProgress || 0, color: '#F59E0B' },
            { label: 'Pending',      value: stats?.pending || 0,    color: '#6B7280' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: Math.min((value / (stats?.total || 1)) * 120, 120), height: 6, background: color, borderRadius: 3 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 24 }}>{value}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Quick Links</h3>
          {[
            { to: '/admin/installation/requests?status=pending',  label: 'Pending Approvals',   count: stats?.pending || 0,  color: '#F59E0B' },
            { to: '/admin/installation/requests?status=assigned', label: 'Today Scheduled',      count: stats?.todayScheduled || 0, color: '#3B82F6' },
            { to: '/admin/installation-engineers',                label: 'Engineer Management',  count: stats?.engineers || 0, color: '#059669' },
            { to: '/admin/product-registrations?status=pending',  label: 'Pending Registrations', count: null, color: '#8B5CF6' },
          ].map(({ to, label, count, color }) => (
            <Link key={to} to={to} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F3F4F6', textDecoration: 'none' }}>
              <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
              {count !== null && <span style={{ padding: '3px 10px', background: color + '20', color, borderRadius: 10, fontSize: 12, fontWeight: 700 }}>{count}</span>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

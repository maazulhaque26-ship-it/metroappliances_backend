import React, { useEffect, useState } from 'react';
import { FiTool, FiAlertTriangle, FiCheckCircle, FiClock, FiUser, FiTrendingUp } from 'react-icons/fi';
import MetricCard from '../../components/shared/MetricCard';
import api from '../../services/api';

export default function AdminServiceDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/service/dashboard'),
      api.get('/admin/service/requests?limit=10&status=open'),
      api.get('/admin/service/reports/ftfr'),
      api.get('/admin/service/reports/csat'),
    ]).then(([dash, req, ftfr, csat]) => {
      setStats({ ...dash.data, ftfr: ftfr.data, csat: csat.data });
      setRecent(req.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#111827' }}>After Sales Service Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <MetricCard title="Total Tickets" value={stats?.total || 0} icon={<FiTool />} accent="#3B82F6" />
        <MetricCard title="Open" value={stats?.open || 0} icon={<FiClock />} accent="#F59E0B" />
        <MetricCard title="In Progress" value={stats?.inProgress || 0} icon={<FiUser />} accent="#8B5CF6" />
        <MetricCard title="Completed" value={stats?.completed || 0} icon={<FiCheckCircle />} accent="#10B981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <MetricCard title="Escalated" value={stats?.escalated || 0} icon={<FiAlertTriangle />} accent="#EF4444" />
        <MetricCard title="Urgent" value={stats?.urgent || 0} icon={<FiAlertTriangle />} accent="#EF4444" />
        <MetricCard title="FTFR Rate" value={`${stats?.ftfr?.ftfrRate || 0}%`} icon={<FiTrendingUp />} accent="#10B981" />
        <MetricCard title="CSAT Score" value={`${stats?.csat?.avgRating || 0}/5`} icon={<FiTrendingUp />} accent="#F59E0B" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Today's Activity */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Today's Activity</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Raised Today', value: stats?.raisedToday || 0, color: '#3B82F6' },
              { label: 'Closed Today', value: stats?.closedToday || 0, color: '#10B981' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#F9FAFB', borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Open Tickets */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Recent Open Tickets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recent.slice(0, 5).map(sr => (
              <div key={sr._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{sr.ticketNumber}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{sr.category} · {sr.customer?.name}</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                  background: sr.priority === 'urgent' ? '#FEE2E2' : '#FEF3C7',
                  color: sr.priority === 'urgent' ? '#991B1B' : '#92400E',
                }}>
                  {sr.priority?.toUpperCase()}
                </span>
              </div>
            ))}
            {!recent.length && <div style={{ color: '#6B7280', fontSize: 13 }}>No open tickets</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

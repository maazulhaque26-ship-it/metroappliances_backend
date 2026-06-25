import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiTool, FiAlertTriangle, FiCheckCircle, FiClock, FiUser, FiTrendingUp,
  FiShield, FiRefreshCw, FiAlertCircle, FiStar, FiCalendar, FiXCircle,
} from 'react-icons/fi';
import MetricCard from '../../components/shared/MetricCard';
import StatusBadge from '../../components/shared/StatusBadge';
import api from '../../services/api';

export default function AdminServiceDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [ftfr, setFtfr] = useState(null);
  const [csat, setCsat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/service/dashboard'),
      api.get('/admin/service/requests?limit=10&status=open'),
      api.get('/admin/service/reports/ftfr').catch(() => ({ data: { ftfrRate: 0 } })),
      api.get('/admin/service/reports/csat').catch(() => ({ data: { avgRating: 0 } })),
    ]).then(([dash, req, ftfrRes, csatRes]) => {
      setStats(dash.data.data || dash.data);
      setRecent(req.data.data || []);
      setFtfr(ftfrRes.data.data || ftfrRes.data);
      setCsat(csatRes.data.data || csatRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>After Sales Service Dashboard</h1>
        <Link to="/admin/service/requests" style={{
          padding: '9px 18px', background: 'var(--accent, #FF7A00)', color: '#fff',
          borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700,
        }}>
          View All Tickets
        </Link>
      </div>

      {/* Row 1: Core Ticket Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <MetricCard title="Total Tickets" value={stats?.total || 0} icon={<FiTool />} accent="#3B82F6" />
        <MetricCard title="Open" value={stats?.open || 0} icon={<FiClock />} accent="#F59E0B" />
        <MetricCard title="In Progress" value={stats?.inProgress || 0} icon={<FiUser />} accent="#8B5CF6" />
        <MetricCard title="Completed" value={stats?.completed || 0} icon={<FiCheckCircle />} accent="#10B981" />
      </div>

      {/* Row 2: Service Quality Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <MetricCard title="Escalated" value={stats?.escalated || 0} icon={<FiAlertTriangle />} accent="#EF4444" />
        <MetricCard title="SLA Breached" value={stats?.slaBreached || 0} icon={<FiAlertCircle />} accent="#DC2626" />
        <MetricCard title="Under Warranty" value={stats?.underWarranty || 0} icon={<FiShield />} accent="#0EA5E9" />
        <MetricCard title="Under AMC" value={stats?.underAMC || 0} icon={<FiRefreshCw />} accent="#6366F1" />
      </div>

      {/* Row 3: Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <MetricCard title="FTFR Rate" value={`${ftfr?.ftfrRate || 0}%`} icon={<FiTrendingUp />} accent="#10B981" />
        <MetricCard title="CSAT Score" value={`${csat?.avgRating || 0}/5`} icon={<FiStar />} accent="#F59E0B" />
        <MetricCard title="AMC Renewals Due" value={stats?.amcRenewalDue || 0} icon={<FiCalendar />} accent="#F97316" />
        <MetricCard title="Cancelled" value={stats?.cancelled || 0} icon={<FiXCircle />} accent="#6B7280" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Today's Activity */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Today's Activity</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Raised Today', value: stats?.raisedToday || 0, color: '#3B82F6' },
              { label: 'Closed Today', value: stats?.closedToday || 0, color: '#10B981' },
              { label: 'Urgent Open', value: stats?.urgent || 0, color: '#EF4444' },
              { label: 'SLA Breached', value: stats?.slaBreached || 0, color: '#DC2626' },
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
            {recent.slice(0, 6).map(sr => (
              <Link key={sr._id} to={`/admin/service/requests/${sr._id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{sr.ticketNumber}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{sr.category} · {sr.customer?.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <StatusBadge status={sr.status} size="sm" />
                    <StatusBadge status={sr.priority} size="sm" />
                  </div>
                </div>
              </Link>
            ))}
            {!recent.length && <div style={{ color: '#6B7280', fontSize: 13 }}>No open tickets</div>}
          </div>
          <Link to="/admin/service/requests" style={{ display: 'block', marginTop: 14, fontSize: 12, color: '#3B82F6', textDecoration: 'none', textAlign: 'right' }}>
            View all →
          </Link>
        </div>
      </div>
    </div>
  );
}

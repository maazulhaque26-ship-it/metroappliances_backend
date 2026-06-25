import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiList, FiCheckCircle, FiClock, FiStar, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { fetchEngineerMe } from '../../redux/slices/engineerAuthSlice';
import StatusBadge from '../../components/shared/StatusBadge';
import engineerAPI from '../../services/engineerAPI';

export default function EngineerDashboard() {
  const dispatch = useDispatch();
  const { engineer } = useSelector(s => s.engineerAuth);
  const [dash, setDash]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    engineerAPI.get('/engineer/dashboard')
      .then(r => setDash(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      await engineerAPI.put('/engineer/auth/availability', { isAvailable: !engineer?.isAvailable });
      dispatch(fetchEngineerMe());
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>Loading...</div>;

  const stats = dash?.stats || {};
  const todayJobs = dash?.todayJobs || [];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Welcome, {engineer?.name || 'Engineer'}</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Installation Engineer Dashboard</p>
        </div>
        <button onClick={toggleAvailability} disabled={toggling}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: engineer?.isAvailable ? '#D1FAE5' : '#FEE2E2', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13, color: engineer?.isAvailable ? '#065F46' : '#991B1B' }}>
          {engineer?.isAvailable ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
          {engineer?.isAvailable ? 'Available' : 'Unavailable'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Active Jobs',    value: stats.active || 0,    icon: <FiList />,        color: '#3B82F6' },
          { label: "Today's Jobs",   value: stats.todayCount || 0, icon: <FiClock />,       color: '#F59E0B' },
          { label: 'Pending',        value: stats.pending || 0,   icon: <FiClock />,        color: '#8B5CF6' },
          { label: 'Total Completed',value: engineer?.totalInstallations || 0, icon: <FiCheckCircle />, color: '#10B981' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{label}</div>
              </div>
              <div style={{ color, opacity: 0.8, fontSize: 20 }}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Rating */}
      {engineer?.rating?.count > 0 && (
        <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '16px 20px', border: '1px solid #FDE68A', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiStar size={20} color="#F59E0B" />
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#92400E' }}>{engineer.rating.average}/5</span>
            <span style={{ fontSize: 13, color: '#92400E', marginLeft: 8 }}>Average Rating ({engineer.rating.count} reviews)</span>
          </div>
        </div>
      )}

      {/* Today's Jobs */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Today's Schedule</h3>
          <Link to="/engineer/jobs" style={{ fontSize: 12, color: '#059669', textDecoration: 'none', fontWeight: 600 }}>View All →</Link>
        </div>
        {todayJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#6B7280', fontSize: 13 }}>No jobs scheduled for today</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayJobs.map(job => (
              <Link key={job._id} to={`/engineer/jobs/${job._id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{job.requestNumber}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{job.productName} · {job.customer?.name}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{job.installationAddress?.city}</div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

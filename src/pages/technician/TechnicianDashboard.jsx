import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiBriefcase, FiCheckCircle, FiClock, FiStar } from 'react-icons/fi';
import MetricCard from '../../components/shared/MetricCard';
import StatusBadge from '../../components/shared/StatusBadge';
import technicianAPI from '../../services/technicianAPI';

export default function TechnicianDashboard() {
  const { technician } = useSelector(s => s.technicianAuth);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    technicianAPI.get('/technician/jobs?limit=5')
      .then(r => setJobs(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeJobs = jobs.filter(j => !['completed','closed','cancelled'].includes(j.status)).length;
  const completedJobs = jobs.filter(j => ['completed','closed'].includes(j.status)).length;

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: '#111827' }}>
        Welcome, {technician?.name}
      </h1>
      <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 28 }}>
        Employee ID: {technician?.employeeId} · Workload: {technician?.currentWorkload}/{technician?.maxWorkload}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <MetricCard title="Active Jobs" value={activeJobs} icon={<FiBriefcase />} accent="#3B82F6" />
        <MetricCard title="Completed" value={completedJobs} icon={<FiCheckCircle />} accent="#10B981" />
        <MetricCard title="Rating" value={`${technician?.rating?.average?.toFixed(1) || '0.0'}/5`} icon={<FiStar />} accent="#F59E0B" />
        <MetricCard title="Total Reviews" value={technician?.rating?.count || 0} icon={<FiStar />} accent="#8B5CF6" />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Recent Jobs</h3>
          <Link to="/technician/jobs" style={{ fontSize: 13, color: '#3B82F6', textDecoration: 'none' }}>View all →</Link>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading...</div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No jobs assigned yet</div>
        ) : (
          jobs.map(job => (
            <Link key={job._id} to={`/technician/jobs/${job._id}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{job.ticketNumber}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    {job.customer?.name} · {job.category}
                  </div>
                  {job.scheduledAt && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                      <FiClock size={10} style={{ marginRight: 3 }} />
                      {new Date(job.scheduledAt).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <StatusBadge status={job.status} />
                  <StatusBadge status={job.priority} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

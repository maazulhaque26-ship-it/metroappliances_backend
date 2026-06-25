import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiList, FiChevronRight } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import engineerAPI from '../../services/engineerAPI';

const STATUS_TABS = [
  { label: 'All',          value: '' },
  { label: 'Assigned',     value: 'assigned' },
  { label: 'Travelling',   value: 'travelling' },
  { label: 'In Progress',  value: 'in_progress' },
  { label: 'Completed',    value: 'completed' },
];

export default function EngineerInstallations() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTab)   params.set('status', activeTab);
    if (dateFilter)  params.set('date', dateFilter);
    engineerAPI.get(`/engineer/jobs?${params}`)
      .then(r => setJobs(r.data.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [activeTab, dateFilter]);

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <FiList size={20} color="#059669" />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>My Installation Jobs</h1>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {STATUS_TABS.map(t => (
            <button key={t.value} onClick={() => setActiveTab(t.value)}
              style={{ padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Poppins, sans-serif', background: activeTab === t.value ? '#059669' : '#F3F4F6', color: activeTab === t.value ? '#fff' : '#374151' }}>
              {t.label}
            </button>
          ))}
        </div>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          style={{ padding: '7px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif' }} />
        {dateFilter && <button onClick={() => setDateFilter('')} style={{ fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading...</div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6B7280' }}>
          <FiList size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p>No jobs found for selected filters</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {jobs.map(job => (
            <Link key={job._id} to={`/engineer/jobs/${job._id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{job.requestNumber}</span>
                    <StatusBadge status={job.status} />
                    {job.priority !== 'normal' && <StatusBadge status={job.priority} />}
                  </div>
                  <div style={{ fontSize: 13, color: '#374151' }}>{job.productName} · {job.category}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
                    {job.customer?.name} · {job.installationAddress?.city}
                    {job.scheduledAt && ` · ${new Date(job.scheduledAt).toLocaleDateString()}`}
                  </div>
                </div>
                <FiChevronRight color="#9CA3AF" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

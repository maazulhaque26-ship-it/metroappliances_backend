import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiMapPin, FiChevronRight } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import Pagination from '../../components/shared/Pagination';
import technicianAPI from '../../services/technicianAPI';
import { usePagination } from '../../hooks/usePagination';

const ACTIVE_STATUSES = ['assigned','accepted','travelling','reached','diagnosis','repair','testing','awaiting_confirmation'];
const DONE_STATUSES   = ['completed','closed'];

export default function TechnicianJobs() {
  const [tab, setTab] = useState('active');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { page, setPage, total, setTotal, limit } = usePagination();

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    const statuses = tab === 'active' ? ACTIVE_STATUSES : DONE_STATUSES;
    statuses.forEach(s => params.append('status', s));
    technicianAPI.get(`/technician/jobs?${params}`)
      .then(r => { setItems(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab, page, limit]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#111827' }}>My Jobs</h1>

      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #E5E7EB' }}>
        {[['active','Active'], ['done','Completed']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setPage(1); }}
            style={{ padding: '10px 20px', border: 'none', borderBottom: tab === key ? '2px solid #111827' : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === key ? 700 : 400, color: tab === key ? '#111827' : '#6B7280', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>No {tab === 'active' ? 'active' : 'completed'} jobs</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(job => (
            <Link key={job._id} to={`/technician/jobs/${job._id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{job.ticketNumber}</span>
                    <StatusBadge status={job.status} />
                    <StatusBadge status={job.priority} />
                    {job.isUnderWarranty && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#D1FAE5', color: '#065F46' }}>WARRANTY</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>{job.category} — {job.customer?.name}</div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {job.scheduledAt && (
                      <span style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiClock size={11} /> {new Date(job.scheduledAt).toLocaleString('en-IN')}
                      </span>
                    )}
                    {job.serviceAddress?.city && (
                      <span style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiMapPin size={11} /> {job.serviceAddress.city}
                      </span>
                    )}
                  </div>
                </div>
                <FiChevronRight size={18} color="#9CA3AF" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>
    </div>
  );
}

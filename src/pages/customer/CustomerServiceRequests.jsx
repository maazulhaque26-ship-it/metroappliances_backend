import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiTool, FiClock, FiSearch, FiChevronRight } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import Pagination from '../../components/shared/Pagination';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import api from '../../services/api';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'repair', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'closed', label: 'Closed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function CustomerServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const LIMIT = 10;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/service/requests?${params}`)
      .then(r => {
        setRequests(r.data.data || []);
        setTotal(r.data.pagination?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); }, [statusFilter]);
  useEffect(() => { load(); }, [page, statusFilter]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>My Service Requests</h1>
            <p style={{ fontSize: 14, color: 'var(--text-4)' }}>Track and manage all your complaints and service tickets</p>
          </div>
          <Link to="/my-service/raise" style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
            background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)',
            textDecoration: 'none', fontSize: 13, fontWeight: 700,
          }}>
            <FiPlus size={15} /> Raise Complaint
          </Link>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {STATUS_TABS.map(t => (
            <button key={t.key}
              onClick={() => setStatusFilter(t.key)}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: '1px solid var(--border)', cursor: 'pointer',
                background: statusFilter === t.key ? 'var(--accent)' : 'var(--card)',
                color: statusFilter === t.key ? '#fff' : 'var(--text)',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <LoadingState message="Loading your service requests..." />
        ) : !requests.length ? (
          <EmptyState
            icon={<FiTool size={40} />}
            title="No service requests yet"
            description="Raise a complaint to get started with your appliance service."
            action={<Link to="/my-service/raise" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>Raise your first complaint →</Link>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.map(sr => (
              <Link key={sr._id} to={`/my-service/track/${sr._id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '18px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{sr.ticketNumber}</span>
                      <StatusBadge status={sr.status} size="sm" />
                      <StatusBadge status={sr.priority} size="sm" />
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sr.productName || 'Product'} · {sr.category}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiClock size={11} />
                      {new Date(sr.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {sr.assignedTechnician && <span style={{ marginLeft: 8 }}>· Technician: {sr.assignedTechnician.name}</span>}
                    </div>
                  </div>
                  <FiChevronRight size={18} style={{ color: 'var(--text-4)', flexShrink: 0, marginLeft: 12 }} />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / LIMIT)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

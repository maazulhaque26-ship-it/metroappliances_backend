import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTool, FiStar, FiCalendar, FiChevronRight } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import Pagination from '../../components/shared/Pagination';
import api from '../../services/api';

function StarDisplay({ rating }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <FiStar key={i} size={12} style={{ fill: i <= rating ? '#F59E0B' : 'none', color: i <= rating ? '#F59E0B' : '#D1D5DB' }} />
      ))}
    </div>
  );
}

export default function CustomerServiceHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  useEffect(() => {
    setLoading(true);
    api.get(`/service/requests?status=closed&page=${page}&limit=${LIMIT}`)
      .then(r => {
        setHistory(r.data.data || []);
        setTotal(r.data.pagination?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Service History</h1>
          <p style={{ fontSize: 14, color: 'var(--text-4)' }}>All your completed and closed service requests.</p>
        </div>

        {loading ? (
          <LoadingState message="Loading service history..." />
        ) : !history.length ? (
          <EmptyState
            icon={<FiTool size={40} />}
            title="No service history yet"
            description="Your completed service requests will appear here."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.map(sr => (
              <Link key={sr._id} to={`/my-service/track/${sr._id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px 22px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{sr.ticketNumber}</span>
                      <StatusBadge status={sr.status} size="sm" />
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 6 }}>
                      {sr.productName || 'Product'} · {sr.category}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-4)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiCalendar size={11} />
                        Closed {sr.closedAt ? new Date(sr.closedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                      {sr.customerRating && <StarDisplay rating={sr.customerRating} />}
                      {!sr.customerRating && sr.status === 'closed' && (
                        <Link to={`/my-service/feedback/${sr._id}`} onClick={e => e.stopPropagation()}
                          style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiStar size={11} /> Rate
                        </Link>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 12 }}>
                    {sr.totalCharge > 0 && (
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                        ₹{sr.totalCharge.toLocaleString('en-IN')}
                      </div>
                    )}
                    {sr.isUnderWarranty && <div style={{ fontSize: 10, color: '#10B981', fontWeight: 700 }}>WARRANTY</div>}
                    <FiChevronRight size={16} style={{ color: 'var(--text-4)', marginTop: 4 }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {total > LIMIT && (
          <div className="mt-8">
            <Pagination currentPage={page} totalPages={Math.ceil(total / LIMIT)} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}

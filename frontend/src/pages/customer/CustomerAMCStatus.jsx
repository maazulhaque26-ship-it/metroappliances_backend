import React, { useEffect, useState } from 'react';
import { FiCalendar, FiCheckSquare, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import api from '../../services/api';

export default function CustomerAMCStatus() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/service/amc')
      .then(r => setContracts(r.data.data?.contracts || r.data.contracts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const daysLeft = (endDate) => {
    const diff = new Date(endDate) - new Date();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Annual Maintenance Contracts</h1>
          <p style={{ fontSize: 14, color: 'var(--text-4)' }}>Your AMC contracts and scheduled maintenance visits.</p>
        </div>

        {loading ? (
          <LoadingState message="Loading your AMC contracts..." />
        ) : !contracts.length ? (
          <EmptyState
            icon={<FiRefreshCw size={40} />}
            title="No AMC contracts"
            description="Your Annual Maintenance Contracts will appear here."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {contracts.map(c => (
              <div key={c._id} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 16, overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{c.contractNumber}</span>
                        <StatusBadge status={c.status} size="sm" />
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 4 }}>{c.productName || 'Product'}</div>
                      {c.serialNumber && <div style={{ fontSize: 12, color: 'var(--text-4)' }}>SN: {c.serialNumber}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>₹{c.amount?.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{c.durationMonths} months</div>
                    </div>
                  </div>

                  {/* Date Range + Days Left */}
                  <div style={{ display: 'flex', gap: 20, marginTop: 14, fontSize: 12, color: 'var(--text-4)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiCalendar size={12} />
                      {new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} —
                      {new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {c.status === 'active' && (
                      <span style={{
                        fontWeight: 700, color: daysLeft(c.endDate) < 30 ? '#F59E0B' : '#10B981',
                      }}>
                        {daysLeft(c.endDate)} days remaining
                      </span>
                    )}
                  </div>
                </div>

                {/* Visits */}
                <div style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Service Visits</span>
                    <span style={{ fontSize: 12, color: 'var(--text-4)' }}>
                      {c.completedVisits} / {c.totalVisits} completed
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 6, marginBottom: 14, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 6, background: '#10B981',
                      width: `${c.totalVisits > 0 ? (c.completedVisits / c.totalVisits) * 100 : 0}%`,
                    }} />
                  </div>
                  {c.visits?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {c.visits.map((v, i) => (
                        <div key={v._id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F9FAFB', borderRadius: 8, fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FiCheckSquare size={14} style={{ color: v.status === 'completed' ? '#10B981' : '#9CA3AF' }} />
                            <span style={{ color: 'var(--text)' }}>Visit {i + 1}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {v.scheduledAt && (
                              <span style={{ color: 'var(--text-4)' }}>
                                {new Date(v.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                            <StatusBadge status={v.status} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-4)', fontStyle: 'italic' }}>No visits scheduled yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

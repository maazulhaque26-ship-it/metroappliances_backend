import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { essGetPerformance } from '../../services/employeeSelfServiceAPI';

function ProgressBar({ value = 0, color = '#FF7A00' }) {
  return (
    <div style={{ background: '#F3F4F6', borderRadius: 6, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, value)}%`, background: color, height: '100%', borderRadius: 6, transition: 'width 0.4s' }} />
    </div>
  );
}

export default function ESSMyPerformance() {
  const navigate = useNavigate();
  const { token } = useSelector(s => s.employeeAuth);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!token) { navigate('/employee/login'); return; }
    essGetPerformance()
      .then(r => setData(r.data.data || r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load performance data'))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading...</div>;
  if (error)   return <div style={{ padding: 40, color: '#EF4444' }}>{error}</div>;

  const goals   = data?.goals   || [];
  const review  = data?.review  || null;
  const kpis    = data?.kpis    || [];

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>My Performance</h1>
      <p style={{ color: '#6B7280', marginBottom: 32 }}>Track your goals, KPIs, and current review status.</p>

      {review && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: 20, marginBottom: 32 }}>
          <p style={{ fontWeight: 600, color: '#92400E', margin: 0 }}>Active Review: {review.reviewCode}</p>
          <p style={{ color: '#78350F', margin: '4px 0 0', fontSize: 14 }}>Status: {review.status} | Type: {review.reviewType}</p>
          {review.selfScore != null && <p style={{ color: '#78350F', margin: '4px 0 0', fontSize: 14 }}>Self Score: {review.selfScore}</p>}
          {review.finalScore != null && <p style={{ color: '#78350F', margin: '4px 0 0', fontSize: 14 }}>Final Score: {review.finalScore} — Rating: {review.overallRating}</p>}
        </div>
      )}

      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}>My Goals ({goals.length})</h2>
      {goals.length === 0 ? (
        <p style={{ color: '#9CA3AF' }}>No active goals found.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
          {goals.map(g => (
            <div key={g._id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ fontWeight: 600, color: '#111827', margin: 0 }}>{g.title}</p>
                  <p style={{ color: '#6B7280', fontSize: 13, margin: '2px 0 0' }}>{g.goalCode} · {g.status}</p>
                </div>
                <span style={{
                  background: g.progress >= 100 ? '#D1FAE5' : '#FEF3C7',
                  color:      g.progress >= 100 ? '#065F46' : '#92400E',
                  padding: '2px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600
                }}>{g.progress ?? 0}%</span>
              </div>
              <ProgressBar value={g.progress ?? 0} color={g.progress >= 100 ? '#10B981' : '#FF7A00'} />
            </div>
          ))}
        </div>
      )}

      {kpis.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}>My KPIs</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
            {kpis.map(k => (
              <div key={k._id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
                <p style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: 14 }}>{k.name}</p>
                <p style={{ color: '#6B7280', fontSize: 12, margin: '4px 0 0' }}>Target: {k.targetValue} {k.unit}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { essGetTraining } from '../../services/employeeSelfServiceAPI';

const badgeStyle = (status) => {
  const map = {
    enrolled:  { bg: '#EFF6FF', color: '#1D4ED8' },
    completed: { bg: '#D1FAE5', color: '#065F46' },
    cancelled: { bg: '#FEE2E2', color: '#991B1B' },
  };
  return map[status] || { bg: '#F3F4F6', color: '#374151' };
};

export default function ESSMyTraining() {
  const navigate = useNavigate();
  const { token } = useSelector(s => s.employeeAuth);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!token) { navigate('/employee/login'); return; }
    essGetTraining()
      .then(r => setData(r.data.data || r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load training data'))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading...</div>;
  if (error)   return <div style={{ padding: 40, color: '#EF4444' }}>{error}</div>;

  const enrollments    = data?.enrollments    || [];
  const certifications = data?.certifications || [];

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>My Training</h1>
      <p style={{ color: '#6B7280', marginBottom: 32 }}>View your enrolled training sessions and completed certifications.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}>Enrolled Sessions ({enrollments.length})</h2>
      {enrollments.length === 0 ? (
        <p style={{ color: '#9CA3AF', marginBottom: 32 }}>No training enrollments found.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
          {enrollments.map(e => {
            const b = badgeStyle(e.status);
            return (
              <div key={e._id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#111827', margin: 0 }}>{e.session?.course?.title || 'Training Session'}</p>
                    <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>
                      {e.session?.sessionCode} · {e.session?.startDate ? new Date(e.session.startDate).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <span style={{ background: b.bg, color: b.color, padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                    {e.status}
                  </span>
                </div>
                {e.certificateIssued && (
                  <p style={{ color: '#059669', fontSize: 13, marginTop: 8, margin: '8px 0 0' }}>Certificate issued</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {certifications.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}>Certifications ({certifications.length})</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {certifications.map(c => (
              <div key={c._id} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: 16 }}>
                <p style={{ fontWeight: 600, color: '#14532D', margin: 0 }}>{c.course?.title || 'Certification'}</p>
                <p style={{ color: '#166534', fontSize: 13, margin: '4px 0 0' }}>
                  Issued: {c.issueDate ? new Date(c.issueDate).toLocaleDateString() : '—'}
                  {c.expiryDate ? ` · Expires: ${new Date(c.expiryDate).toLocaleDateString()}` : ''}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

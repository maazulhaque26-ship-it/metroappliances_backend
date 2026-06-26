import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { essGetRecognitions } from '../../services/employeeSelfServiceAPI';

const typeColors = {
  spot:         { bg: '#FEF3C7', color: '#92400E' },
  monthly:      { bg: '#EFF6FF', color: '#1D4ED8' },
  quarterly:    { bg: '#F0FDF4', color: '#14532D' },
  annual:       { bg: '#FAF5FF', color: '#6B21A8' },
  peer:         { bg: '#FFF7ED', color: '#9A3412' },
  innovation:   { bg: '#F0FDF4', color: '#064E3B' },
  customer:     { bg: '#EFF6FF', color: '#1E40AF' },
  leadership:   { bg: '#FDF2F8', color: '#831843' },
};

export default function ESSRecognition() {
  const navigate = useNavigate();
  const { token, employee } = useSelector(s => s.employeeAuth);
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!token) { navigate('/employee/login'); return; }
    essGetRecognitions()
      .then(r => setItems(r.data.data || r.data || []))
      .catch(e => setError(e.response?.data?.message || 'Failed to load recognitions'))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading...</div>;
  if (error)   return <div style={{ padding: 40, color: '#EF4444' }}>{error}</div>;

  const mine   = items.filter(i => i.toEmployee?._id === employee?._id || i.toEmployee === employee?._id);
  const public_ = items.filter(i => i.isPublic && i.toEmployee?._id !== employee?._id && i.toEmployee !== employee?._id);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Recognition</h1>
      <p style={{ color: '#6B7280', marginBottom: 32 }}>Your recognitions and recent public shoutouts.</p>

      {mine.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}>My Recognitions ({mine.length})</h2>
          <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
            {mine.map(r => {
              const tc = typeColors[r.type] || { bg: '#F3F4F6', color: '#374151' };
              return (
                <div key={r._id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <p style={{ fontWeight: 600, color: '#111827', margin: 0 }}>
                      From: {r.fromEmployee?.firstName || ''} {r.fromEmployee?.lastName || ''}
                    </p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {r.points > 0 && <span style={{ color: '#FF7A00', fontWeight: 700 }}>{r.points} pts</span>}
                      <span style={{ background: tc.bg, color: tc.color, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        {r.type}
                      </span>
                    </div>
                  </div>
                  {r.message && <p style={{ color: '#4B5563', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{r.message}</p>}
                  <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8, marginBottom: 0 }}>
                    {r.rcgCode} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {public_.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}>Recent Shoutouts</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {public_.slice(0, 10).map(r => {
              const tc = typeColors[r.type] || { bg: '#F3F4F6', color: '#374151' };
              return (
                <div key={r._id} style={{ background: '#FAFAFA', border: '1px solid #F3F4F6', borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#374151', fontSize: 14, margin: 0 }}>
                      <strong>{r.fromEmployee?.firstName}</strong> recognized <strong>{r.toEmployee?.firstName} {r.toEmployee?.lastName}</strong>
                    </p>
                    <span style={{ background: tc.bg, color: tc.color, padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {r.type}
                    </span>
                  </div>
                  {r.message && <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>{r.message}</p>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {mine.length === 0 && public_.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
          <p style={{ fontSize: 18, margin: 0 }}>No recognitions yet.</p>
        </div>
      )}
    </div>
  );
}

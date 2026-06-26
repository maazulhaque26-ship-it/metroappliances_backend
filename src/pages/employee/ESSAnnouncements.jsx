import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { essGetAnnouncements } from '../../services/employeeSelfServiceAPI';

const priorityStyle = (p) => {
  const map = {
    urgent: { bg: '#FEE2E2', color: '#991B1B', label: 'URGENT' },
    high:   { bg: '#FEF3C7', color: '#92400E', label: 'HIGH' },
    normal: { bg: '#EFF6FF', color: '#1D4ED8', label: 'NORMAL' },
    low:    { bg: '#F3F4F6', color: '#374151', label: 'LOW' },
  };
  return map[p] || map.normal;
};

export default function ESSAnnouncements() {
  const navigate = useNavigate();
  const { token } = useSelector(s => s.employeeAuth);
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!token) { navigate('/employee/login'); return; }
    essGetAnnouncements()
      .then(r => setItems(r.data.data || r.data || []))
      .catch(e => setError(e.response?.data?.message || 'Failed to load announcements'))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading...</div>;
  if (error)   return <div style={{ padding: 40, color: '#EF4444' }}>{error}</div>;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Announcements</h1>
      <p style={{ color: '#6B7280', marginBottom: 32 }}>Company-wide and department announcements.</p>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
          <p style={{ fontSize: 18, margin: 0 }}>No announcements at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {items.map(a => {
            const ps = priorityStyle(a.priority);
            return (
              <div key={a._id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h3 style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: 16 }}>{a.title}</h3>
                  <span style={{ background: ps.bg, color: ps.color, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>
                    {ps.label}
                  </span>
                </div>
                {a.content && <p style={{ color: '#4B5563', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{a.content}</p>}
                <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 12, marginBottom: 0 }}>
                  {a.annCode} · {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : ''}
                  {a.targetAudience && a.targetAudience !== 'all' && ` · ${a.targetAudience}`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

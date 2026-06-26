import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { essGetMyFeedback, essSubmitFeedback } from '../../services/employeeSelfServiceAPI';

export default function ESSFeedback() {
  const navigate = useNavigate();
  const { token } = useSelector(s => s.employeeAuth);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState('');
  const [form, setForm]           = useState({ toEmployeeId: '', message: '', isAnonymous: false });

  const load = () => {
    setLoading(true);
    essGetMyFeedback()
      .then(r => setFeedbacks(r.data.data || r.data || []))
      .catch(e => setError(e.response?.data?.message || 'Failed to load feedback'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) { navigate('/employee/login'); return; }
    load();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    setSubmitting(true);
    try {
      await essSubmitFeedback(form);
      setToast('Feedback submitted successfully!');
      setForm({ toEmployeeId: '', message: '', isAnonymous: false });
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to submit feedback');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Feedback</h1>
      <p style={{ color: '#6B7280', marginBottom: 32 }}>Send feedback to colleagues and view feedback received.</p>

      {toast && (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '12px 20px', borderRadius: 8, marginBottom: 24, fontWeight: 500 }}>
          {toast}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}>Send Feedback</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Recipient Employee ID
            </label>
            <input
              type="text"
              value={form.toEmployeeId}
              onChange={e => setForm(f => ({ ...f, toEmployeeId: e.target.value }))}
              placeholder="Enter employee ID"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Message
            </label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Write your feedback..."
              rows={4}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <input
              type="checkbox"
              id="anon"
              checked={form.isAnonymous}
              onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
            />
            <label htmlFor="anon" style={{ fontSize: 14, color: '#4B5563' }}>Send anonymously</label>
          </div>
          <button
            type="submit"
            disabled={submitting || !form.message.trim()}
            style={{ background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Sending...' : 'Send Feedback'}
          </button>
        </form>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}>Received Feedback ({feedbacks.length})</h2>
      {loading ? (
        <p style={{ color: '#6B7280' }}>Loading...</p>
      ) : error ? (
        <p style={{ color: '#EF4444' }}>{error}</p>
      ) : feedbacks.length === 0 ? (
        <p style={{ color: '#9CA3AF' }}>No feedback received yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {feedbacks.map(f => (
            <div key={f._id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 16 }}>
              <p style={{ color: '#374151', fontWeight: 500, margin: 0 }}>
                {f.isAnonymous ? 'Anonymous' : `${f.fromEmployee?.firstName || ''} ${f.fromEmployee?.lastName || ''}`}
              </p>
              <p style={{ color: '#4B5563', fontSize: 14, margin: '6px 0 0', lineHeight: 1.6 }}>{f.message}</p>
              <p style={{ color: '#9CA3AF', fontSize: 12, margin: '6px 0 0' }}>
                {f.fbkCode} · {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

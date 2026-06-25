import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiStar, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';

function StarPicker({ rating, setRating }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(s => (
        <FiStar key={s} size={28} style={{ cursor: 'pointer' }}
          fill={(hover || rating) >= s ? '#F59E0B' : 'none'}
          color={(hover || rating) >= s ? '#F59E0B' : '#D1D5DB'}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => setRating(s)} />
      ))}
    </div>
  );
}

export default function CustomerInstallationFeedback() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ir, setIr]         = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    api.get(`/installation/requests/${id}`)
      .then(r => setIr(r.data.data))
      .catch(() => setError('Not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Please select a rating');
    setSubmitting(true);
    try {
      await api.post(`/installation/requests/${id}/feedback`, { rating, feedback });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>Loading...</div>;

  if (done) return (
    <div style={{ padding: '48px 32px', textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>
      <FiCheckCircle size={56} color="#10B981" />
      <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 16 }}>Thank You!</h2>
      <p style={{ color: '#6B7280', marginTop: 8 }}>Your feedback helps us improve our installation service.</p>
      <button onClick={() => navigate(`/my-installations/${id}`)} style={{ marginTop: 24, padding: '10px 24px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>View Installation</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 20px', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Rate Your Installation</h1>
      {ir && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>{ir.requestNumber} · {ir.productName}</p>}

      {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Overall Rating <span style={{ color: '#EF4444' }}>*</span></label>
          <StarPicker rating={rating} setRating={setRating} />
          {rating > 0 && (
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Comments (Optional)</label>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4}
            placeholder="Tell us about your installation experience..."
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box', resize: 'vertical' }} />
        </div>

        <button type="submit" disabled={submitting || !rating} style={{ padding: '13px 0', background: !rating || submitting ? '#9CA3AF' : '#FF7A00', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: !rating || submitting ? 'not-allowed' : 'pointer', fontFamily: 'Poppins, sans-serif' }}>
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}

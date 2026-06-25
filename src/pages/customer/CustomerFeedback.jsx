import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiStar, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import LoadingState from '../../components/shared/LoadingState';
import api from '../../services/api';

const CATEGORIES_FEEDBACK = [
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'technical_skill', label: 'Technical Skill' },
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'communication', label: 'Communication' },
];

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
          <FiStar size={32}
            style={{
              fill: i <= (hovered || value) ? '#F59E0B' : 'none',
              color: i <= (hovered || value) ? '#F59E0B' : '#D1D5DB',
              transition: 'all 0.15s',
            }}
          />
        </button>
      ))}
    </div>
  );
}

const NPS_LABELS = { 0: 'Not at all', 5: 'Neutral', 10: 'Absolutely' };

export default function CustomerFeedback() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sr, setSR] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState({ punctuality: 0, technical_skill: 0, cleanliness: 0, communication: 0 });
  const [nps, setNps] = useState(8);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/service/requests/${id}`)
      .then(r => {
        const req = r.data.data?.serviceRequest || r.data.serviceRequest;
        setSR(req);
        if (req?.customerRating) {
          setRating(req.customerRating);
          setFeedback(req.customerFeedback || '');
          setDone(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!rating) { setError('Please select a star rating.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/service/requests/${id}/feedback`, {
        rating,
        feedback: feedback.trim() || undefined,
        categoryRatings,
        nps,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading..." />;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}>
          <FiArrowLeft size={14} /> Back
        </button>

        {done ? (
          <div style={{ background: 'var(--card)', border: '1px solid #BBF7D0', borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <FiCheckCircle size={48} style={{ color: '#10B981', marginBottom: 16 }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Thank you for your feedback!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-4)', marginBottom: 24 }}>Your rating has been submitted. We appreciate your time.</p>
            <button onClick={() => navigate('/my-service')} style={{
              padding: '12px 28px', background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              View All Requests
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Rate Your Service</h1>
              {sr && <p style={{ fontSize: 14, color: 'var(--text-4)' }}>Ticket {sr.ticketNumber} · {sr.category}</p>}
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#B91C1C', marginBottom: 20 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Overall Rating */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, textAlign: 'center' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Overall Service Rating</h3>
                <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 20 }}>How satisfied were you with the service?</p>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <StarPicker value={rating} onChange={setRating} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: rating >= 4 ? '#10B981' : rating >= 3 ? '#F59E0B' : rating > 0 ? '#EF4444' : 'var(--text-4)' }}>
                  {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : rating === 1 ? 'Very Poor' : 'Select rating'}
                </div>
              </div>

              {/* Category Ratings */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 18 }}>Detailed Ratings</h3>
                {CATEGORIES_FEEDBACK.map(cat => (
                  <div key={cat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{cat.label}</span>
                    <StarPicker value={categoryRatings[cat.key]} onChange={v => setCategoryRatings(r => ({ ...r, [cat.key]: v }))} />
                  </div>
                ))}
              </div>

              {/* NPS Score */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Recommendation Score</h3>
                <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 16 }}>How likely are you to recommend Metro Appliances service? (0–10)</p>
                <input type="range" min={0} max={10} value={nps} onChange={e => setNps(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-4)', marginTop: 6 }}>
                  <span>0 — Not at all</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{nps}</span>
                  <span>10 — Absolutely</span>
                </div>
              </div>

              {/* Comments */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Comments <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-4)' }}>optional</span></h3>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Share your experience or suggestions..."
                  style={{
                    width: '100%', height: 100, padding: '12px 14px', borderRadius: 10, fontSize: 14,
                    border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
                    outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
              </div>

              <button type="submit" disabled={submitting} style={{
                padding: '15px', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
              }}>
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

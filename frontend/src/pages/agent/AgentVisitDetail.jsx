import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import agentAPI from '../../services/agentAPI';

const STATUS_COLORS = { planned: '#9CA3AF', checked_in: '#3B82F6', completed: '#10B981', cancelled: '#EF4444' };
const OUTCOME_LABELS = { positive: 'Positive', neutral: 'Neutral', negative: 'Negative', no_contact: 'No Contact' };

export default function AgentVisitDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [visit,    setVisit]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [checkout, setCheckout] = useState({ outcome: 'neutral', outcomeNotes: '', nextVisitDate: '', visitNotes: '' });
  const [showCheckout, setShowCheckout] = useState(false);

  const fetchVisit = () => {
    agentAPI.get(`/agent/visits/${id}`).then(r => { setVisit(r.data.visit); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(fetchVisit, [id]);

  const handleCheckIn = async () => {
    setSaving(true);
    try {
      await agentAPI.post(`/agent/visits/${id}/checkin`, {});
      fetchVisit();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleCheckOut = async () => {
    setSaving(true);
    try {
      await agentAPI.post(`/agent/visits/${id}/checkout`, checkout);
      setShowCheckout(false);
      fetchVisit();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>Loading...</div>;
  if (!visit) return <div style={{ textAlign: 'center', padding: '60px', color: '#EF4444' }}>Visit not found</div>;

  const statusColor = STATUS_COLORS[visit.status] || '#9CA3AF';

  return (
    <div>
      <button onClick={() => navigate('/agent/visits')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '13px', padding: 0, marginBottom: '16px' }}>&larr; Back to Visits</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#111', margin: 0 }}>{visit.dealer?.businessName}</h1>
        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#FF7A00', fontWeight: 700 }}>{visit.visitNumber}</span>
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', background: statusColor + '1A', color: statusColor, textTransform: 'capitalize' }}>{visit.status?.replace(/_/g, ' ')}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {visit.status === 'planned' && (
            <button onClick={handleCheckIn} disabled={saving} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#3B82F6', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              {saving ? '...' : 'Check In Now'}
            </button>
          )}
          {visit.status === 'checked_in' && (
            <button onClick={() => setShowCheckout(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              Check Out
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Visit Details */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Visit Details</div>
          {[
            ['Dealer', visit.dealer?.businessName],
            ['Dealer Code', visit.dealer?.dealerCode],
            ['City', visit.dealer?.city],
            ['Purpose', visit.purpose?.replace(/_/g, ' ')],
            ['Notes', visit.visitNotes],
            ['Person Met', visit.personMet],
            ['Est. Order Value', visit.estimatedOrderValue ? `₹${visit.estimatedOrderValue.toLocaleString('en-IN')}` : null],
            ['Next Visit', visit.nextVisitDate ? new Date(visit.nextVisitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null],
            ['Next Visit Purpose', visit.nextVisitPurpose],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: '#9CA3AF', minWidth: '120px', flexShrink: 0 }}>{label}</span>
              <span style={{ color: '#111', fontWeight: 500, textTransform: 'capitalize' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Time & Outcome */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Timing & Outcome</div>
          {[
            ['Check In', visit.checkInTime ? new Date(visit.checkInTime).toLocaleString('en-IN') : null],
            ['Check Out', visit.checkOutTime ? new Date(visit.checkOutTime).toLocaleString('en-IN') : null],
            ['Duration', visit.durationMinutes ? `${visit.durationMinutes} minutes` : null],
            ['Outcome', visit.outcome ? OUTCOME_LABELS[visit.outcome] : null],
            ['Outcome Notes', visit.outcomeNotes],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: '#9CA3AF', minWidth: '120px', flexShrink: 0 }}>{label}</span>
              <span style={{ color: '#111', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#111' }}>Check Out</div>
              <button onClick={() => setShowCheckout(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Outcome</label>
                <select value={checkout.outcome} onChange={e => setCheckout(c => ({ ...c, outcome: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                  {Object.entries(OUTCOME_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Visit Notes</label>
                <textarea value={checkout.visitNotes} onChange={e => setCheckout(c => ({ ...c, visitNotes: e.target.value }))} rows={2}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Outcome Notes</label>
                <textarea value={checkout.outcomeNotes} onChange={e => setCheckout(c => ({ ...c, outcomeNotes: e.target.value }))} rows={2}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Next Visit Date</label>
                <input type="date" value={checkout.nextVisitDate} onChange={e => setCheckout(c => ({ ...c, nextVisitDate: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handleCheckOut} disabled={saving}
                style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Checking out...' : 'Confirm Check Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

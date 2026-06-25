import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import agentAPI from '../../services/agentAPI';

const STAGE_COLORS = { prospect: '#9CA3AF', qualified: '#3B82F6', proposal: '#F59E0B', negotiation: '#8B5CF6', won: '#10B981', lost: '#EF4444' };
const STAGES = ['prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const PRIORITY_COLORS = { low: '#9CA3AF', medium: '#3B82F6', high: '#F59E0B', urgent: '#EF4444' };

export default function AgentLeadDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [lead,      setLead]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [noteText,  setNoteText]  = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [stageNote, setStageNote] = useState('');
  const [showStageModal, setShowStageModal] = useState(false);
  const [newStage,  setNewStage]  = useState('');
  const [saving,    setSaving]    = useState(false);

  const fetchLead = () => {
    agentAPI.get(`/agent/leads/${id}`).then(r => { setLead(r.data.lead); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(fetchLead, [id]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await agentAPI.post(`/agent/leads/${id}/notes`, { text: noteText });
      setNoteText('');
      fetchLead();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setAddingNote(false); }
  };

  const handleStageChange = async () => {
    if (!newStage) return;
    setSaving(true);
    try {
      await agentAPI.post(`/agent/leads/${id}/stage`, { stage: newStage, note: stageNote });
      setShowStageModal(false);
      setStageNote('');
      fetchLead();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>Loading...</div>;
  if (!lead) return <div style={{ textAlign: 'center', padding: '60px', color: '#EF4444' }}>Lead not found</div>;

  const stageColor = STAGE_COLORS[lead.stage] || '#9CA3AF';

  return (
    <div>
      {/* Back + Header */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/agent/leads')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '13px', padding: 0, marginBottom: '8px' }}>&larr; Back to Leads</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#111', margin: 0 }}>{lead.businessName}</h1>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#FF7A00', fontWeight: 700 }}>{lead.leadNumber}</span>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', background: stageColor + '1A', color: stageColor, textTransform: 'capitalize' }}>{lead.stage}</span>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', background: (PRIORITY_COLORS[lead.priority] || '#9CA3AF') + '1A', color: PRIORITY_COLORS[lead.priority] || '#9CA3AF', textTransform: 'capitalize' }}>{lead.priority}</span>
          <button onClick={() => { setNewStage(lead.stage); setShowStageModal(true); }}
            style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#374151', marginLeft: 'auto' }}>
            Change Stage
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Contact Info */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Contact Information</div>
          {[
            ['Contact Person', lead.contactPerson],
            ['Phone', lead.phone],
            ['Email', lead.email],
            ['Address', [lead.city, lead.state, lead.pincode].filter(Boolean).join(', ')],
            ['GSTIN', lead.gstin],
            ['Source', lead.source?.replace(/_/g, ' ')],
            ['Est. Value', lead.estimatedValue ? `₹${lead.estimatedValue.toLocaleString('en-IN')}` : null],
            ['Next Follow-up', lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: '#9CA3AF', minWidth: '110px', flexShrink: 0 }}>{label}</span>
              <span style={{ color: '#111', fontWeight: 500, textTransform: 'capitalize' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Stage History */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Stage History</div>
          {(!lead.stageHistory || lead.stageHistory.length === 0) ? (
            <div style={{ color: '#9CA3AF', fontSize: '13px' }}>No stage changes yet</div>
          ) : [...lead.stageHistory].reverse().map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '12px' }}>
              <span style={{ fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STAGE_COLORS[h.stage] || '#9CA3AF') + '1A', color: STAGE_COLORS[h.stage] || '#9CA3AF', textTransform: 'capitalize', height: 'fit-content' }}>{h.stage}</span>
              <div>
                <div style={{ color: '#374151' }}>{h.note || 'Stage changed'}</div>
                <div style={{ color: '#9CA3AF', marginTop: '2px' }}>{new Date(h.changedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Notes ({lead.notes?.length || 0})</div>

        {/* Add note */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." rows={2}
            style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
          <button onClick={handleAddNote} disabled={addingNote || !noteText.trim()}
            style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: (!noteText.trim() || addingNote) ? 0.5 : 1, alignSelf: 'flex-start' }}>
            {addingNote ? '...' : 'Add'}
          </button>
        </div>

        {(!lead.notes || lead.notes.length === 0) ? (
          <div style={{ color: '#9CA3AF', fontSize: '13px' }}>No notes yet</div>
        ) : [...lead.notes].reverse().map((n, i) => (
          <div key={i} style={{ padding: '12px 0', borderTop: '1px solid #F3F4F6' }}>
            <div style={{ fontSize: '13px', color: '#111', marginBottom: '4px' }}>{n.text}</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
              {n.addedBy?.name || 'Agent'} &bull; {new Date(n.addedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>

      {/* Stage Change Modal */}
      {showStageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '380px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#111' }}>Change Stage</div>
              <button onClick={() => setShowStageModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>New Stage</label>
                <select value={newStage} onChange={e => setNewStage(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                  {STAGES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Note (optional)</label>
                <textarea value={stageNote} onChange={e => setStageNote(e.target.value)} rows={2}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handleStageChange} disabled={saving}
                style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Update Stage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

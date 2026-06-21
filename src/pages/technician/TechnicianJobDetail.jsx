import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiMapPin, FiPhone, FiClock, FiCamera, FiTool, FiCheck } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import Timeline from '../../components/shared/Timeline';
import technicianAPI from '../../services/technicianAPI';

const ACTION_BUTTONS = [
  { status: 'accepted',    label: 'Accept Job',      color: '#10B981' },
  { status: 'travelling',  label: 'Start Travelling', color: '#3B82F6' },
  { status: 'reached',     label: 'Reached Site',    color: '#8B5CF6' },
  { status: 'diagnosis',   label: 'Start Diagnosis', color: '#F59E0B' },
  { status: 'repair',      label: 'Start Repair',    color: '#EF4444' },
  { status: 'testing',     label: 'Start Testing',   color: '#3B82F6' },
  { status: 'awaiting_confirmation', label: 'Await Customer OK', color: '#F59E0B' },
  { status: 'completed',   label: 'Mark Complete',   color: '#10B981' },
];

export default function TechnicianJobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [resolution, setResolution] = useState('');
  const [note, setNote] = useState('');

  const load = () => {
    setLoading(true);
    technicianAPI.get(`/technician/jobs/${id}`)
      .then(r => {
        setJob(r.data.serviceRequest);
        setDiagnosis(r.data.serviceRequest.diagnosis || '');
        setResolution(r.data.serviceRequest.resolution || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleAction = async (status) => {
    setSaving(true);
    try {
      await technicianAPI.put(`/technician/jobs/${id}/status`, { status, note, diagnosis, resolution });
      setNote('');
      load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading...</div>;
  if (!job) return <div style={{ padding: 40, color: '#EF4444' }}>Job not found.</div>;

  const currentStatusIdx = ACTION_BUTTONS.findIndex(b => b.status === job.status);
  const nextAction = ACTION_BUTTONS[currentStatusIdx + 1];

  const timelineEvents = (job.history || []).map(h => ({
    _id: h._id || Math.random(),
    icon: <FiClock />,
    color: '#3B82F6',
    title: h.status?.replace(/_/g, ' '),
    description: h.note,
    timestamp: h.changedAt,
  }));

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif', maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{job.ticketNumber}</h1>
        <StatusBadge status={job.status} size="lg" />
        <StatusBadge status={job.priority} size="lg" />
      </div>

      {/* Customer Info */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB', marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#111827' }}>Customer</h3>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{job.customer?.name}</div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6B7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiPhone size={13} /> {job.customer?.phone}</span>
        </div>
        {job.serviceAddress && (
          <div style={{ marginTop: 10, fontSize: 13, color: '#374151', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <FiMapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>
              {job.serviceAddress.line1}, {job.serviceAddress.city}, {job.serviceAddress.pincode}
            </span>
          </div>
        )}
      </div>

      {/* Complaint */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB', marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#111827' }}>Complaint</h3>
        <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}><b>Category:</b> {job.category}</div>
        <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}><b>Product:</b> {job.productName || job.product?.name || '—'}</div>
        <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}><b>Serial:</b> {job.serialNumber || '—'}</div>
        <div style={{ fontSize: 13, color: '#374151' }}><b>Description:</b> {job.description}</div>
        {(job.isUnderWarranty || job.isUnderAMC) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {job.isUnderWarranty && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#D1FAE5', color: '#065F46' }}>UNDER WARRANTY</span>}
            {job.isUnderAMC && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#DBEAFE', color: '#1E40AF' }}>UNDER AMC</span>}
          </div>
        )}
      </div>

      {/* Action Panel */}
      {!['completed','closed','cancelled'].includes(job.status) && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB', marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#111827' }}>Job Actions</h3>

          {['diagnosis','repair','testing'].includes(job.status) && (
            <>
              <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Diagnosis notes..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, height: 70, resize: 'vertical', marginBottom: 10, boxSizing: 'border-box' }} />
              <textarea value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Resolution / work done..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, height: 70, resize: 'vertical', marginBottom: 10, boxSizing: 'border-box' }} />
            </>
          )}

          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Note for this status update (optional)..."
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, height: 60, resize: 'vertical', marginBottom: 12, boxSizing: 'border-box' }} />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {nextAction && (
              <button
                onClick={() => handleAction(nextAction.status)}
                disabled={saving}
                style={{ padding: '10px 20px', background: nextAction.color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiCheck size={14} /> {nextAction.label}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Parts Used */}
      {job.partsUsed?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB', marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#111827' }}>Parts Used</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 600, color: '#6B7280' }}>Part</th>
                <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 600, color: '#6B7280' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 600, color: '#6B7280' }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {job.partsUsed.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '8px 0' }}>{p.name} ({p.partNumber})</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>{p.quantity}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>₹{(p.unitPrice * p.quantity).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Timeline */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#111827' }}>History</h3>
        <Timeline events={timelineEvents} />
      </div>
    </div>
  );
}

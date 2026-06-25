import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FiMapPin, FiPhone, FiClock, FiCamera, FiTool, FiCheck, FiEdit3, FiUpload, FiTrash2, FiCheckSquare } from 'react-icons/fi';
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

const DEFAULT_CHECKLIST = [
  'Inspect product for physical damage',
  'Check power supply and connections',
  'Run initial diagnostic',
  'Identify faulty components',
  'Perform repair/replacement',
  'Run post-repair test',
  'Clean work area',
  'Explain work done to customer',
];

export default function TechnicianJobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [resolution, setResolution] = useState('');
  const [note, setNote] = useState('');

  // Canvas signature
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [savingSig, setSavingSig] = useState(false);

  // Photo upload
  const [uploading, setUploading] = useState(false);

  // Checklist
  const [checklist, setChecklist] = useState(() =>
    DEFAULT_CHECKLIST.reduce((acc, item) => ({ ...acc, [item]: false }), {})
  );

  const load = () => {
    setLoading(true);
    technicianAPI.get(`/technician/jobs/${id}`)
      .then(r => {
        setJob(r.data.serviceRequest);
        setDiagnosis(r.data.serviceRequest.diagnosis || '');
        setResolution(r.data.serviceRequest.resolution || '');
        if (r.data.serviceRequest.customerSignature) setSignatureSaved(true);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleAction = async (status) => {
    setSaving(true);
    const checklistSummary = Object.entries(checklist)
      .filter(([, done]) => done)
      .map(([item]) => `✓ ${item}`)
      .join('\n');
    const diagnosisWithChecklist = diagnosis + (checklistSummary ? `\n\n[Checklist]\n${checklistSummary}` : '');
    try {
      await technicianAPI.put(`/technician/jobs/${id}/status`, { status, note, diagnosis: diagnosisWithChecklist, resolution });
      setNote('');
      load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  // ── Canvas signature handlers ───────────────────────────────────────────────
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const endDraw = useCallback(() => setIsDrawing(false), []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureSaved(false);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSavingSig(true);
    try {
      const signatureUrl = canvas.toDataURL('image/png');
      await technicianAPI.post(`/technician/jobs/${id}/signature`, { signatureUrl });
      setSignatureSaved(true);
      load();
    } catch (e) { alert('Failed to save signature'); }
    setSavingSig(false);
  };

  // ── Photo upload ────────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        await technicianAPI.post(`/technician/jobs/${id}/photo-upload`, fd);
      } catch (err) {
        console.error('Photo upload failed:', err);
      }
    }
    setUploading(false);
    load();
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

  const card = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB', marginBottom: 20 };
  const h3Style = { fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#111827' };

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif', maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{job.ticketNumber}</h1>
        <StatusBadge status={job.status} size="lg" />
        <StatusBadge status={job.priority} size="lg" />
      </div>

      {/* Customer Info */}
      <div style={card}>
        <h3 style={h3Style}>Customer</h3>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{job.customer?.name}</div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6B7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiPhone size={13} /> {job.customer?.phone}</span>
        </div>
        {job.serviceAddress && (
          <div style={{ marginTop: 10, fontSize: 13, color: '#374151', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <FiMapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{job.serviceAddress.line1}, {job.serviceAddress.city}, {job.serviceAddress.pincode}</span>
          </div>
        )}
      </div>

      {/* Complaint */}
      <div style={card}>
        <h3 style={h3Style}>Complaint</h3>
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

      {/* Service Checklist */}
      <div style={card}>
        <h3 style={{ ...h3Style, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiCheckSquare size={15} /> Service Checklist
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DEFAULT_CHECKLIST.map(item => (
            <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: checklist[item] ? '#374151' : '#6B7280' }}>
              <input type="checkbox" checked={checklist[item]} onChange={() => setChecklist(prev => ({ ...prev, [item]: !prev[item] }))}
                style={{ width: 16, height: 16, accentColor: '#10B981' }} />
              <span style={{ textDecoration: checklist[item] ? 'line-through' : 'none' }}>{item}</span>
            </label>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: '#9CA3AF' }}>
          {Object.values(checklist).filter(Boolean).length} / {DEFAULT_CHECKLIST.length} completed
        </div>
      </div>

      {/* Action Panel */}
      {!['completed','closed','cancelled'].includes(job.status) && (
        <div style={card}>
          <h3 style={h3Style}>Job Actions</h3>

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
              <button onClick={() => handleAction(nextAction.status)} disabled={saving}
                style={{ padding: '10px 20px', background: nextAction.color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiCheck size={14} /> {nextAction.label}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Before/After Photo Upload */}
      <div style={card}>
        <h3 style={{ ...h3Style, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiCamera size={15} /> Job Photos
        </h3>
        <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>Upload before/after photos for documentation.</p>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          border: '1px dashed #D1D5DB', borderRadius: 8, cursor: 'pointer',
          background: '#F9FAFB', width: 'fit-content',
        }}>
          <FiUpload size={14} style={{ color: '#6B7280' }} />
          <span style={{ fontSize: 13, color: '#374151' }}>{uploading ? 'Uploading...' : 'Upload Photos'}</span>
          <input type="file" multiple accept="image/*" hidden onChange={handlePhotoUpload} disabled={uploading} />
        </label>
        {job.technicianPhotos?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            {job.technicianPhotos.map((url, i) => (
              <div key={i} style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                <img src={url} alt={`photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Signature */}
      <div style={card}>
        <h3 style={{ ...h3Style, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiEdit3 size={15} /> Customer Signature
        </h3>
        {signatureSaved || job.customerSignature ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#F0FDF4', borderRadius: 8 }}>
            <FiCheck size={16} style={{ color: '#10B981' }} />
            <span style={{ fontSize: 13, color: '#065F46', fontWeight: 600 }}>Customer signature captured</span>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>Have the customer sign below to confirm service completion.</p>
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', background: '#FAFAFA', touchAction: 'none' }}>
              <canvas
                ref={canvasRef}
                width={600}
                height={150}
                style={{ display: 'block', width: '100%', cursor: 'crosshair', touchAction: 'none' }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button onClick={clearSignature} style={{ padding: '8px 16px', background: '#F3F4F6', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiTrash2 size={13} /> Clear
              </button>
              <button onClick={saveSignature} disabled={savingSig} style={{ padding: '8px 18px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiCheck size={13} /> {savingSig ? 'Saving...' : 'Save Signature'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Parts Used */}
      {job.partsUsed?.length > 0 && (
        <div style={card}>
          <h3 style={h3Style}>Parts Used</h3>
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
      <div style={card}>
        <h3 style={h3Style}>History</h3>
        <Timeline events={timelineEvents} />
      </div>
    </div>
  );
}

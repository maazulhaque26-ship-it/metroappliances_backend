import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FiCheckCircle, FiUpload, FiEdit3, FiTrash2, FiCamera } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import engineerAPI from '../../services/engineerAPI';

const STATUS_FLOW = [
  { value: 'travelling',      label: 'Mark Travelling' },
  { value: 'arrived',         label: 'Mark Arrived' },
  { value: 'in_progress',     label: 'Start Installation' },
  { value: 'demo_in_progress',label: 'Start Demo' },
  { value: 'completed',       label: 'Complete Job' },
];

export default function EngineerInstallationDetail() {
  const { id } = useParams();
  const [ir, setIr]           = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [note, setNote]       = useState('');
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Canvas signature
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasSig, setHasSig] = useState(false);
  const [savingSig, setSavingSig] = useState(false);

  const [demoNotes, setDemoNotes] = useState('');
  const [savingDemo, setSavingDemo] = useState(false);

  const load = () => {
    setLoading(true);
    engineerAPI.get(`/engineer/jobs/${id}`)
      .then(r => { setIr(r.data.data); setDemoNotes(r.data.data?.demoNotes || ''); })
      .catch(() => setError('Failed to load job'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  // Canvas drawing
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const evt  = e.touches ? e.touches[0] : e;
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  };
  const startDraw = useCallback((e) => {
    e.preventDefault();
    drawingRef.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, []);
  const draw = useCallback((e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    setHasSig(true);
  }, []);
  const endDraw = useCallback(() => { drawingRef.current = false; }, []);
  const clearSig = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  };

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await engineerAPI.put(`/engineer/jobs/${id}/status`, { status, note });
      load();
      setNote('');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const toggleChecklistItem = async (itemId, completed) => {
    try {
      await engineerAPI.put(`/engineer/jobs/${id}/checklist`, { itemId, completed });
      load();
    } catch (e) { console.error(e); }
  };

  const uploadPhoto = async (e, photoType) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', photoType);
      fd.append('caption', photoType);
      await engineerAPI.post(`/engineer/jobs/${id}/photo`, fd);
      load();
    } catch (e) { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    const sig = canvas.toDataURL('image/png');
    setSavingSig(true);
    try {
      await engineerAPI.post(`/engineer/jobs/${id}/signature`, { signature: sig });
      load();
    } catch (e) { alert('Failed to save signature'); }
    finally { setSavingSig(false); }
  };

  const saveDemoNotes = async () => {
    setSavingDemo(true);
    try {
      await engineerAPI.put(`/engineer/jobs/${id}/demo`, { demoNotes, demoCompleted: true });
      load();
    } catch (e) { alert('Failed to save demo notes'); }
    finally { setSavingDemo(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>Loading...</div>;
  if (error)   return <div style={{ padding: 40, textAlign: 'center', color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}>{error}</div>;
  if (!ir)     return null;

  const nextStatuses = STATUS_FLOW.filter(s => {
    if (ir.status === 'pending'    || ir.status === 'confirmed') return s.value === 'travelling';
    if (ir.status === 'assigned')  return s.value === 'travelling';
    if (ir.status === 'travelling') return s.value === 'arrived';
    if (ir.status === 'arrived')   return s.value === 'in_progress';
    if (ir.status === 'in_progress') return s.value === 'demo_in_progress' || s.value === 'completed';
    if (ir.status === 'demo_in_progress') return s.value === 'completed';
    return false;
  });

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif', maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{ir.requestNumber}</h1>
            <StatusBadge status={ir.status} size="lg" />
          </div>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{ir.productName} · {ir.category}</p>
        </div>
      </div>

      {/* Customer & Address */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #E5E7EB' }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Customer</h4>
          <div style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{ir.customer?.name}</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{ir.customer?.phone}</div>
          {ir.installationAddress && (
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6, lineHeight: 1.6 }}>
              {ir.installationAddress.line1 && <div>{ir.installationAddress.line1}</div>}
              <div>{ir.installationAddress.city}, {ir.installationAddress.state}</div>
              <div>{ir.installationAddress.pincode}</div>
            </div>
          )}
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #E5E7EB' }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Job Details</h4>
          {[
            { label: 'Serial No.', value: ir.serialNumber || '—' },
            { label: 'Service Type', value: (ir.serviceType || '').replace(/_/g, ' ') },
            { label: 'Slot', value: ir.preferredSlot || '—' },
            { label: 'Scheduled', value: ir.scheduledAt ? new Date(ir.scheduledAt).toLocaleDateString() : '—' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: '#6B7280' }}>{r.label}</span>
              <span style={{ color: '#111827', fontWeight: 500, textTransform: 'capitalize' }}>{r.value}</span>
            </div>
          ))}
          {ir.specialInstructions && <div style={{ marginTop: 8, padding: '8px 10px', background: '#FFF7ED', borderRadius: 6, fontSize: 11, color: '#9A3412' }}>{ir.specialInstructions}</div>}
        </div>
      </div>

      {/* Status Update */}
      {nextStatuses.length > 0 && ir.status !== 'completed' && (
        <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #E5E7EB', marginBottom: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Update Status</h4>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note..."
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, marginBottom: 10, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {nextStatuses.map(s => (
              <button key={s.value} onClick={() => updateStatus(s.value)} disabled={updating}
                style={{ padding: '9px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: updating ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Poppins, sans-serif', opacity: updating ? 0.7 : 1 }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      {ir.checklist?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #E5E7EB', marginBottom: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
            Checklist ({ir.checklist.filter(i => i.completed).length}/{ir.checklist.length})
          </h4>
          {ir.checklist.map(item => (
            <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <input type="checkbox" checked={item.completed} onChange={e => toggleChecklistItem(item._id, e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#059669' }} />
              <span style={{ fontSize: 13, color: item.completed ? '#6B7280' : '#374151', textDecoration: item.completed ? 'line-through' : 'none' }}>{item.item}</span>
              {item.completed && item.completedAt && (
                <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 'auto' }}>{new Date(item.completedAt).toLocaleTimeString()}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Photo Upload */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #E5E7EB', marginBottom: 20 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Installation Photos</h4>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {['before', 'after', 'general'].map(type => (
            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#F3F4F6', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>
              <FiCamera size={14} /> {type}
              <input type="file" accept="image/*" capture="environment" onChange={e => uploadPhoto(e, type)} style={{ display: 'none' }} />
            </label>
          ))}
          {uploading && <span style={{ fontSize: 12, color: '#6B7280', alignSelf: 'center' }}>Uploading...</span>}
        </div>
        {ir.engineerPhotos?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ir.engineerPhotos.map((p, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={p.url} alt={p.type} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '2px solid #E5E7EB' }} />
                <span style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 3 }}>{p.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demo Notes */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #E5E7EB', marginBottom: 20 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Demo Notes</h4>
        <textarea value={demoNotes} onChange={e => setDemoNotes(e.target.value)} rows={3}
          placeholder="Product demo, usage instructions, maintenance tips given to customer..."
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box', resize: 'vertical' }} />
        <button onClick={saveDemoNotes} disabled={savingDemo}
          style={{ marginTop: 8, padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: savingDemo ? 'not-allowed' : 'pointer', fontFamily: 'Poppins, sans-serif', opacity: savingDemo ? 0.7 : 1 }}>
          {ir.demoCompleted ? '✓ Demo Saved' : (savingDemo ? 'Saving...' : 'Save Demo Notes')}
        </button>
      </div>

      {/* Customer Signature */}
      {!ir.customerSignature && (
        <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #E5E7EB', marginBottom: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Customer Signature</h4>
          <div style={{ border: '2px dashed #D1D5DB', borderRadius: 8, overflow: 'hidden', marginBottom: 10, touchAction: 'none' }}>
            <canvas ref={canvasRef} width={580} height={140}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
              style={{ display: 'block', cursor: 'crosshair', background: '#FAFAFA', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={clearSig} style={{ padding: '8px 14px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'Poppins, sans-serif' }}>
              <FiTrash2 size={12} style={{ marginRight: 4 }} /> Clear
            </button>
            <button onClick={saveSignature} disabled={!hasSig || savingSig}
              style={{ padding: '8px 16px', background: !hasSig || savingSig ? '#9CA3AF' : '#059669', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: !hasSig || savingSig ? 'not-allowed' : 'pointer', fontFamily: 'Poppins, sans-serif' }}>
              {savingSig ? 'Saving...' : 'Save Signature & Complete'}
            </button>
          </div>
        </div>
      )}
      {ir.customerSignature && (
        <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 16, border: '1px solid #BBF7D0', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FiCheckCircle color="#10B981" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>Customer has signed off</span>
          </div>
          <img src={ir.customerSignature} alt="signature" style={{ maxWidth: 200, border: '1px solid #D1FAE5', borderRadius: 6 }} />
        </div>
      )}
    </div>
  );
}

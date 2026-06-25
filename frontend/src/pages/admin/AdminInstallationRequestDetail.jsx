import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiUser } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import api from '../../services/api';

const STATUS_OPTS = ['confirmed', 'assigned', 'cancelled', 'rescheduled', 'completed'];

export default function AdminInstallationRequestDetail() {
  const { id } = useParams();
  const [ir, setIr]             = useState(null);
  const [loading, setLoading]   = useState(true);
  const [engineers, setEngineers] = useState([]);
  const [engineerId, setEngineerId] = useState('');
  const [newStatus, setNewStatus]   = useState('');
  const [note, setNote]             = useState('');
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');

  const load = () => {
    api.get(`/admin/installation/requests/${id}`)
      .then(r => setIr(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/admin/installation-engineers?status=active&limit=50')
      .then(r => setEngineers(r.data.data || []))
      .catch(() => {});
  }, [id]);

  const updateStatus = async () => {
    if (!newStatus) return;
    setSaving(true);
    try {
      await api.put(`/admin/installation/requests/${id}/status`, { status: newStatus, note });
      setMsg('Status updated');
      setNewStatus(''); setNote('');
      load();
    } catch (e) { setMsg(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000); }
  };

  const assignEngineer = async () => {
    if (!engineerId) return;
    setSaving(true);
    try {
      await api.put(`/admin/installation/requests/${id}/assign`, { engineerId });
      setMsg('Engineer assigned'); setEngineerId('');
      load();
    } catch (e) { setMsg(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000); }
  };

  const autoAssign = async () => {
    setSaving(true);
    try {
      await api.post(`/admin/installation/dispatch/${id}/auto-assign`);
      setMsg('Auto-assigned successfully');
      load();
    } catch (e) { setMsg(e.response?.data?.message || 'No available engineers'); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>Loading...</div>;
  if (!ir)     return <div style={{ padding: 40, textAlign: 'center', color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}>Not found</div>;

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif', maxWidth: 900 }}>
      {msg && <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{ir.requestNumber}</h1>
            <StatusBadge status={ir.status} size="lg" />
            <StatusBadge status={ir.priority} />
          </div>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{ir.productName} · {ir.category} · {ir.serviceType?.replace(/_/g, ' ')}</p>
        </div>
        <Link to="/admin/installation/requests" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>← Back</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #E5E7EB' }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Customer</h4>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{ir.customer?.name}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{ir.customer?.email} · {ir.customer?.phone}</div>
          {ir.installationAddress && (
            <div style={{ fontSize: 12, color: '#374151', marginTop: 8, lineHeight: 1.7 }}>
              {ir.installationAddress.line1 && <div>{ir.installationAddress.line1}</div>}
              <div>{ir.installationAddress.city}, {ir.installationAddress.state} – {ir.installationAddress.pincode}</div>
            </div>
          )}
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #E5E7EB' }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Schedule</h4>
          {[
            { label: 'Preferred Date', value: ir.preferredDate ? new Date(ir.preferredDate).toLocaleDateString() : '—' },
            { label: 'Slot',           value: ir.preferredSlot || '—' },
            { label: 'Scheduled At',   value: ir.scheduledAt ? new Date(ir.scheduledAt).toLocaleDateString() : '—' },
            { label: 'Serial No.',     value: ir.serialNumber || '—' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: '#6B7280' }}>{r.label}</span>
              <span style={{ color: '#111827', fontWeight: 500 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Assign Engineer */}
      {!ir.assignedEngineer ? (
        <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #E5E7EB', marginBottom: 16 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Assign Engineer</h4>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={engineerId} onChange={e => setEngineerId(e.target.value)} style={{ flex: 1, padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif' }}>
              <option value="">Select Engineer</option>
              {engineers.map(e => <option key={e._id} value={e._id}>{e.name} ({e.currentWorkload}/{e.maxWorkload} jobs)</option>)}
            </select>
            <button onClick={assignEngineer} disabled={!engineerId || saving} style={{ padding: '10px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Poppins, sans-serif', opacity: (!engineerId || saving) ? 0.7 : 1 }}>Assign</button>
            <button onClick={autoAssign} disabled={saving} style={{ padding: '10px 16px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Poppins, sans-serif', opacity: saving ? 0.7 : 1 }}>Auto-Assign</button>
          </div>
        </div>
      ) : (
        <div style={{ background: '#EFF6FF', borderRadius: 10, padding: 16, border: '1px solid #DBEAFE', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiUser size={20} color="#1D4ED8" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF' }}>{ir.assignedEngineer.name}</div>
            <div style={{ fontSize: 12, color: '#3B82F6' }}>Assigned Engineer · {ir.assignedEngineer.phone}</div>
          </div>
        </div>
      )}

      {/* Status Update */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #E5E7EB', marginBottom: 16 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Update Status</h4>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ flex: 1, padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif' }}>
            <option value="">Select Status</option>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" style={{ flex: 2, padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif' }} />
          <button onClick={updateStatus} disabled={!newStatus || saving} style={{ padding: '10px 16px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Poppins, sans-serif', opacity: (!newStatus || saving) ? 0.7 : 1 }}>Update</button>
        </div>
      </div>

      {/* Checklist */}
      {ir.checklist?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #E5E7EB', marginBottom: 16 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Checklist ({ir.checklist.filter(i => i.completed).length}/{ir.checklist.length})</h4>
          {ir.checklist.map(item => (
            <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: item.completed ? '#10B981' : '#E5E7EB', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: item.completed ? '#374151' : '#9CA3AF' }}>{item.item}</span>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {ir.history?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #E5E7EB' }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>History</h4>
          {[...ir.history].reverse().map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 13 }}>
              <StatusBadge status={h.status} />
              <span style={{ color: '#6B7280' }}>{h.note || '—'}</span>
              <span style={{ color: '#9CA3AF', marginLeft: 'auto', fontSize: 11 }}>{new Date(h.changedAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiUser, FiTool, FiClock, FiCheckCircle, FiAlertTriangle, FiMessageCircle } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import Timeline from '../../components/shared/Timeline';
import api from '../../services/api';

const STATUSES = ['open','verified','warranty_check','assigned','accepted','travelling','reached','diagnosis','repair','testing','awaiting_confirmation','completed','closed','escalated','cancelled'];

export default function AdminServiceRequestDetail() {
  const { id } = useParams();
  const [sr, setSr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);
  const [assignModal, setAssignModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [form, setForm] = useState({ technicianId: '', scheduledAt: '', status: '', note: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/admin/service/requests/${id}`)
      .then(r => setSr(r.data.serviceRequest))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/admin/technicians?limit=100&status=active')
      .then(r => setTechnicians(r.data.data || []));
  }, [id]);

  const handleAssign = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/service/requests/${id}/assign`, { technicianId: form.technicianId, scheduledAt: form.scheduledAt });
      setAssignModal(false);
      load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  const handleStatus = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/service/requests/${id}/status`, { status: form.status, note: form.note });
      setStatusModal(false);
      load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSaving(true);
    try {
      await api.post(`/admin/service/requests/${id}/comment`, { text: commentText, isInternal: true });
      setCommentText('');
      load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading...</div>;
  if (!sr) return <div style={{ padding: 40, color: '#EF4444' }}>Service request not found.</div>;

  const timelineEvents = (sr.history || []).map(h => ({
    _id: h._id,
    icon: <FiClock />,
    color: '#3B82F6',
    title: h.status?.replace(/_/g, ' '),
    description: h.note,
    timestamp: h.changedAt,
  }));

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif', maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{sr.ticketNumber}</h1>
        <StatusBadge status={sr.status} size="lg" />
        <StatusBadge status={sr.priority} size="lg" />
        {sr.isUnderWarranty && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#D1FAE5', color: '#065F46' }}>WARRANTY</span>}
        {sr.isUnderAMC && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#DBEAFE', color: '#1E40AF' }}>AMC</span>}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setAssignModal(true)} style={{ padding: '8px 16px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Assign Technician
        </button>
        <button onClick={() => setStatusModal(true)} style={{ padding: '8px 16px', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Update Status
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Details */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Service Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Category', sr.category], ['Product', sr.productName || sr.product?.name],
                ['Serial Number', sr.serialNumber || '—'], ['Invoice No', sr.invoiceNumber || '—'],
                ['Description', sr.description],
              ].map(([label, value]) => (
                <div key={label} style={{ gridColumn: label === 'Description' ? '1 / -1' : undefined }}>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#111827' }}>{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer & Address */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Customer</h3>
            <div><b>{sr.customer?.name}</b> · {sr.customer?.phone} · {sr.customer?.email}</div>
            {sr.serviceAddress && (
              <div style={{ marginTop: 12, fontSize: 13, color: '#374151' }}>
                <b>Service Address:</b><br />
                {sr.serviceAddress.line1}{sr.serviceAddress.line2 ? ', ' + sr.serviceAddress.line2 : ''}<br />
                {sr.serviceAddress.city}, {sr.serviceAddress.state} {sr.serviceAddress.pincode}
              </div>
            )}
          </div>

          {/* Comments */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Internal Notes</h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add internal note..."
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
              <button onClick={handleComment} disabled={saving} style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                Add
              </button>
            </div>
            {(sr.comments || []).filter(c => c.isInternal).map(c => (
              <div key={c._id} style={{ padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{c.authorName}</div>
                <div style={{ fontSize: 13, color: '#111827', marginTop: 4 }}>{c.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Technician */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Assigned Technician</h3>
            {sr.assignedTechnician ? (
              <div>
                <div style={{ fontWeight: 600 }}>{sr.assignedTechnician.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{sr.assignedTechnician.phone}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Rating: {sr.assignedTechnician.rating?.average}/5</div>
              </div>
            ) : <div style={{ color: '#9CA3AF', fontSize: 13 }}>Not assigned</div>}
            {sr.scheduledAt && <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>Scheduled: {new Date(sr.scheduledAt).toLocaleString('en-IN')}</div>}
          </div>

          {/* SLA */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>SLA</h3>
            {[['Respond By', sr.sla?.respondBy], ['Resolve By', sr.sla?.resolveBy]].map(([label, val]) => (
              <div key={label} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{label}</div>
                <div style={{ fontSize: 13, color: sr.sla?.isBreached ? '#EF4444' : '#111827' }}>
                  {val ? new Date(val).toLocaleString('en-IN') : '—'}
                </div>
              </div>
            ))}
            {sr.sla?.isBreached && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FEE2E2', color: '#991B1B' }}>SLA BREACHED</span>}
          </div>

          {/* Timeline */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>History</h3>
            <Timeline events={timelineEvents} />
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 420 }}>
            <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Assign Technician</h3>
            <select value={form.technicianId} onChange={e => setForm(f => ({ ...f, technicianId: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
              <option value="">Select technician...</option>
              {technicians.map(t => <option key={t._id} value={t._id}>{t.name} ({t.employeeId}) · WL: {t.currentWorkload}/{t.maxWorkload}</option>)}
            </select>
            <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, marginBottom: 20, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setAssignModal(false)} style={{ padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAssign} disabled={saving || !form.technicianId} style={{ padding: '8px 16px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 420 }}>
            <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Update Status</h3>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
              <option value="">Select new status...</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Note (optional)"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, marginBottom: 20, height: 80, resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setStatusModal(false)} style={{ padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleStatus} disabled={saving || !form.status} style={{ padding: '8px 16px', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiClock, FiPhone, FiMapPin, FiTool,
  FiShield, FiStar, FiPrinter, FiPaperclip,
} from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import Timeline from '../../components/shared/Timeline';
import LoadingState from '../../components/shared/LoadingState';
import api from '../../services/api';

const SERVICE_STAGES = [
  'open', 'verified', 'warranty_check', 'assigned', 'accepted',
  'travelling', 'reached', 'diagnosis', 'repair', 'testing',
  'awaiting_confirmation', 'completed', 'closed',
];

export default function CustomerTrackComplaint() {
  const { id } = useParams();
  const [sr, setSR] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    setLoading(true);
    api.get(`/service/requests/${id}`)
      .then(r => setSR(r.data.data?.serviceRequest || r.data.serviceRequest))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return <LoadingState message="Loading your service request..." />;
  if (!sr) return (
    <div className="min-h-screen pt-24 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: 'var(--text-4)' }}>Service request not found.</p>
        <Link to="/my-service" style={{ color: 'var(--accent)', fontSize: 14, marginTop: 8, display: 'block' }}>← Back to My Requests</Link>
      </div>
    </div>
  );

  const currentStageIdx = SERVICE_STAGES.indexOf(sr.status);
  const timelineEvents = (sr.history || []).map(h => ({
    _id: h._id,
    icon: <FiClock size={14} />,
    color: '#3B82F6',
    title: (h.status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    description: h.note,
    timestamp: h.changedAt,
  }));

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }} ref={printRef}>
        {/* Back + Print */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Link to="/my-service" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-4)', textDecoration: 'none', fontSize: 13 }}>
            <FiArrowLeft size={14} /> All Requests
          </Link>
          <button onClick={handlePrint} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
            fontSize: 13, color: 'var(--text)', cursor: 'pointer',
          }}>
            <FiPrinter size={14} /> Print Report
          </button>
        </div>

        {/* Ticket Header */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{sr.ticketNumber}</h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <StatusBadge status={sr.status} size="lg" />
                <StatusBadge status={sr.priority} size="lg" />
                {sr.isUnderWarranty && <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#D1FAE5', color: '#065F46' }}>✓ WARRANTY</span>}
                {sr.isUnderAMC && <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#DBEAFE', color: '#1E40AF' }}>✓ AMC</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-4)' }}>
              <div>Raised {new Date(sr.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              {sr.sla?.resolveBy && (
                <div style={{ marginTop: 4 }}>
                  SLA Resolve by {new Date(sr.sla.resolveBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {sr.sla.isBreached && <span style={{ color: '#EF4444', fontWeight: 700, marginLeft: 4 }}>BREACHED</span>}
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {!['cancelled','escalated'].includes(sr.status) && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-4)', marginBottom: 6 }}>
                <span>OPEN</span>
                <span>IN PROGRESS</span>
                <span>CLOSED</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.max(5, Math.round((currentStageIdx / (SERVICE_STAGES.length - 1)) * 100))}%`,
                  background: 'var(--accent)',
                  borderRadius: 6,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Complaint Info */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiTool size={14} /> Complaint Details
            </h3>
            <div style={{ fontSize: 13, lineHeight: 2, color: 'var(--text-4)' }}>
              <div><b style={{ color: 'var(--text)' }}>Product:</b> {sr.productName || sr.product?.name || '—'}</div>
              <div><b style={{ color: 'var(--text)' }}>Serial No:</b> {sr.serialNumber || '—'}</div>
              <div><b style={{ color: 'var(--text)' }}>Category:</b> {sr.category}</div>
              <div><b style={{ color: 'var(--text)' }}>Invoice:</b> {sr.invoiceNumber || '—'}</div>
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#F9FAFB', borderRadius: 8, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
              {sr.description}
            </div>
          </div>

          {/* Technician Info */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiPhone size={14} /> Assigned Technician
            </h3>
            {sr.assignedTechnician ? (
              <div style={{ fontSize: 13, color: 'var(--text-4)', lineHeight: 2 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{sr.assignedTechnician.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiPhone size={12} /> {sr.assignedTechnician.phone}</div>
                {sr.scheduledAt && <div><b style={{ color: 'var(--text)' }}>Scheduled:</b> {new Date(sr.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-4)', fontStyle: 'italic', padding: '16px 0' }}>
                A technician will be assigned to your request soon.
              </div>
            )}
            {sr.serviceAddress?.city && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--text-4)' }}>
                <FiMapPin size={13} style={{ marginTop: 1, flexShrink: 0 }} />
                <span>{[sr.serviceAddress.line1, sr.serviceAddress.city, sr.serviceAddress.pincode].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Diagnosis / Resolution */}
        {(sr.diagnosis || sr.resolution) && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Technical Report</h3>
            {sr.diagnosis && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Diagnosis</div>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{sr.diagnosis}</p>
              </div>
            )}
            {sr.resolution && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Resolution</div>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{sr.resolution}</p>
              </div>
            )}
            {sr.totalCharge > 0 && (
              <div style={{ marginTop: 14, padding: '12px 16px', background: '#F0FDF4', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#065F46', fontWeight: 600 }}>Total Charge</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#065F46' }}>₹{sr.totalCharge.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        )}

        {/* Feedback CTA */}
        {['completed', 'closed'].includes(sr.status) && !sr.customerRating && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#92400E', marginBottom: 4 }}>How was your experience?</div>
              <div style={{ fontSize: 13, color: '#A16207' }}>Rate your service and help us improve.</div>
            </div>
            <Link to={`/my-service/feedback/${sr._id}`} style={{
              padding: '10px 20px', background: '#F59E0B', color: '#fff',
              borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <FiStar size={14} /> Rate Now
            </Link>
          </div>
        )}

        {/* Attachments */}
        {sr.attachments?.length > 0 && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiPaperclip size={14} /> Attachments ({sr.attachments.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {sr.attachments.map((att, i) => (
                <a key={i} href={att.url} target="_blank" rel="noreferrer"
                  style={{ padding: '8px 14px', background: '#F3F4F6', borderRadius: 8, fontSize: 12, color: 'var(--text)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiPaperclip size={12} />
                  {att.filename || `Attachment ${i + 1}`}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Activity Timeline</h3>
          <Timeline events={timelineEvents} />
        </div>
      </div>
    </div>
  );
}

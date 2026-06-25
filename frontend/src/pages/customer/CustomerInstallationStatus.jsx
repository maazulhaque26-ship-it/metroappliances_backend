import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiTool, FiUser, FiStar, FiCheckCircle, FiPrinter } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import api from '../../services/api';

const STAGES = [
  { key: 'pending',          label: 'Booked' },
  { key: 'confirmed',        label: 'Confirmed' },
  { key: 'assigned',         label: 'Engineer Assigned' },
  { key: 'travelling',       label: 'Engineer En Route' },
  { key: 'arrived',          label: 'Engineer Arrived' },
  { key: 'in_progress',      label: 'Installation In Progress' },
  { key: 'demo_in_progress', label: 'Demo In Progress' },
  { key: 'completed',        label: 'Completed' },
];

function StarDisplay({ rating }) {
  return (
    <span>
      {[1,2,3,4,5].map(s => (
        <FiStar key={s} size={14} fill={s <= rating ? '#F59E0B' : 'none'} color={s <= rating ? '#F59E0B' : '#D1D5DB'} />
      ))}
    </span>
  );
}

export default function CustomerInstallationStatus() {
  const { id } = useParams();
  const [ir, setIr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    api.get(`/installation/requests/${id}`)
      .then(r => setIr(r.data.data))
      .catch(() => setError('Installation request not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>Loading...</div>;
  if (error)   return <div style={{ padding: 40, textAlign: 'center', color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}>{error}</div>;
  if (!ir)     return null;

  const stageIdx = STAGES.findIndex(s => s.key === ir.status);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiTool size={20} color="#FF7A00" />
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{ir.requestNumber}</h1>
            <StatusBadge status={ir.status} size="lg" />
          </div>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{ir.productName} · {ir.category}</p>
        </div>
        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#F3F4F6', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>
          <FiPrinter size={14} /> Print
        </button>
      </div>

      {/* Progress bar */}
      {ir.status !== 'cancelled' && ir.status !== 'rescheduled' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB', marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Installation Progress</h3>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {STAGES.map((stage, i) => (
              <React.Fragment key={stage.key}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i <= stageIdx ? '#FF7A00' : '#E5E7EB', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                    {i <= stageIdx ? <FiCheckCircle size={14} /> : i + 1}
                  </div>
                  <div style={{ fontSize: 9, color: i <= stageIdx ? '#FF7A00' : '#9CA3AF', marginTop: 4, textAlign: 'center', fontWeight: i === stageIdx ? 700 : 400, maxWidth: 60 }}>{stage.label}</div>
                </div>
                {i < STAGES.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < stageIdx ? '#FF7A00' : '#E5E7EB', margin: '0 -4px', marginBottom: 20 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Schedule info */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Schedule</h3>
          <InfoRow label="Preferred Date" value={ir.preferredDate ? new Date(ir.preferredDate).toLocaleDateString() : '—'} />
          <InfoRow label="Preferred Slot" value={ir.preferredSlot || '—'} />
          {ir.scheduledAt && <InfoRow label="Confirmed At" value={new Date(ir.scheduledAt).toLocaleDateString()} />}
          <InfoRow label="Service Type" value={(ir.serviceType || '').replace(/_/g, ' ')} />
          <InfoRow label="Priority" value={ir.priority} />
        </div>

        {/* Address */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Installation Address</h3>
          {ir.installationAddress ? (
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
              {ir.installationAddress.line1 && <div>{ir.installationAddress.line1}</div>}
              <div>{ir.installationAddress.city}, {ir.installationAddress.state} – {ir.installationAddress.pincode}</div>
              {ir.installationAddress.landmark && <div style={{ color: '#6B7280' }}>Near {ir.installationAddress.landmark}</div>}
              {ir.installationAddress.phone && <div style={{ color: '#6B7280' }}>Ph: {ir.installationAddress.phone}</div>}
            </div>
          ) : <div style={{ fontSize: 13, color: '#9CA3AF' }}>—</div>}
        </div>
      </div>

      {/* Assigned Engineer */}
      {ir.assignedEngineer && (
        <div style={{ background: '#EFF6FF', borderRadius: 12, padding: 18, border: '1px solid #DBEAFE', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiUser size={22} color="#1D4ED8" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF' }}>{ir.assignedEngineer.name}</div>
            <div style={{ fontSize: 12, color: '#3B82F6' }}>Installation Engineer · {ir.assignedEngineer.phone}</div>
            {ir.assignedEngineer.rating?.average > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <StarDisplay rating={Math.round(ir.assignedEngineer.rating.average)} />
                <span style={{ fontSize: 11, color: '#6B7280' }}>{ir.assignedEngineer.rating.average}/5</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checklist progress */}
      {ir.checklist?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #E5E7EB', marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
            Installation Checklist ({ir.checklist.filter(i => i.completed).length}/{ir.checklist.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ir.checklist.map(item => (
              <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: item.completed ? '#10B981' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.completed && <FiCheckCircle size={12} color="#fff" />}
                </div>
                <span style={{ fontSize: 13, color: item.completed ? '#374151' : '#9CA3AF', textDecoration: item.completed ? 'none' : 'none' }}>{item.item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback CTA */}
      {ir.status === 'completed' && !ir.customerRating && (
        <div style={{ background: '#FFFBEB', borderRadius: 12, padding: 18, border: '1px solid #FDE68A', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>Share Your Experience</div>
            <div style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>Rate your installation experience</div>
          </div>
          <Link to={`/my-installations/${id}/feedback`} style={{ padding: '9px 16px', background: '#F59E0B', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Rate Now</Link>
        </div>
      )}
      {ir.status === 'completed' && ir.customerRating && (
        <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 16, border: '1px solid #BBF7D0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiStar color="#10B981" />
          <span style={{ fontSize: 13, color: '#065F46' }}>You rated this installation <strong>{ir.customerRating}/5</strong>. Thank you!</span>
        </div>
      )}

      <Link to="/my-installations" style={{ fontSize: 13, color: '#FF7A00', textDecoration: 'none' }}>← All Installation Requests</Link>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
      <span style={{ color: '#6B7280' }}>{label}</span>
      <span style={{ color: '#111827', fontWeight: 600, textTransform: 'capitalize' }}>{value}</span>
    </div>
  );
}

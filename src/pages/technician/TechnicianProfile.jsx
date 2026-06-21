import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiUser, FiPhone, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import technicianAPI from '../../services/technicianAPI';
import { fetchTechnicianMe } from '../../redux/slices/technicianAuthSlice';

export default function TechnicianProfile() {
  const dispatch = useDispatch();
  const { technician } = useSelector(s => s.technicianAuth);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const toggleAvailability = async () => {
    setSaving(true);
    try {
      await technicianAPI.put('/technician/auth/availability', {
        isAvailable: !technician?.availability?.isAvailable,
      });
      await dispatch(fetchTechnicianMe());
      setMsg('Availability updated');
    } catch (e) { setMsg('Error updating availability'); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  if (!technician) return null;

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif', maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#111827' }}>My Profile</h1>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E5E7EB', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 60, height: 60, background: '#111827', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiUser size={28} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{technician.name}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{technician.employeeId}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            ['Email', technician.email],
            ['Phone', technician.phone],
            ['Status', technician.status],
            ['Workload', `${technician.currentWorkload}/${technician.maxWorkload}`],
            ['Rating', `${technician.rating?.average?.toFixed(1) || '0.0'}/5 (${technician.rating?.count || 0} reviews)`],
            ['Experience', `${technician.experienceYears || 0} years`],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, color: '#111827', fontWeight: label === 'Email' ? 400 : 600 }}>{value}</div>
            </div>
          ))}
        </div>

        {technician.skills?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {technician.skills.map(s => (
                <span key={s} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: '#F3F4F6', color: '#374151', fontWeight: 500 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {technician.territory?.cities?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>Territory</div>
            <div style={{ fontSize: 13, color: '#374151' }}>{technician.territory.cities.join(', ')}</div>
          </div>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Availability</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              {technician.availability?.isAvailable ? 'You are currently available for new jobs' : 'You are marked as unavailable'}
            </div>
          </div>
          <button onClick={toggleAvailability} disabled={saving}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: technician.availability?.isAvailable ? '#10B981' : '#9CA3AF' }}>
            {technician.availability?.isAvailable
              ? <FiToggleRight size={36} />
              : <FiToggleLeft size={36} />}
          </button>
        </div>
        {msg && <div style={{ marginTop: 10, fontSize: 12, color: '#10B981' }}>{msg}</div>}
      </div>
    </div>
  );
}

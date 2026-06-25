import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiUser, FiToggleLeft, FiToggleRight, FiStar } from 'react-icons/fi';
import { fetchEngineerMe } from '../../redux/slices/engineerAuthSlice';
import engineerAPI from '../../services/engineerAPI';

export default function EngineerProfile() {
  const dispatch = useDispatch();
  const { engineer } = useSelector(s => s.engineerAuth);
  const [toggling, setToggling] = useState(false);
  const [msg, setMsg] = useState('');

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      await engineerAPI.put('/engineer/auth/availability', { isAvailable: !engineer?.isAvailable });
      await dispatch(fetchEngineerMe());
      setMsg('Availability updated');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      setMsg('Failed to update');
    } finally {
      setToggling(false);
    }
  };

  if (!engineer) return null;

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif', maxWidth: 600 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 24 }}>My Profile</h1>

      {msg && <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{msg}</div>}

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E5E7EB', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiUser size={28} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{engineer.name}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{engineer.email}</div>
            {engineer.employeeId && <div style={{ fontSize: 12, color: '#9CA3AF' }}>ID: {engineer.employeeId}</div>}
          </div>
        </div>

        {[
          { label: 'Phone',  value: engineer.phone },
          { label: 'Status', value: engineer.status },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
            <span style={{ color: '#6B7280' }}>{r.label}</span>
            <span style={{ color: '#111827', fontWeight: 600, textTransform: 'capitalize' }}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* Availability Toggle */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Availability</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Toggle to receive new installation assignments</div>
        </div>
        <button onClick={toggleAvailability} disabled={toggling}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: engineer.isAvailable ? '#D1FAE5' : '#FEE2E2', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13, color: engineer.isAvailable ? '#065F46' : '#991B1B' }}>
          {engineer.isAvailable ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
          {engineer.isAvailable ? 'Available' : 'Unavailable'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB', marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Performance</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { label: 'Total Installations', value: engineer.totalInstallations || 0 },
            { label: 'Current Workload',    value: `${engineer.currentWorkload || 0}/${engineer.maxWorkload || 6}` },
            { label: 'Avg Rating',          value: engineer.rating?.count ? `${engineer.rating.average}/5` : 'No ratings' },
          ].map(s => (
            <div key={s.label} style={{ background: '#F9FAFB', borderRadius: 8, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      {engineer.skills?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB', marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Skills</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {engineer.skills.map(s => (
              <span key={s} style={{ padding: '5px 12px', background: '#D1FAE5', color: '#065F46', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Territory */}
      {(engineer.territory?.cities?.length > 0 || engineer.territory?.pincodes?.length > 0) && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Service Territory</h3>
          {engineer.territory.cities?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Cities</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {engineer.territory.cities.map(c => <span key={c} style={{ padding: '4px 10px', background: '#EFF6FF', color: '#1E40AF', borderRadius: 12, fontSize: 12 }}>{c}</span>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

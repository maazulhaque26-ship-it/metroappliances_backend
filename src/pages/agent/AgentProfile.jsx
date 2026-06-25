import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateAgentProfile, agentLogout, clearAgentAuth } from '../../redux/slices/agentAuthSlice';
import { useNavigate } from 'react-router-dom';
import agentAPI from '../../services/agentAPI';

export default function AgentProfile() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { agent, loading } = useSelector(s => s.agentAuth);
  const [editMode, setEditMode] = useState(false);
  const [form,     setForm]     = useState({ name: agent?.name || '', phone: agent?.phone || '', city: agent?.city || '', state: agent?.state || '' });
  const [pwForm,   setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError,  setPwError]  = useState('');
  const [pwSuccess,setPwSuccess]= useState('');
  const [saving,   setSaving]   = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    const res = await dispatch(updateAgentProfile(form));
    setSaving(false);
    if (res.type.endsWith('/fulfilled')) setEditMode(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setPwError('Passwords do not match');
    }
    if (pwForm.newPassword.length < 6) {
      return setPwError('Password must be at least 6 characters');
    }
    setSaving(true);
    try {
      await agentAPI.put('/agent/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwSuccess('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      setPwError(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await dispatch(agentLogout());
    dispatch(clearAgentAuth());
    navigate('/agent/login');
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#111', marginBottom: '24px' }}>My Profile</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Profile info */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#111' }}>Personal Information</div>
            <button onClick={() => setEditMode(!editMode)}
              style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
              {editMode ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {!editMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                ['Name',        agent?.name],
                ['Agent Code',  agent?.agentCode],
                ['Email',       agent?.email],
                ['Phone',       agent?.phone],
                ['City',        agent?.city],
                ['State',       agent?.state],
                ['Territory',   agent?.territory?.name],
                ['Status',      agent?.status],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#9CA3AF', minWidth: '100px', flexShrink: 0 }}>{label}</span>
                  <span style={{ color: '#111', fontWeight: 500, textTransform: 'capitalize' }}>{value || '—'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Phone', key: 'phone', type: 'tel' },
                { label: 'City', key: 'city', type: 'text' },
                { label: 'State', key: 'state', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              ))}
              <button onClick={handleSaveProfile} disabled={loading || saving}
                style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: (loading || saving) ? 0.6 : 1 }}>
                {(loading || saving) ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Change password */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#111', marginBottom: '20px' }}>Change Password</div>

          {pwError && <div style={{ padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '13px', color: '#DC2626', marginBottom: '12px' }}>{pwError}</div>}
          {pwSuccess && <div style={{ padding: '10px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: '13px', color: '#166534', marginBottom: '12px' }}>{pwSuccess}</div>}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Current Password', key: 'currentPassword' },
              { label: 'New Password', key: 'newPassword' },
              { label: 'Confirm New Password', key: 'confirmPassword' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{f.label}</label>
                <input type="password" value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <button type="submit" disabled={saving}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#374151', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Logout */}
      <div style={{ marginTop: '20px', padding: '16px 20px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626' }}>Sign Out</div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>You will need your credentials to sign back in</div>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

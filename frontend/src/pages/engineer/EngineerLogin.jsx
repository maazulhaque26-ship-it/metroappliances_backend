import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiTool, FiMail, FiLock } from 'react-icons/fi';
import { engineerLogin } from '../../redux/slices/engineerAuthSlice';

export default function EngineerLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.engineerAuth);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(engineerLogin(form));
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/engineer/dashboard');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: '#059669', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FiTool size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Installation Engineer Portal</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Sign in to your engineer account</p>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
                style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 10, paddingBottom: 10, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 10, paddingBottom: 10, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', background: '#059669', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { agentLogin, clearAgentError } from '../../redux/slices/agentAuthSlice';

export default function SalesAgentLogin() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { token, loading, error } = useSelector(s => s.agentAuth);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (token) navigate('/agent/dashboard', { replace: true });
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAgentError());
    const res = await dispatch(agentLogin(form));
    if (res.type.endsWith('/fulfilled')) navigate('/agent/dashboard', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0C0C0C 0%, #1a1a2e 100%)', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#FF7A00', marginBottom: '8px' }}>Metro Appliances</div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111', marginBottom: '6px' }}>Sales Agent Portal</h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Sign in to your agent account</p>
        </div>

        {error && (
          <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="agent@metroappliances.com"
              required
              style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '13px', borderRadius: '10px', border: 'none', background: loading ? '#F3F4F6' : '#FF7A00', color: loading ? '#9CA3AF' : '#fff', fontSize: '14px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px', transition: 'all 0.15s' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', marginTop: '24px' }}>
          For account access, contact your administrator.
        </p>
      </div>
    </div>
  );
}

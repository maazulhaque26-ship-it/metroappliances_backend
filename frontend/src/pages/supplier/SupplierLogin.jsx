import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { supplierLogin } from '../../redux/slices/supplierAuthSlice';

export default function SupplierLogin() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { token, loading, error } = useSelector(s => s.supplierAuth);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (token) navigate('/supplier/dashboard', { replace: true });
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(supplierLogin(form));
    if (res.meta.requestStatus === 'fulfilled') navigate('/supplier/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#FF7A00' }}>
            <span className="text-white font-black text-lg">S</span>
          </div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Supplier Portal</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-4)' }}>Sign in to manage your orders and RFQs</p>
        </div>

        <div className="rounded-2xl p-6 shadow-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-4)' }}>Email Address</label>
              <input
                type="email" required autoFocus
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="supplier@company.com"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-4)' }}>Password</label>
              <input
                type="password" required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white mt-2 disabled:opacity-60"
              style={{ background: '#FF7A00' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

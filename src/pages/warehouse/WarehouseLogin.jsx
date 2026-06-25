import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { warehouseLogin, clearWarehouseError } from '../../redux/slices/warehouseAuthSlice';
import { FiPackage, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

export default function WarehouseLogin() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { token, loading, error } = useSelector(s => s.warehouseAuth);

  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { if (token) navigate('/warehouse/dashboard', { replace: true }); }, [token, navigate]);
  useEffect(() => { return () => dispatch(clearWarehouseError()); }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    dispatch(warehouseLogin(form));
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: '#FF7A00' }}>
            <FiPackage size={28} color="#fff" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)', fontFamily: 'Poppins, sans-serif' }}>
            Warehouse Portal
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-4)' }}>Sign in to your warehouse account</p>
        </div>

        <div className="rounded-2xl shadow-lg p-8" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-4)' }}>EMAIL ADDRESS</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-4)' }} />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="warehouse@metro.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-4)' }}>PASSWORD</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-4)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-4)' }}
                >
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-opacity"
              style={{ background: '#FF7A00' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-4)' }}>
          Warehouse staff only — contact your administrator for access
        </p>
      </div>
    </div>
  );
}

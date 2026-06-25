import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiEye, FiEyeOff, FiArrowRight, FiCheck, FiBriefcase } from 'react-icons/fi';
import Logo from '../../components/ui/Logo';
import dealerAPI from '../../services/dealerAPI';
import { clearDealerAuth } from '../../redux/slices/dealerAuthSlice';

const RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains a letter',     test: (p) => /[a-zA-Z]/.test(p) },
  { label: 'Contains a number',     test: (p) => /[0-9]/.test(p) },
];

export default function DealerResetPassword() {
  const { token }    = useParams();
  const navigate     = useNavigate();
  const dispatch     = useDispatch();

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm)  { setError('Passwords do not match'); return; }

    try {
      setLoading(true);
      await dealerAPI.put(`/dealer/auth/reset-password/${token}`, { password });
      dispatch(clearDealerAuth());
      setSuccess(true);
      setTimeout(() => navigate('/dealer/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link is invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Logo imageClass="h-10 w-auto" />
        </div>

        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ background: 'rgba(255,122,0,0.08)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}
        >
          <FiBriefcase size={11} /> Dealer Portal
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(22,163,74,0.1)', borderRadius: '50%' }}>
              <FiCheck size={24} style={{ color: '#16A34A' }} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.03em' }}>
              Password reset!
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Redirecting to sign in…</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.03em' }}>
              Set new password
            </h1>
            <p className="mb-8 text-sm" style={{ color: 'var(--text-3)' }}>Choose a strong password for your dealer account.</p>

            {error && (
              <div className="mb-5 px-4 py-3 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 'var(--radius-sm)', color: '#DC2626' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="At least 8 characters"
                    className="input pr-11"
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }}>
                    {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2 space-y-1">
                    {RULES.map(r => (
                      <div key={r.label} className="flex items-center gap-2 text-[11px] font-medium" style={{ color: r.test(password) ? '#16A34A' : 'var(--text-4)' }}>
                        <FiCheck size={10} /> {r.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(''); }}
                  placeholder="Repeat new password"
                  className="input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 text-white font-bold text-[12px] uppercase tracking-[0.1em]"
                style={{ background: 'var(--text)', borderRadius: 'var(--radius-sm)', opacity: loading ? 0.65 : 1 }}
              >
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Resetting…</> : <>Reset Password <FiArrowRight size={15} strokeWidth={2.5} /></>}
              </button>
            </form>

            <p className="text-center text-[13px] mt-6" style={{ color: 'var(--text-3)' }}>
              <Link to="/dealer/login" className="font-bold" style={{ color: 'var(--accent)' }}>Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

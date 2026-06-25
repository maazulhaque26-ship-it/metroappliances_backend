import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { dealerLogin, clearDealerError } from '../../redux/slices/dealerAuthSlice';
import { FiEye, FiEyeOff, FiArrowRight, FiMail, FiLock, FiBriefcase } from 'react-icons/fi';
import Logo from '../../components/ui/Logo';

export default function DealerLogin() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error, token } = useSelector(s => s.dealerAuth);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [formErr,  setFormErr]  = useState({});

  useEffect(() => {
    if (token) navigate('/dealer/dashboard', { replace: true });
  }, [token, navigate]);

  useEffect(() => () => dispatch(clearDealerError()), [dispatch]);

  const validate = () => {
    const e = {};
    if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (!password)                    e.password = 'Password is required';
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(dealerLogin({ email: email.toLowerCase().trim(), password }));
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>

      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14"
        style={{ background: 'var(--text)' }}
      >
        <Logo imageClass="h-10 w-auto brightness-0 invert" />
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ background: 'rgba(255,122,0,0.15)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}
          >
            <FiBriefcase size={11} /> Dealer Portal
          </div>
          <h2
            className="text-white leading-tight mb-6"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.03em' }}
          >
            Partner with<br />Metro Appliances.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.7 }}>
            Access your dealer dashboard, manage your account, and track approvals — all in one place.
          </p>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
          © {new Date().getFullYear()} Metro Appliances. B2B Dealer Portal.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:py-0 overflow-y-auto">
        <div className="lg:hidden mb-10 flex justify-center">
          <Logo imageClass="h-12 w-auto" />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{ background: 'rgba(255,122,0,0.08)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}
            >
              <FiBriefcase size={11} /> Dealer Portal
            </div>
            <h1
              className="text-3xl font-extrabold mb-2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.03em' }}
            >
              Sign in
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '15px' }}>
              Access your dealer account.
            </p>
          </div>

          {error && (
            <div
              className="mb-5 px-4 py-3 text-sm font-medium"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 'var(--radius-sm)', color: '#DC2626' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <FiMail size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} strokeWidth={2} />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFormErr(p => ({ ...p, email: '' })); }}
                  placeholder="dealer@business.com"
                  className={`input pl-10 ${formErr.email ? 'input-error' : ''}`}
                  autoComplete="email"
                />
              </div>
              {formErr.email && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErr.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label !mb-0">Password</label>
                <Link
                  to="/dealer/forgot-password"
                  className="text-[11px] font-semibold hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <FiLock size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} strokeWidth={2} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFormErr(p => ({ ...p, password: '' })); }}
                  placeholder="Your password"
                  className={`input pl-10 pr-11 ${formErr.password ? 'input-error' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-4)' }}
                >
                  {showPwd ? <FiEyeOff size={15} strokeWidth={2} /> : <FiEye size={15} strokeWidth={2} />}
                </button>
              </div>
              {formErr.password && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErr.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-4 text-white font-bold text-[12px] uppercase tracking-[0.1em] transition-all"
              style={{
                background: 'var(--text)',
                borderRadius: 'var(--radius-sm)',
                opacity: loading ? 0.65 : 1,
                fontFamily: 'var(--font-body)',
              }}
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
              ) : (
                <>Sign In <FiArrowRight size={15} strokeWidth={2.5} /></>
              )}
            </button>
          </form>

          <p className="text-center text-[13px] mt-7" style={{ color: 'var(--text-3)' }}>
            Not a dealer yet?{' '}
            <Link to="/dealer/register" className="font-bold transition-colors" style={{ color: 'var(--accent)' }}>
              Apply now
            </Link>
          </p>
          <p className="text-center text-[12px] mt-3" style={{ color: 'var(--text-4)' }}>
            <Link to="/" className="hover:underline">← Back to store</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

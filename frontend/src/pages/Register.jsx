import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../redux/slices/authSlice';
import { FiEye, FiEyeOff, FiArrowRight, FiUser, FiMail, FiLock, FiCheck } from 'react-icons/fi';
import Logo from '../components/ui/Logo';

const PASSWORD_RULES = [
  { label: 'At least 6 characters', test: (p) => p.length >= 6 },
  { label: 'Contains a letter',      test: (p) => /[a-zA-Z]/.test(p) },
  { label: 'Contains a number',      test: (p) => /[0-9]/.test(p) },
];

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector(s => s.auth);

  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [formErr, setFormErr] = useState({});

  useEffect(() => { if (token) navigate('/', { replace: true }); }, [token, navigate]);
  useEffect(() => { return () => dispatch(clearError()); }, [dispatch]);

  const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); setFormErr(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (!/\S+@\S+\.\S+/.test(form.email))          e.email = 'Enter a valid email address';
    if (form.password.length < 6)                  e.password = 'Password must be at least 6 characters';
    if (form.password !== confirm)                 e.confirm  = 'Passwords do not match';
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(register({ name: form.name.trim(), email: form.email.toLowerCase().trim(), password: form.password }));
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg)', fontFamily: 'var(--font-body)' }}
    >
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14"
        style={{ background: 'var(--text)' }}
      >
        <Logo imageClass="h-10 w-auto brightness-0 invert" />
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4"
            style={{ color: 'var(--accent)' }}
          >
            Join Metro
          </p>
          <h2
            className="text-white leading-tight mb-6"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.03em' }}
          >
            2 Lakh+ homes<br />trust Metro.
          </h2>
          <div className="space-y-3">
            {['Free shipping on orders over ₹1999', 'Premium warranty support', 'Easy returns & exchanges'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--accent)', borderRadius: '50%' }}
                >
                  <FiCheck size={10} strokeWidth={3} className="text-white" />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
          © {new Date().getFullYear()} Metro Appliances. All rights reserved.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:py-0 overflow-y-auto">
        <div className="lg:hidden mb-10 flex justify-center">
          <Logo imageClass="h-12 w-auto" />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1
              className="text-3xl font-extrabold mb-2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.03em' }}
            >
              Create account
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '15px' }}>
              Join 2 Lakh+ happy customers.
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
            {/* Name */}
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <FiUser size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} strokeWidth={2} />
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Your full name"
                  className={`input pl-10 ${formErr.name ? 'input-error' : ''}`}
                  required
                />
              </div>
              {formErr.name && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErr.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <FiMail size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} strokeWidth={2} />
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  className={`input pl-10 ${formErr.email ? 'input-error' : ''}`}
                  required
                  autoComplete="email"
                />
              </div>
              {formErr.email && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErr.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <FiLock size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} strokeWidth={2} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Create a strong password"
                  className={`input pl-10 pr-11 ${formErr.password ? 'input-error' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-4)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
                >
                  {showPwd ? <FiEyeOff size={15} strokeWidth={2} /> : <FiEye size={15} strokeWidth={2} />}
                </button>
              </div>
              {formErr.password && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErr.password}</p>}
              {form.password && (
                <div className="mt-2.5 space-y-1.5">
                  {PASSWORD_RULES.map(rule => {
                    const ok = rule.test(form.password);
                    return (
                      <div
                        key={rule.label}
                        className="flex items-center gap-2 text-[11px] font-medium"
                        style={{ color: ok ? '#16A34A' : 'var(--text-4)' }}
                      >
                        <FiCheck size={10} strokeWidth={ok ? 3 : 2} /> {rule.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <FiLock size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} strokeWidth={2} />
                <input
                  type="password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setFormErr(p => ({ ...p, confirm: '' })); }}
                  placeholder="Repeat your password"
                  className={`input pl-10 ${formErr.confirm ? 'input-error' : ''}`}
                  required
                />
              </div>
              {formErr.confirm && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErr.confirm}</p>}
            </div>

            {/* Terms */}
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-4)' }}>
              By creating an account you agree to our{' '}
              <Link to="/terms" style={{ color: 'var(--accent)' }} className="font-semibold hover:underline">Terms</Link> and{' '}
              <Link to="/privacy" style={{ color: 'var(--accent)' }} className="font-semibold hover:underline">Privacy Policy</Link>.
            </p>

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
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                <>Create Account <FiArrowRight size={15} strokeWidth={2.5} /></>
              )}
            </button>
          </form>

          <p className="text-center text-[13px] mt-7" style={{ color: 'var(--text-3)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-bold transition-colors" style={{ color: 'var(--accent)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

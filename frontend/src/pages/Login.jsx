import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../redux/slices/authSlice';
import { FiEye, FiEyeOff, FiArrowRight, FiLock, FiMail } from 'react-icons/fi';
import Logo from '../components/ui/Logo';
import API from '../services/api';

const DEFAULT_SLIDES = [
  {
    _id: 'd1',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=85',
    title: 'Premium Appliances',
    subtitle: 'Engineered for Modern Living',
  },
  {
    _id: 'd2',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85',
    title: 'Smart Technology',
    subtitle: 'Connect. Control. Conserve.',
  },
  {
    _id: 'd3',
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=85',
    title: 'Elegant Design',
    subtitle: 'Style Meets Performance',
  },
  {
    _id: 'd4',
    image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?w=900&q=85',
    title: 'Built for India',
    subtitle: 'Premium Quality, Trusted Brand',
  },
];

function LoginSliderPanel() {
  const [slides, setSlides]   = useState([]);
  const [idx, setIdx]         = useState(0);
  const intervalRef           = useRef(null);

  useEffect(() => {
    API.get('/login-slides')
      .then(res => {
        const data = res.data.slides;
        setSlides(data && data.length > 0 ? data : DEFAULT_SLIDES);
      })
      .catch(() => setSlides(DEFAULT_SLIDES));
  }, []);

  const active = slides.length > 0 ? slides : DEFAULT_SLIDES;

  useEffect(() => {
    if (active.length <= 1) return;
    intervalRef.current = setInterval(() => setIdx(i => (i + 1) % active.length), 5000);
    return () => clearInterval(intervalRef.current);
  }, [active.length]);

  return (
    <div className="relative hidden lg:block lg:w-1/2 overflow-hidden" style={{ minHeight: '100vh' }}>
      {/* Images — stacked, CSS opacity fade, no remount */}
      {active.map((s, i) => (
        <img
          key={s._id || i}
          src={s.image}
          alt={s.title || 'Metro Appliances'}
          loading={i === 0 ? 'eager' : 'lazy'}
          fetchpriority={i === 0 ? 'high' : 'low'}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{
            opacity: i === idx ? 1 : 0,
            transition: 'opacity 0.8s ease',
            willChange: 'opacity',
          }}
        />
      ))}

      {/* Premium dark overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.35) 100%)' }}
      />

      {/* Logo top-left */}
      <div className="absolute top-10 left-10 z-50">
        <Logo imageClass="h-10 w-auto object-contain" />
      </div>

      {/* Slide text bottom-left */}
      <div className="absolute bottom-12 left-10 right-10 z-50">
        {active.map((s, i) => (
          <div
            key={s._id || i}
            className="absolute bottom-0 left-0 right-0"
            style={{
              opacity: i === idx ? 1 : 0,
              transform: i === idx ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.8s ease, transform 0.8s ease',
              pointerEvents: i === idx ? 'auto' : 'none',
            }}
          >
            {s.title && (
              <p
                className="text-white text-2xl font-bold mb-1 leading-tight"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
              >
                {s.title}
              </p>
            )}
            {s.subtitle && (
              <p className="text-white/65 text-sm font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                {s.subtitle}
              </p>
            )}
          </div>
        ))}
        {/* empty spacer so the above absolutes have a height reference */}
        <div style={{ height: '3.5rem' }} />

        {/* Dots */}
        {active.length > 1 && (
          <div className="flex gap-2 mt-5">
            {active.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); clearInterval(intervalRef.current); intervalRef.current = setInterval(() => setIdx(j => (j + 1) % active.length), 5000); }}
                aria-label={`Slide ${i + 1}`}
                style={{
                  height: '2px',
                  width: i === idx ? '28px' : '14px',
                  background: i === idx ? '#ffffff' : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.35s ease',
                  borderRadius: '2px',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}

        {/* Copyright */}
        <p className="mt-6 text-white/25 text-[11px]">
          © {new Date().getFullYear()} Metro Appliances. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sp]     = useSearchParams();
  const { loading, error, token } = useSelector(s => s.auth);

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const redirect = sp.get('redirect') || '/';

  useEffect(() => { if (token) navigate(redirect, { replace: true }); }, [token, navigate, redirect]);
  useEffect(() => { return () => dispatch(clearError()); }, [dispatch]);

  const handleSubmit = (e) => { e.preventDefault(); dispatch(login(form)); };
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg)', fontFamily: 'var(--font-body)' }}
    >
      {/* Left panel — image slider */}
      <LoginSliderPanel />

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:py-0">
        {/* Logo — mobile only */}
        <div className="lg:hidden mb-10 flex justify-center">
          <Logo imageClass="h-12 w-auto object-contain" />
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h1
              className="text-3xl font-extrabold mb-2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.03em' }}
            >
              Welcome back
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '15px' }}>
              Sign in to your account to continue.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-5 px-4 py-3 text-sm font-medium"
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.18)',
                borderRadius: 'var(--radius-sm)',
                color: '#DC2626',
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="input pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="label mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold transition-colors"
                  style={{ color: 'var(--accent)' }}
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <FiLock size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} strokeWidth={2} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Your password"
                  className="input pl-10 pr-11"
                  required
                  autoComplete="current-password"
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
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-4 text-white font-bold text-[12px] uppercase tracking-[0.1em] transition-all mt-2"
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
                  Signing in…
                </>
              ) : (
                <>Sign In <FiArrowRight size={15} strokeWidth={2.5} /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[13px] mt-8" style={{ color: 'var(--text-3)' }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

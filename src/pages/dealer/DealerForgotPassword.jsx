import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowRight, FiCheck, FiBriefcase } from 'react-icons/fi';
import Logo from '../../components/ui/Logo';
import dealerAPI from '../../services/dealerAPI';

export default function DealerForgotPassword() {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    try {
      setLoading(true);
      await dealerAPI.post('/dealer/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
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

        {sent ? (
          <div className="text-center">
            <div
              className="w-14 h-14 flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(22,163,74,0.1)', borderRadius: '50%' }}
            >
              <FiCheck size={24} style={{ color: '#16A34A' }} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.03em' }}>
              Check your inbox
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--text-3)', lineHeight: 1.7 }}>
              If a dealer account exists for <strong>{email}</strong>, a password reset link has been sent.
            </p>
            <Link
              to="/dealer/login"
              className="font-bold text-sm hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1
              className="text-3xl font-extrabold mb-2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.03em' }}
            >
              Forgot password?
            </h1>
            <p className="mb-8 text-sm" style={{ color: 'var(--text-3)', lineHeight: 1.7 }}>
              Enter your dealer account email and we'll send you a reset link.
            </p>

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
                  <FiMail size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="dealer@business.com"
                    className="input pl-10"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 text-white font-bold text-[12px] uppercase tracking-[0.1em]"
                style={{ background: 'var(--text)', borderRadius: 'var(--radius-sm)', opacity: loading ? 0.65 : 1 }}
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                ) : (
                  <>Send Reset Link <FiArrowRight size={15} strokeWidth={2.5} /></>
                )}
              </button>
            </form>

            <p className="text-center text-[13px] mt-7" style={{ color: 'var(--text-3)' }}>
              Remember it?{' '}
              <Link to="/dealer/login" className="font-bold" style={{ color: 'var(--accent)' }}>Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initAnalytics } from '../../utils/analytics';
import { FiShield, FiX, FiChevronRight } from 'react-icons/fi';

const STORAGE_KEY = 'metro_cookie_consent';

function loadConsent() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
  catch { return null; }
}

function persistConsent(value) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

// Individual toggle row inside the preferences panel
function Toggle({ id, label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)', lineHeight: 1.5 }}>{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={`${label} cookies ${checked ? 'on' : 'off'}`}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="flex-shrink-0 mt-0.5 relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2"
        style={{
          background: checked ? 'var(--accent)' : 'var(--border)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          '--tw-ring-color': 'var(--accent)',
        }}
      >
        <span
          className="block w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-transform duration-200"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(4px)' }}
        />
      </button>
    </div>
  );
}

export function CookieConsent() {
  const [visible, setVisible]       = useState(false);
  const [showPrefs, setShowPrefs]   = useState(false);
  const [analytics, setAnalytics]   = useState(true);
  const [marketing, setMarketing]   = useState(true);
  const firstBtnRef                 = useRef(null);
  const modalRef                    = useRef(null);

  // On mount: check saved consent
  useEffect(() => {
    const saved = loadConsent();
    if (saved === null) {
      const t = setTimeout(() => {
        setVisible(true);
      }, 1200);
      return () => clearTimeout(t);
    }
    // Restore prefs
    if (saved === 'all' || saved?.analytics) initAnalytics();
    if (typeof saved === 'object' && saved !== null) {
      setAnalytics(saved.analytics ?? true);
      setMarketing(saved.marketing ?? true);
    }
  }, []);

  // Focus first button when banner appears
  useEffect(() => {
    if (visible && !showPrefs) firstBtnRef.current?.focus();
  }, [visible, showPrefs]);

  // Trap focus inside preferences modal
  useEffect(() => {
    if (!showPrefs || !modalRef.current) return;
    const el = modalRef.current;
    const focusable = el.querySelectorAll(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();

    const trap = (e) => {
      if (e.key !== 'Tab') return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    el.addEventListener('keydown', trap);
    return () => el.removeEventListener('keydown', trap);
  }, [showPrefs]);

  // Dismiss on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showPrefs) setShowPrefs(false);
        // Don't close banner on Escape — user must make a choice
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showPrefs]);

  const acceptAll = useCallback(() => {
    persistConsent('all');
    initAnalytics();
    setVisible(false);
    setShowPrefs(false);
  }, []);

  const rejectNonEssential = useCallback(() => {
    persistConsent({ analytics: false, marketing: false });
    setVisible(false);
    setShowPrefs(false);
  }, []);

  const savePreferences = useCallback(() => {
    persistConsent({ analytics, marketing });
    if (analytics) initAnalytics();
    setVisible(false);
    setShowPrefs(false);
  }, [analytics, marketing]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop when prefs panel is open */}
      {showPrefs && (
        <div
          className="fixed inset-0 z-[9997] bg-black/40 backdrop-blur-sm"
          onClick={() => setShowPrefs(false)}
          aria-hidden="true"
        />
      )}

      {/* Preferences panel */}
      {showPrefs && (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-prefs-title"
          className="fixed z-[9999] bottom-4 right-4 w-full max-w-sm shadow-2xl"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 id="cookie-prefs-title" className="font-extrabold text-base" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Cookie Preferences
            </h2>
            <button
              onClick={() => setShowPrefs(false)}
              className="p-1.5 -mr-1 rounded transition-colors"
              style={{ color: 'var(--text-4)' }}
              aria-label="Close preferences"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Toggles */}
          <div className="px-6">
            <Toggle
              id="essential"
              label="Essential"
              description="Authentication, cart, checkout, security. Cannot be disabled."
              checked={true}
              disabled={true}
              onChange={() => {}}
            />
            <Toggle
              id="analytics"
              label="Analytics"
              description="Google Analytics 4 and Microsoft Clarity — help us understand usage patterns."
              checked={analytics}
              disabled={false}
              onChange={setAnalytics}
            />
            <Toggle
              id="marketing"
              label="Marketing"
              description="Meta Pixel — personalised ads and conversion tracking."
              checked={marketing}
              disabled={false}
              onChange={setMarketing}
            />
          </div>

          {/* Actions */}
          <div className="p-6 pt-4 flex flex-col gap-2">
            <button
              onClick={savePreferences}
              className="w-full py-3 text-xs font-bold uppercase tracking-widest transition-colors"
              style={{ background: 'var(--text)', color: '#fff', borderRadius: 'var(--radius-sm)' }}
            >
              Save Preferences
            </button>
            <button
              onClick={acceptAll}
              className="w-full py-3 text-xs font-bold uppercase tracking-widest transition-colors"
              style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)' }}
            >
              Accept All
            </button>
          </div>
        </div>
      )}

      {/* Main consent banner */}
      {!showPrefs && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-banner-title"
          className="fixed bottom-0 left-0 right-0 z-[9998]"
          style={{ background: 'var(--card)', borderTop: '1px solid var(--border)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon + message */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <FiShield size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} aria-hidden="true" />
              <div>
                <p id="cookie-banner-title" className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  We use cookies
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)', lineHeight: 1.5 }}>
                  We use cookies to improve your experience, analyse traffic, and show relevant content.
                  By continuing, you agree to our use of cookies.{' '}
                  <button
                    onClick={() => setShowPrefs(true)}
                    className="underline font-bold focus:outline-none"
                    style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Manage preferences <FiChevronRight size={11} className="inline" />
                  </button>
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <button
                onClick={rejectNonEssential}
                className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors"
                style={{
                  border: '1.5px solid var(--border)',
                  color: 'var(--text-3)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
              >
                Reject
              </button>
              <button
                ref={firstBtnRef}
                onClick={acceptAll}
                className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors"
                style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)', border: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

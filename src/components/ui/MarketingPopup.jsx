import React, { useEffect, useState, useRef, useCallback } from 'react';
import { FiX, FiArrowRight } from 'react-icons/fi';
import API from '../../services/api';
import { toast } from 'react-toastify';

const SEEN_KEY = 'metro_popup_seen';

function getSeenRecord() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); }
  catch { return {}; }
}

function shouldShow(popup) {
  const seen = getSeenRecord();
  const id   = popup._id;
  if (popup.frequency === 'every_visit') return true;
  if (popup.frequency === 'once_per_day') {
    const last = seen[id];
    if (!last) return true;
    const diff = Date.now() - new Date(last).getTime();
    return diff > 86400000; // 24h
  }
  // 'once' — default
  return !seen[id];
}

function markSeen(id) {
  const rec = getSeenRecord();
  rec[id] = new Date().toISOString();
  localStorage.setItem(SEEN_KEY, JSON.stringify(rec));
}

export default function MarketingPopup() {
  const [popup,    setPopup]    = useState(null);
  const [visible,  setVisible]  = useState(false);
  const [email,    setEmail]    = useState('');
  const [sending,  setSending]  = useState(false);
  const timerRef               = useRef(null);
  const exitBound              = useRef(false);

  useEffect(() => {
    API.get('/popups')
      .then(r => {
        const popups = (r.data.popups || []).filter(shouldShow);
        if (!popups.length) return;
        const p = popups[0]; // highest priority

        if (p.type === 'exit_intent') {
          // Show on mouse-leave top of viewport
          const handler = (e) => {
            if (e.clientY < 20 && !exitBound.current) {
              exitBound.current = true;
              setPopup(p);
              setVisible(true);
            }
          };
          document.addEventListener('mouseleave', handler);
          return () => document.removeEventListener('mouseleave', handler);
        } else {
          // Show after delay
          timerRef.current = setTimeout(() => {
            setPopup(p);
            setVisible(true);
          }, (p.delaySeconds || 3) * 1000);
          return () => clearTimeout(timerRef.current);
        }
      })
      .catch(() => {});
  }, []);

  const close = useCallback(() => {
    if (popup) markSeen(popup._id);
    setVisible(false);
  }, [popup]);

  // Close on Escape
  useEffect(() => {
    if (!visible) return;
    const handler = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, close]);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    try {
      setSending(true);
      await API.post('/newsletter/subscribe', { email, source: 'popup' });
      toast.success('Subscribed! Welcome aboard.');
      close();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Already subscribed.');
    } finally { setSending(false); }
  };

  if (!visible || !popup) return null;

  const animationClass = {
    fade:     'animate-fade-in',
    slide_up: 'animate-slide-up',
    zoom:     'animate-zoom-in',
    flip:     'animate-flip-in',
  }[popup.animation] || 'animate-fade-in';

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
      role="dialog"
      aria-modal="true"
      aria-label={popup.title}
    >
      <div
        className={`relative w-full max-w-md overflow-hidden ${animationClass}`}
        style={{
          background: popup.bgColor || '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        }}
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 z-10 p-1.5 transition-colors"
          style={{ color: '#666', background: 'rgba(0,0,0,0.06)', borderRadius: '50%' }}
          aria-label="Close popup"
        >
          <FiX size={16} />
        </button>

        {/* Image */}
        {popup.image && (
          <div className="w-full h-44 overflow-hidden">
            <img src={popup.image} alt={popup.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="p-8">
          <h2
            className="font-extrabold mb-3"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '-0.025em', color: 'var(--text)' }}
          >
            {popup.title}
          </h2>
          {popup.description && (
            <p className="mb-5 text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>
              {popup.description}
            </p>
          )}

          {/* Newsletter form */}
          {popup.showNewsletter ? (
            <form onSubmit={handleNewsletter} className="flex flex-col gap-2.5">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="w-full px-4 py-3 text-sm outline-none"
                style={{
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-opacity"
                style={{
                  background: popup.btnColor || 'var(--accent)',
                  color: '#fff',
                  borderRadius: 'var(--radius-sm)',
                  opacity: sending ? 0.65 : 1,
                }}
              >
                {sending ? 'Subscribing…' : (popup.btnText || 'Subscribe')}
                <FiArrowRight size={13} />
              </button>
            </form>
          ) : popup.btnText && popup.btnLink ? (
            <a
              href={popup.btnLink}
              onClick={close}
              className="inline-flex items-center gap-2 px-6 py-3 font-bold text-[11px] uppercase tracking-widest transition-opacity"
              style={{
                background: popup.btnColor || 'var(--accent)',
                color: '#fff',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
              }}
            >
              {popup.btnText} <FiArrowRight size={13} />
            </a>
          ) : null}

          {/* Skip link */}
          <button
            onClick={close}
            className="mt-4 block w-full text-center text-[11px] font-medium transition-colors"
            style={{ color: 'var(--text-4)' }}
          >
            No thanks, continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}

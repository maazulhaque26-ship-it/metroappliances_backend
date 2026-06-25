import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiMail, FiPhone, FiMapPin, FiArrowRight,
  FiInstagram, FiTwitter, FiFacebook, FiYoutube, FiLinkedin,
  FiSend, FiMessageCircle,
} from 'react-icons/fi';
import API from '../../services/api';
import { toast } from 'react-toastify';
import Logo from '../ui/Logo';

// Fallback quick links used when settings.footerQuickLinks is empty
const DEFAULT_QUICK_LINKS = [
  { label: 'Home',      path: '/' },
  { label: 'Products',  path: '/shop' },
  { label: 'Deals',     path: '/deals' },
  { label: 'About',     path: '/about' },
  { label: 'Contact',   path: '/contact' },
  { label: 'My Orders', path: '/my-orders' },
];

const SOCIAL_CONFIG = [
  { key: 'instagram', icon: FiInstagram, label: 'Instagram' },
  { key: 'twitter',   icon: FiTwitter,   label: 'Twitter/X' },
  { key: 'facebook',  icon: FiFacebook,  label: 'Facebook' },
  { key: 'youtube',   icon: FiYoutube,   label: 'YouTube' },
  { key: 'linkedin',  icon: FiLinkedin,  label: 'LinkedIn' },
  { key: 'telegram',  icon: FiSend,      label: 'Telegram' },
  { key: 'whatsapp',  icon: FiMessageCircle, label: 'WhatsApp' },
];

export default function Footer() {
  const [email,   setEmail]   = useState('');
  const [sending, setSending] = useState(false);
  const settings = useSelector(s => s.settings.data);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) { toast.error('Enter a valid email'); return; }
    try {
      setSending(true);
      await API.post('/newsletter/subscribe', { email });
      toast.success('Welcome to Metro. You are now subscribed.');
      setEmail('');
    } catch (err) { toast.error(err.response?.data?.message || 'Already subscribed or try again.'); }
    finally { setSending(false); }
  };

  const quickLinks   = settings?.footerQuickLinks?.length   ? settings.footerQuickLinks   : DEFAULT_QUICK_LINKS;
  const supportLinks = settings?.footerSupportLinks || [];
  const policyLinks  = settings?.footerPolicyLinks  || [];
  const socialLinks  = SOCIAL_CONFIG.filter(s => settings?.[s.key]);

  return (
    <footer style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', fontFamily: 'var(--font-body)' }}>

      {/* ── Newsletter band ──────────────────────────────────────── */}
      <div style={{ background: 'var(--text)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-14">
          <div className="flex flex-col lg:flex-row items-center gap-8 justify-between">
            <div className="text-center lg:text-left max-w-md">
              <h3
                className="text-white font-extrabold mb-2"
                style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '-0.025em' }}
              >
                Stay ahead with {settings?.storeName || 'Metro'}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>
                {settings?.footerTagline || 'Exclusive launches, lifestyle tips and special pricing — delivered first.'}
              </p>
            </div>
            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                className="px-5 py-3.5 text-sm font-medium outline-none flex-1 sm:w-72"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-body)',
                }}
                required
              />
              <button
                type="submit"
                disabled={sending}
                className="px-7 py-3.5 font-bold text-[11px] uppercase tracking-widest transition-opacity whitespace-nowrap flex items-center justify-center gap-2"
                style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)', opacity: sending ? 0.65 : 1 }}
              >
                {sending ? '…' : 'Subscribe'} {!sending && <FiArrowRight size={13} strokeWidth={2.5} />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Main footer ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Brand column */}
          <div className="lg:col-span-1 space-y-5">
            <Logo imageClass="h-12 w-auto" className="inline-flex" />
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-3)' }}>
              {settings?.storeTagline || 'Premium home appliances engineered for modern Indian living.'}
            </p>
            <div className="space-y-2.5 pt-1">
              <a href={`mailto:${settings?.email || 'support@metroappliances.in'}`}
                className="flex items-center gap-3 text-[13px] font-medium transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
              >
                <FiMail size={14} strokeWidth={2} style={{ color: 'var(--text)', flexShrink: 0 }} />
                {settings?.email || 'support@metroappliances.in'}
              </a>
              {settings?.phone && (
                <a href={`tel:${settings.phone}`}
                  className="flex items-center gap-3 text-[13px] font-medium transition-colors"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                >
                  <FiPhone size={14} strokeWidth={2} style={{ color: 'var(--text)', flexShrink: 0 }} />
                  {settings.phone}
                </a>
              )}
              {(settings?.storeAddress || settings?.fullAddress) && (
                <div className="flex items-start gap-3 text-[13px] font-medium" style={{ color: 'var(--text-3)' }}>
                  <FiMapPin size={14} strokeWidth={2} style={{ color: 'var(--text)', flexShrink: 0, marginTop: '2px' }} />
                  <span className="leading-relaxed">{settings?.fullAddress || settings?.storeAddress}</span>
                </div>
              )}
            </div>

            {/* Dynamic Social links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3 pt-4 flex-wrap">
                {socialLinks.map(({ key, icon: Icon, label }) => (
                  <a
                    key={key}
                    href={settings[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-10 h-10 flex items-center justify-center transition-all"
                    style={{ border: '1.5px solid var(--border)', color: 'var(--text-3)', borderRadius: '50%' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--text)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <Icon size={15} strokeWidth={2} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-[11px] tracking-widest uppercase mb-5" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map(l => (
                <li key={l.label}>
                  <Link
                    to={l.path}
                    className="block text-[13px] font-medium transition-colors"
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          {supportLinks.length > 0 && (
            <div>
              <h4 className="font-bold text-[11px] tracking-widest uppercase mb-5" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                Support
              </h4>
              <ul className="space-y-3">
                {supportLinks.map(l => (
                  <li key={l.label}>
                    <Link
                      to={l.path}
                      className="block text-[13px] font-medium transition-colors"
                      style={{ color: 'var(--text-3)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Policies */}
          {policyLinks.length > 0 && (
            <div>
              <h4 className="font-bold text-[11px] tracking-widest uppercase mb-5" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                Policies
              </h4>
              <ul className="space-y-3">
                {policyLinks.map(l => (
                  <li key={l.label}>
                    <Link
                      to={l.path}
                      className="block text-[13px] font-medium transition-colors"
                      style={{ color: 'var(--text-3)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-center sm:justify-start">
          <p className="text-[12px] font-medium" style={{ color: 'var(--text-4)' }}>
            {settings?.copyrightText || `© ${new Date().getFullYear()} Metro Appliances. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}

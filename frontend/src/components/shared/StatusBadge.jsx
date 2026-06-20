import React from 'react';

const PRESETS = {
  active:      { bg: '#D1FAE5', color: '#065F46' },
  inactive:    { bg: '#F3F4F6', color: '#6B7280' },
  pending:     { bg: '#FEF3C7', color: '#92400E' },
  approved:    { bg: '#D1FAE5', color: '#065F46' },
  rejected:    { bg: '#FEE2E2', color: '#991B1B' },
  suspended:   { bg: '#FEE2E2', color: '#991B1B' },
  cancelled:   { bg: '#FEE2E2', color: '#991B1B' },
  delivered:   { bg: '#D1FAE5', color: '#065F46' },
  shipped:     { bg: '#DBEAFE', color: '#1E40AF' },
  processing:  { bg: '#EDE9FE', color: '#5B21B6' },
  won:         { bg: '#D1FAE5', color: '#065F46' },
  lost:        { bg: '#FEE2E2', color: '#991B1B' },
  qualified:   { bg: '#DBEAFE', color: '#1E40AF' },
  prospect:    { bg: '#F3F4F6', color: '#6B7280' },
  proposal:    { bg: '#FEF3C7', color: '#92400E' },
  negotiation: { bg: '#EDE9FE', color: '#5B21B6' },
  platinum:    { bg: '#F3F0FF', color: '#5B21B6' },
  gold:        { bg: '#FEF3C7', color: '#92400E' },
  silver:      { bg: '#F3F4F6', color: '#374151' },
  bronze:      { bg: '#FFF7ED', color: '#9A3412' },
  paid:        { bg: '#D1FAE5', color: '#065F46' },
  unpaid:      { bg: '#FEE2E2', color: '#991B1B' },
  partial:     { bg: '#FEF3C7', color: '#92400E' },
  low:         { bg: '#F3F4F6', color: '#6B7280' },
  medium:      { bg: '#DBEAFE', color: '#1E40AF' },
  high:        { bg: '#FEF3C7', color: '#92400E' },
  urgent:      { bg: '#FEE2E2', color: '#991B1B' },
  'super_admin': { bg: '#EDE9FE', color: '#5B21B6' },
  admin:         { bg: '#DBEAFE', color: '#1E40AF' },
  moderator:     { bg: '#D1FAE5', color: '#065F46' },
  user:          { bg: '#F3F4F6', color: '#6B7280' },
};

export default function StatusBadge({ status, label, size = 'sm' }) {
  const key  = (status || '').toLowerCase();
  const conf = PRESETS[key] || { bg: '#F3F4F6', color: '#6B7280' };
  const text = label || status || '—';

  const pad = size === 'lg' ? '5px 14px' : '3px 10px';
  const fs  = size === 'lg' ? '12px' : '10px';

  return (
    <span style={{
      display: 'inline-block',
      padding: pad,
      borderRadius: '20px',
      background: conf.bg,
      color: conf.color,
      fontSize: fs,
      fontWeight: 700,
      textTransform: 'capitalize',
      letterSpacing: '0.02em',
      fontFamily: 'var(--font-body, Poppins, sans-serif)',
      whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  );
}

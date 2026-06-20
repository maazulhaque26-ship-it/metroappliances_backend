import React from 'react';

export default function SectionHeader({ title, subtitle, actions, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', fontFamily: 'var(--font-body, Poppins, sans-serif)', ...style }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

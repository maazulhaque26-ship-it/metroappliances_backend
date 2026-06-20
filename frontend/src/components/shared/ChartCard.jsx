import React from 'react';

export default function ChartCard({ title, subtitle, children, actions, style }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '20px', fontFamily: 'var(--font-body, Poppins, sans-serif)', ...style }}>
      {(title || actions) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            {title && <div style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>{title}</div>}
            {subtitle && <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{subtitle}</div>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

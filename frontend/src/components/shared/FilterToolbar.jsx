import React from 'react';

export default function FilterToolbar({ filters, value, onChange, style }) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', ...style }}>
      {filters.map(f => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          style={{
            padding: '7px 14px',
            borderRadius: '20px',
            border: 'none',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-body, Poppins, sans-serif)',
            background: value === f.value ? '#FF7A00' : '#F3F4F6',
            color:      value === f.value ? '#fff'    : '#374151',
            transition: 'all 0.15s',
          }}
        >
          {f.label}
          {f.count != null && (
            <span style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.8 }}>({f.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

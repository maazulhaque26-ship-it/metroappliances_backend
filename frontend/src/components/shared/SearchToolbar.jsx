import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

export default function SearchToolbar({ value, onChange, placeholder = 'Search…', style }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', ...style }}>
      <FiSearch size={14} style={{ position: 'absolute', left: '10px', color: '#9CA3AF', pointerEvents: 'none' }} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '8px 32px 8px 32px',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          fontSize: '13px',
          outline: 'none',
          background: '#fff',
          fontFamily: 'var(--font-body, Poppins, sans-serif)',
          color: '#374151',
          width: '240px',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = '#FF7A00'; }}
        onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}
        >
          <FiX size={13} />
        </button>
      )}
    </div>
  );
}

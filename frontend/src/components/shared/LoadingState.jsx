import React from 'react';

export default function LoadingState({ message = 'Loading…', rows = 5, style }) {
  return (
    <div style={{ padding: '32px 24px', ...style }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F3F4F6', flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ height: '12px', borderRadius: '4px', background: '#F3F4F6', width: `${60 + (i % 3) * 15}%`, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
            <div style={{ height: '10px', borderRadius: '4px', background: '#F3F4F6', width: `${30 + (i % 2) * 20}%`, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1 + 0.05}s` }} />
          </div>
          <div style={{ width: '60px', height: '26px', borderRadius: '20px', background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      {message && <div style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', paddingTop: '8px', fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>{message}</div>}
    </div>
  );
}

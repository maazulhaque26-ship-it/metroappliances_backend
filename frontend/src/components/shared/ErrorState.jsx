import React from 'react';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

export default function ErrorState({ message = 'Something went wrong', onRetry, style }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', ...style }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#FEE2E2', marginBottom: '16px' }}>
        <FiAlertCircle size={24} style={{ color: '#EF4444' }} />
      </div>
      <div style={{ fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>Failed to load</div>
      <div style={{ fontSize: '13px', color: '#9CA3AF', maxWidth: '320px', margin: '0 auto 20px', lineHeight: 1.6 }}>{message}</div>
      {onRetry && (
        <button onClick={onRetry} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151', fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>
          <FiRefreshCw size={13} /> Retry
        </button>
      )}
    </div>
  );
}

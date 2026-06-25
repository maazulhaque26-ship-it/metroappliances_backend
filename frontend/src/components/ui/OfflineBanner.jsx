import React from 'react';
import { FiWifiOff, FiRefreshCw } from 'react-icons/fi';
import { useOffline } from '../../hooks/useOffline';

export default function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
      background: '#1F2937', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
      padding: '12px 20px', fontSize: '13px', fontWeight: 600,
      fontFamily: 'var(--font-body, Poppins, sans-serif)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    }}>
      <FiWifiOff size={14} />
      You are offline — some features may be unavailable.
      <button
        onClick={() => window.location.reload()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
      >
        <FiRefreshCw size={11} /> Retry
      </button>
    </div>
  );
}

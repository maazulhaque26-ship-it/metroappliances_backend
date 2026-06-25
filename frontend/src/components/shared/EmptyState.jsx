import React from 'react';
import { FiInbox } from 'react-icons/fi';

export default function EmptyState({ icon: Icon = FiInbox, title = 'No data found', message, action, style }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', ...style }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#F3F4F6', marginBottom: '16px' }}>
        <Icon size={24} style={{ color: '#9CA3AF' }} />
      </div>
      <div style={{ fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>{title}</div>
      {message && <div style={{ fontSize: '13px', color: '#9CA3AF', maxWidth: '320px', margin: '0 auto', lineHeight: 1.6 }}>{message}</div>}
      {action && <div style={{ marginTop: '20px' }}>{action}</div>}
    </div>
  );
}

import React from 'react';
import { FiCircle } from 'react-icons/fi';

function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Timeline({ events = [], style }) {
  if (!events.length) return (
    <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#9CA3AF' }}>No activity yet</div>
  );

  return (
    <div style={{ fontFamily: 'var(--font-body, Poppins, sans-serif)', ...style }}>
      {events.map((ev, i) => {
        const Icon = ev.icon || FiCircle;
        return (
          <div key={ev._id || i} style={{ display: 'flex', gap: '14px', paddingBottom: i < events.length - 1 ? '20px' : 0, position: 'relative' }}>
            {i < events.length - 1 && (
              <div style={{ position: 'absolute', left: '17px', top: '36px', bottom: 0, width: '1px', background: '#E5E7EB' }} />
            )}
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: ev.color ? `${ev.color}20` : '#F3F4F6', border: `2px solid ${ev.color || '#E5E7EB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
              <Icon size={14} style={{ color: ev.color || '#9CA3AF' }} />
            </div>
            <div style={{ paddingTop: '6px', flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '2px' }}>{ev.title}</div>
              {ev.description && <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px', lineHeight: 1.5 }}>{ev.description}</div>}
              {ev.meta && (
                <div style={{ fontSize: '11px', color: '#9CA3AF', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {ev.meta.map((m, mi) => <span key={mi}>{m}</span>)}
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>{fmtDate(ev.timestamp || ev.createdAt)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

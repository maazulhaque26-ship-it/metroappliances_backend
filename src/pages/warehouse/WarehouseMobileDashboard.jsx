import React, { useEffect, useState } from 'react';
import WarehouseLayout from './WarehouseLayout';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiCamera, FiArrowDown, FiArrowUp, FiPackage, FiSearch, FiRepeat, FiRotateCcw, FiClipboard } from 'react-icons/fi';

const ACTIONS = [
  { label: 'Scan',         icon: FiCamera,      path: '/warehouse/mobile/scan',      color: '#FF7A00', desc: 'Scan any barcode or QR' },
  { label: 'Receive',      icon: FiArrowDown,   path: '/warehouse/receiving',         color: '#10B981', desc: 'Inbound shipments' },
  { label: 'Putaway',      icon: FiArrowUp,     path: '/warehouse/mobile/putaway',   color: '#6366F1', desc: 'Smart bin assignment' },
  { label: 'Bin Lookup',   icon: FiSearch,      path: '/warehouse/mobile/bin-lookup',color: '#F59E0B', desc: 'Find bin or product' },
  { label: 'Picking',      icon: FiClipboard,   path: '/warehouse/picking',          color: '#3B82F6', desc: 'Fulfil pick lists' },
  { label: 'Transfer',     icon: FiRepeat,      path: '/warehouse/transfers',        color: '#14B8A6', desc: 'Move between bins' },
  { label: 'Returns',      icon: FiRotateCcw,   path: '/warehouse/mobile/returns',   color: '#EC4899', desc: 'Process returns' },
  { label: 'Packing',      icon: FiPackage,     path: '/warehouse/packing',          color: '#8B5CF6', desc: 'Pack orders' },
];

function ActionButton({ label, icon: Icon, path, color, desc, navigate }) {
  return (
    <button onClick={() => navigate(path)}
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px 16px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: 'transform 0.1s, border-color 0.15s', WebkitTapHighlightColor: 'transparent' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'scale(1.03)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'scale(1)'; }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{label}</p>
        <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>{desc}</p>
      </div>
    </button>
  );
}

export default function WarehouseMobileDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/warehouse/dashboard-stats').then(r => setStats(r.data.data)).catch(() => {});
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <WarehouseLayout>
      <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>{greeting}</p>
          <h1 style={{ fontFamily: 'Poppins', fontSize: '24px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
            Warehouse<br />Operations
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-5)', marginTop: '4px' }}>{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
        </div>

        {/* Quick stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '28px' }}>
            {[
              { label: 'Pending Picks', value: stats.pendingPicks ?? 0, color: '#FF7A00' },
              { label: 'Low Stock',     value: stats.lowStockCount ?? 0, color: '#EF4444' },
              { label: 'Open Transfers',value: stats.openTransfers ?? 0, color: '#6366F1' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 12px', textAlign: 'center' }}>
                <p style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ fontSize: '10px', color: 'var(--text-4)', marginTop: '3px', lineHeight: 1.3 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick scan CTA */}
        <button onClick={() => navigate('/warehouse/mobile/scan')}
          style={{ width: '100%', padding: '18px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '28px', letterSpacing: '0.01em' }}>
          <FiCamera size={22} /> Scan Now
        </button>

        {/* Action grid */}
        <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: '14px' }}>Operations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {ACTIONS.map(a => <ActionButton key={a.label} {...a} navigate={navigate} />)}
        </div>
      </div>
    </WarehouseLayout>
  );
}

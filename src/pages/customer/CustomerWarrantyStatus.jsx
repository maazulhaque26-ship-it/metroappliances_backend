import React, { useEffect, useState } from 'react';
import { FiShield, FiSearch, FiCalendar, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import api from '../../services/api';

export default function CustomerWarrantyStatus() {
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serial, setSerial] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');

  useEffect(() => {
    api.get('/service/warranty')
      .then(r => setWarranties(r.data.data?.warranties || r.data.warranties || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const checkSerial = async () => {
    if (!serial.trim()) return;
    setChecking(true);
    setCheckError('');
    setCheckResult(null);
    try {
      const r = await api.get(`/service/warranty/check/${serial.trim()}`);
      setCheckResult(r.data.data || r.data);
    } catch (err) {
      setCheckError(err.response?.data?.message || 'Unable to check warranty status.');
    } finally {
      setChecking(false);
    }
  };

  const isExpiringSoon = (endDate) => {
    const diff = new Date(endDate) - new Date();
    return diff > 0 && diff < 30 * 86400000;
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Warranty Status</h1>
          <p style={{ fontSize: 14, color: 'var(--text-4)' }}>View all your active warranties and check coverage by serial number.</p>
        </div>

        {/* Serial Number Check */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Quick Warranty Check</h3>
          <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 16 }}>Enter your product serial number to instantly verify warranty coverage.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={serial}
              onChange={e => setSerial(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkSerial()}
              placeholder="Enter serial number..."
              style={{
                flex: 1, padding: '11px 16px', borderRadius: 10, fontSize: 14,
                border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none',
              }}
            />
            <button onClick={checkSerial} disabled={checking || !serial.trim()} style={{
              padding: '11px 22px', background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, opacity: !serial.trim() ? 0.6 : 1,
            }}>
              <FiSearch size={14} /> {checking ? 'Checking...' : 'Check'}
            </button>
          </div>

          {checkError && (
            <div style={{ marginTop: 14, padding: '12px 16px', background: '#FEF2F2', borderRadius: 8, fontSize: 13, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiAlertCircle size={14} /> {checkError}
            </div>
          )}

          {checkResult && (
            <div style={{ marginTop: 16, padding: '16px 20px', borderRadius: 12, border: '1px solid', borderColor: checkResult.hasActiveWarranty ? '#BBF7D0' : '#FCA5A5', background: checkResult.hasActiveWarranty ? '#F0FDF4' : '#FEF2F2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: checkResult.hasActiveWarranty ? 10 : 0 }}>
                {checkResult.hasActiveWarranty
                  ? <FiCheckCircle size={18} style={{ color: '#16A34A' }} />
                  : <FiAlertCircle size={18} style={{ color: '#DC2626' }} />}
                <span style={{ fontWeight: 700, fontSize: 14, color: checkResult.hasActiveWarranty ? '#16A34A' : '#DC2626' }}>
                  {checkResult.hasActiveWarranty ? 'Active Warranty Found' : 'No Active Warranty'}
                </span>
              </div>
              {checkResult.activeWarranty && (
                <div style={{ fontSize: 12, color: '#065F46', paddingLeft: 28, lineHeight: 2 }}>
                  <div><b>Type:</b> {checkResult.activeWarranty.warrantyType}</div>
                  <div><b>Valid Until:</b> {new Date(checkResult.activeWarranty.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <div><b>Warranty #:</b> {checkResult.activeWarranty.warrantyNumber}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* My Warranties */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>My Warranties</h2>
        {loading ? (
          <LoadingState message="Loading your warranties..." />
        ) : !warranties.length ? (
          <EmptyState
            icon={<FiShield size={40} />}
            title="No warranties registered"
            description="Your product warranties will appear here once registered."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {warranties.map(w => (
              <div key={w._id} style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 22,
                borderLeft: `4px solid ${w.status === 'active' ? '#10B981' : w.status === 'expired' ? '#EF4444' : '#6B7280'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{w.warrantyNumber}</span>
                      <StatusBadge status={w.status} size="sm" />
                      {isExpiringSoon(w.endDate) && w.status === 'active' && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#FEF3C7', color: '#92400E' }}>EXPIRES SOON</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 6 }}>
                      {w.productName || 'Product'} · SN: {w.serialNumber}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-4)', display: 'flex', gap: 16 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiCalendar size={11} />
                        {new Date(w.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} —
                        {new Date(w.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </span>
                      <span style={{ textTransform: 'capitalize' }}>{w.warrantyType?.replace(/_/g, ' ')} warranty</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-4)' }}>
                    <div>Claims: {w.claimsUsed} {w.maxClaims > 0 ? `/ ${w.maxClaims}` : ''}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

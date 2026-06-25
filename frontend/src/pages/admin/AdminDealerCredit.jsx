import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const CREDIT_STATUS_COLORS = { none: '#9CA3AF', active: '#10B981', expired: '#EF4444', hold: '#F59E0B', suspended: '#EF4444' };

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#111' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function fmt(n) { return `₹${(n || 0).toLocaleString('en-IN')}`; }

export default function AdminDealerCredit() {
  const [credits,  setCredits]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({ creditLimit: '', creditExpiry: '', reason: '' });
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/dealer-finance/credits');
      setCredits(data.credits || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = (type, dealer, current) => {
    setModal({ type, dealer, current });
    if (type === 'set') {
      setForm({ creditLimit: current?.creditLimit || '', creditExpiry: current?.creditExpiry ? current.creditExpiry.slice(0, 10) : '', reason: '' });
    } else {
      setForm({ creditLimit: '', creditExpiry: '', reason: '' });
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const dealerId = modal.dealer._id;
      if (modal.type === 'set') {
        if (!form.creditLimit || isNaN(form.creditLimit)) return alert('Enter valid credit limit');
        await api.post(`/admin/dealer-finance/credits/${dealerId}/set`, { creditLimit: Number(form.creditLimit), creditExpiry: form.creditExpiry || undefined, reason: form.reason });
      } else if (modal.type === 'hold') {
        await api.post(`/admin/dealer-finance/credits/${dealerId}/hold`, { reason: form.reason });
      } else if (modal.type === 'release') {
        await api.post(`/admin/dealer-finance/credits/${dealerId}/release`, { reason: form.reason });
      }
      setModal(null);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: '0 0 4px' }}>Dealer Credit Limits</h2>
        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Set, hold, or release credit limits for dealers</div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Dealer', 'Code', 'Limit', 'Used', 'Available', 'Status', 'Expiry', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {credits.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No dealers found</td></tr>
              ) : credits.map(c => {
                const statusColor = CREDIT_STATUS_COLORS[c.creditStatus] || '#9CA3AF';
                return (
                  <tr key={c._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#111' }}>{c.dealer?.businessName || '—'}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#9CA3AF' }}>{c.dealer?.dealerCode || '—'}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#8B5CF6' }}>{fmt(c.creditLimit)}</td>
                    <td style={{ padding: '12px 14px', color: '#EF4444' }}>{fmt(c.usedCredit)}</td>
                    <td style={{ padding: '12px 14px', color: '#10B981', fontWeight: 700 }}>{fmt(c.remainingCredit)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: statusColor + '1A', color: statusColor, textTransform: 'capitalize' }}>
                        {c.creditStatus}
                      </span>
                      {c.isOnHold && <span style={{ fontSize: '10px', color: '#EF4444', display: 'block', marginTop: '2px' }}>🔒 On Hold</span>}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>
                      {c.creditExpiry ? new Date(c.creditExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button onClick={() => openModal('set', c.dealer, c)}
                          style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '11px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Set Limit</button>
                        {!c.isOnHold ? (
                          <button onClick={() => openModal('hold', c.dealer, c)}
                            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', fontSize: '11px', fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}>Hold</button>
                        ) : (
                          <button onClick={() => openModal('release', c.dealer, c)}
                            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #BBF7D0', background: '#F0FDF4', fontSize: '11px', fontWeight: 600, color: '#166534', cursor: 'pointer' }}>Release</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title={modal.type === 'set' ? `Set Credit — ${modal.dealer?.businessName}` : modal.type === 'hold' ? `Hold Credit — ${modal.dealer?.businessName}` : `Release Credit — ${modal.dealer?.businessName}`}
          onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {modal.type === 'set' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Credit Limit (₹) *</label>
                  <input type="number" value={form.creditLimit} onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value }))} placeholder="0"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Expiry Date (optional)</label>
                  <input type="date" value={form.creditExpiry} onChange={e => setForm(f => ({ ...f, creditExpiry: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{modal.type === 'hold' ? 'Hold Reason *' : 'Reason / Notes'}</label>
              <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} placeholder="Reason…"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleSubmit} disabled={saving}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: modal.type === 'release' ? '#10B981' : modal.type === 'hold' ? '#EF4444' : '#FF7A00', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : `Confirm ${modal.type.charAt(0).toUpperCase() + modal.type.slice(1)}`}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

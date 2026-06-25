import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

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

const TYPE_COLORS = { credit: '#10B981', debit: '#EF4444' };
const CAT_ICONS   = { order: '📦', payment: '💳', refund: '↩', wallet_topup: '⬆', wallet_deduct: '⬇', credit_note: '📝', adjustment: '⚙', invoice_charge: '🧾', reversal: '🔄' };

export default function AdminDealerWallet() {
  const [wallets,    setWallets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [txEntries,  setTxEntries]  = useState([]);
  const [txLoading,  setTxLoading]  = useState(false);
  const [txPage,     setTxPage]     = useState(1);
  const [txTotal,    setTxTotal]    = useState(1);
  const [form,       setForm]       = useState({ amount: '', reason: '', method: '' });
  const [saving,     setSaving]     = useState(false);

  const loadWallets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/dealer-finance/wallets');
      setWallets(data.wallets || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadWallets(); }, [loadWallets]);

  const openHistory = async (dealer) => {
    setModal({ type: 'history', dealer });
    setTxPage(1);
    setTxLoading(true);
    try {
      const { data } = await api.get(`/admin/dealer-finance/ledger/${dealer._id}?page=1&limit=15`);
      setTxEntries(data.entries || []);
      setTxTotal(data.pagination?.totalPages || 1);
    } catch { /* ignore */ }
    finally { setTxLoading(false); }
  };

  const loadMoreTx = async (dealer, page) => {
    setTxLoading(true);
    try {
      const { data } = await api.get(`/admin/dealer-finance/ledger/${dealer._id}?page=${page}&limit=15`);
      setTxEntries(data.entries || []);
      setTxTotal(data.pagination?.totalPages || 1);
    } catch { /* ignore */ }
    finally { setTxLoading(false); }
  };

  const handleWalletAction = async () => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return alert('Enter a valid amount');
    setSaving(true);
    try {
      const endpoint = `/admin/dealer-finance/wallets/${modal.dealer._id}/${modal.type}`;
      await api.post(endpoint, { amount: Number(form.amount), reason: form.reason, method: form.method || undefined });
      setModal(null);
      setForm({ amount: '', reason: '', method: '' });
      loadWallets();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: 0 }}>Dealer Wallets</h2>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>Manage wallet balances and top-ups</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Dealer', 'Code', 'Available', 'Total', 'Blocked', 'Pending', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wallets.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No dealer wallets found</td></tr>
              ) : wallets.map(w => (
                <tr key={w._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#111' }}>{w.dealer?.businessName || '—'}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#9CA3AF' }}>{w.dealer?.dealerCode || '—'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#10B981' }}>₹{(w.availableBalance || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 14px', color: '#374151' }}>₹{(w.totalBalance || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 14px', color: '#F59E0B' }}>₹{(w.blockedBalance || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 14px', color: '#8B5CF6' }}>₹{(w.pendingSettlement || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button onClick={() => { setModal({ type: 'topup', dealer: w.dealer }); setForm({ amount: '', reason: '', method: '' }); }}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #BBF7D0', background: '#F0FDF4', fontSize: '11px', fontWeight: 600, color: '#166534', cursor: 'pointer' }}>Top-up</button>
                      <button onClick={() => { setModal({ type: 'deduct', dealer: w.dealer }); setForm({ amount: '', reason: '', method: '' }); }}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', fontSize: '11px', fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}>Deduct</button>
                      <button onClick={() => openHistory(w.dealer)}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '11px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>History</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (modal.type === 'topup' || modal.type === 'deduct') && (
        <Modal title={modal.type === 'topup' ? `Top-up — ${modal.dealer?.businessName}` : `Deduct — ${modal.dealer?.businessName}`} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            {modal.type === 'topup' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Method</label>
                <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                  <option value="">Select method</option>
                  {['bank_transfer','cheque','upi','neft','rtgs','cash'].map(m => <option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Reason / Notes</label>
              <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} placeholder="Reason for this transaction…"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleWalletAction} disabled={saving}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: modal.type === 'topup' ? '#10B981' : '#EF4444', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Processing…' : modal.type === 'topup' ? 'Confirm Top-up' : 'Confirm Deduct'}
            </button>
          </div>
        </Modal>
      )}

      {modal?.type === 'history' && (
        <Modal title={`Ledger — ${modal.dealer?.businessName}`} onClose={() => setModal(null)}>
          {txLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
          ) : txEntries.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>No transactions</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {txEntries.map(e => (
                <div key={e._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>
                  <span style={{ fontSize: '14px' }}>{CAT_ICONS[e.category] || '🔹'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {e.entryNumber}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: TYPE_COLORS[e.type] || '#111' }}>
                      {e.type === 'credit' ? '+' : '−'}₹{e.amount?.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF' }}>Bal: ₹{e.runningBalance?.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
              {txTotal > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', paddingTop: '8px' }}>
                  <button onClick={() => { const p = Math.max(1, txPage - 1); setTxPage(p); loadMoreTx(modal.dealer, p); }} disabled={txPage <= 1} style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', opacity: txPage <= 1 ? 0.4 : 1 }}>←</button>
                  <span style={{ fontSize: '11px', color: '#9CA3AF', padding: '5px 0' }}>Page {txPage} of {txTotal}</span>
                  <button onClick={() => { const p = Math.min(txTotal, txPage + 1); setTxPage(p); loadMoreTx(modal.dealer, p); }} disabled={txPage >= txTotal} style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', opacity: txPage >= txTotal ? 0.4 : 1 }}>→</button>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

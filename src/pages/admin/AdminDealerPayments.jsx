import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const STATUS_COLORS = { pending: '#F59E0B', verified: '#10B981', failed: '#EF4444', reversed: '#6B7280' };
const TYPE_ICONS    = { payment: '💳', refund: '↩', adjustment: '⚙', credit_note: '📝', wallet_topup: '⬆' };
const METHOD_LABELS = { bank_transfer: 'Bank Transfer', cheque: 'Cheque', upi: 'UPI', neft: 'NEFT', rtgs: 'RTGS', cash: 'Cash', wallet: 'Wallet', other: 'Other' };

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#111' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminDealerPayments() {
  const [payments,   setPayments]   = useState([]);
  const [dealers,    setDealers]    = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState({ dealer: '', amount: '', type: 'payment', method: 'bank_transfer', referenceNumber: '', remarks: '' });
  const [actionNote, setActionNote] = useState('');
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filterStatus) params.set('status', filterStatus);
      const { data } = await api.get(`/admin/dealer-finance/payments?${params}`);
      setPayments(data.payments || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, filterStatus]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/admin/dealers?limit=200').then(r => setDealers(r.data.dealers || [])).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.dealer || !form.amount) return alert('Dealer and amount required');
    setSaving(true);
    try {
      await api.post('/admin/dealer-finance/payments', { ...form, amount: Number(form.amount) });
      setModal(null);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleAction = async () => {
    setSaving(true);
    try {
      const endpoint = modal.type === 'verify'
        ? `/admin/dealer-finance/payments/${modal.payment._id}/verify`
        : `/admin/dealer-finance/payments/${modal.payment._id}/reject`;
      await api.post(endpoint, { notes: actionNote });
      setModal(null);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: '0 0 4px' }}>Dealer Payments</h2>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Record and verify dealer payments</div>
        </div>
        <button onClick={() => { setModal('create'); setForm({ dealer: '', amount: '', type: 'payment', method: 'bank_transfer', referenceNumber: '', remarks: '' }); }}
          style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          + Record Payment
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[['', 'All'], ['pending', 'Pending'], ['verified', 'Verified'], ['failed', 'Failed'], ['reversed', 'Reversed']].map(([v, l]) => (
          <button key={v} onClick={() => { setFilterStatus(v); setPage(1); }}
            style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: filterStatus === v ? '#FF7A00' : '#F3F4F6', color: filterStatus === v ? '#fff' : '#374151' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Payment #', 'Dealer', 'Date', 'Type', 'Method', 'Amount', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading…</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No payments found</td></tr>
            ) : payments.map(p => (
              <tr key={p._id} style={{ borderBottom: '1px solid #E5E7EB', background: p.status === 'pending' ? '#FFFBEB' : undefined }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#FF7A00', fontWeight: 700 }}>{p.paymentNumber}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#111' }}>{p.dealer?.businessName || '—'}</td>
                <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td style={{ padding: '12px 14px', color: '#374151' }}>
                  {TYPE_ICONS[p.type] || '💰'} {p.type?.replace(/_/g, ' ')}
                </td>
                <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>
                  {METHOD_LABELS[p.method] || p.method}
                  {p.referenceNumber && <div style={{ fontSize: '10px' }}>Ref: {p.referenceNumber}</div>}
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 800, color: '#111' }}>₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLORS[p.status] || '#6B7280') + '1A', color: STATUS_COLORS[p.status] || '#6B7280', textTransform: 'capitalize' }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {p.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => { setModal({ type: 'verify', payment: p }); setActionNote(''); }}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #BBF7D0', background: '#F0FDF4', fontSize: '11px', fontWeight: 600, color: '#166534', cursor: 'pointer' }}>Verify</button>
                      <button onClick={() => { setModal({ type: 'reject', payment: p }); setActionNote(''); }}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', fontSize: '11px', fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}>Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.totalPages > 1 && !loading && (
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '12px', opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Page {page} of {pagination.totalPages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '12px', opacity: page >= pagination.totalPages ? 0.4 : 1 }}>Next →</button>
          </div>
        )}
      </div>

      {modal === 'create' && (
        <Modal title="Record Payment" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Dealer *', field: 'dealer', type: 'select', options: [{ value: '', label: 'Select dealer…' }, ...dealers.map(d => ({ value: d._id, label: `${d.businessName} (${d.dealerCode})` }))] },
              { label: 'Amount (₹) *', field: 'amount', type: 'number', placeholder: '0' },
              { label: 'Type', field: 'type', type: 'select', options: ['payment','refund','adjustment','credit_note','wallet_topup'].map(v => ({ value: v, label: v.replace(/_/g,' ') })) },
              { label: 'Method', field: 'method', type: 'select', options: Object.entries(METHOD_LABELS).map(([v, l]) => ({ value: v, label: l })) },
              { label: 'Reference #', field: 'referenceNumber', type: 'text', placeholder: 'UTR / Cheque no.' },
              { label: 'Remarks', field: 'remarks', type: 'textarea' },
            ].map(f => (
              <div key={f.field}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{f.label}</label>
                {f.type === 'select' ? (
                  <select value={form[f.field]} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea value={form[f.field]} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))} rows={2}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
                ) : (
                  <input type={f.type} value={form[f.field]} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
                )}
              </div>
            ))}
            <button onClick={handleCreate} disabled={saving}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Record Payment'}
            </button>
          </div>
        </Modal>
      )}

      {modal?.type && (modal.type === 'verify' || modal.type === 'reject') && (
        <Modal title={`${modal.type === 'verify' ? 'Verify' : 'Reject'} — ${modal.payment.paymentNumber}`} onClose={() => setModal(null)}>
          <div style={{ marginBottom: '12px', padding: '12px', background: '#F9FAFB', borderRadius: '8px', fontSize: '13px' }}>
            <div><strong>Amount:</strong> ₹{modal.payment.amount?.toLocaleString('en-IN')}</div>
            <div><strong>Method:</strong> {METHOD_LABELS[modal.payment.method] || modal.payment.method}</div>
            {modal.payment.referenceNumber && <div><strong>Ref:</strong> {modal.payment.referenceNumber}</div>}
          </div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Notes</label>
          <textarea value={actionNote} onChange={e => setActionNote(e.target.value)} rows={3}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '14px' }} />
          <button onClick={handleAction} disabled={saving}
            style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: modal.type === 'verify' ? '#10B981' : '#EF4444', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1, width: '100%' }}>
            {saving ? 'Processing…' : modal.type === 'verify' ? 'Verify Payment' : 'Reject Payment'}
          </button>
        </Modal>
      )}
    </div>
  );
}

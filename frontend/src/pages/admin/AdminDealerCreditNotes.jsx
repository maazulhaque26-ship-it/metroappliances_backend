import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const STATUS_COLORS = { pending: '#F59E0B', approved: '#3B82F6', applied: '#10B981', rejected: '#EF4444' };
const TYPE_LABELS   = { return: 'Return', overcharge: 'Overcharge', quality: 'Quality', admin_discretion: 'Admin', other: 'Other' };

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

export default function AdminDealerCreditNotes() {
  const [notes,      setNotes]      = useState([]);
  const [dealers,    setDealers]    = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState({ dealer: '', amount: '', type: 'admin_discretion', reason: '' });
  const [actionNote, setActionNote] = useState('');
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filterStatus) params.set('status', filterStatus);
      const { data } = await api.get(`/admin/dealer-finance/credit-notes?${params}`);
      setNotes(data.creditNotes || []);
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
      await api.post('/admin/dealer-finance/credit-notes', { ...form, amount: Number(form.amount) });
      setModal(null);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleAction = async () => {
    setSaving(true);
    try {
      const id = modal.note._id;
      const endpoints = {
        approve: `/admin/dealer-finance/credit-notes/${id}/approve`,
        apply:   `/admin/dealer-finance/credit-notes/${id}/apply`,
        reject:  `/admin/dealer-finance/credit-notes/${id}/reject`,
      };
      await api.post(endpoints[modal.type], { notes: actionNote });
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
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: '0 0 4px' }}>Dealer Credit Notes</h2>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Create and manage credit notes for dealers</div>
        </div>
        <button onClick={() => { setModal('create'); setForm({ dealer: '', amount: '', type: 'admin_discretion', reason: '' }); }}
          style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          + Create Credit Note
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[['', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['applied', 'Applied'], ['rejected', 'Rejected']].map(([v, l]) => (
          <button key={v} onClick={() => { setFilterStatus(v); setPage(1); }}
            style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: filterStatus === v ? '#FF7A00' : '#F3F4F6', color: filterStatus === v ? '#fff' : '#374151' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '680px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['CN #', 'Dealer', 'Date', 'Type', 'Amount', 'Status', 'Reason', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading…</td></tr>
            ) : notes.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No credit notes found</td></tr>
            ) : notes.map(n => (
              <tr key={n._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#FF7A00', fontWeight: 700 }}>{n.creditNoteNumber}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#111' }}>{n.dealer?.businessName || '—'}</td>
                <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td style={{ padding: '12px 14px', color: '#374151', fontSize: '12px' }}>{TYPE_LABELS[n.type] || n.type}</td>
                <td style={{ padding: '12px 14px', fontWeight: 800, color: '#10B981' }}>+₹{(n.amount || 0).toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLORS[n.status] || '#6B7280') + '1A', color: STATUS_COLORS[n.status] || '#6B7280', textTransform: 'capitalize' }}>
                    {n.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.reason || '—'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {n.status === 'pending' && (
                      <>
                        <button onClick={() => { setModal({ type: 'approve', note: n }); setActionNote(''); }}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #BFDBFE', background: '#EFF6FF', fontSize: '10px', fontWeight: 600, color: '#1D4ED8', cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => { setModal({ type: 'reject', note: n }); setActionNote(''); }}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', fontSize: '10px', fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}>Reject</button>
                      </>
                    )}
                    {n.status === 'approved' && (
                      <button onClick={() => { setModal({ type: 'apply', note: n }); setActionNote(''); }}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #BBF7D0', background: '#F0FDF4', fontSize: '10px', fontWeight: 600, color: '#166534', cursor: 'pointer' }}>Apply</button>
                    )}
                  </div>
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
        <Modal title="Create Credit Note" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Dealer *</label>
              <select value={form.dealer} onChange={e => setForm(f => ({ ...f, dealer: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                <option value="">Select dealer…</option>
                {dealers.map(d => <option key={d._id} value={d._id}>{d.businessName} ({d.dealerCode})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Reason</label>
              <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleCreate} disabled={saving}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Creating…' : 'Create Credit Note'}
            </button>
          </div>
        </Modal>
      )}

      {modal?.type && ['approve','apply','reject'].includes(modal.type) && (
        <Modal title={`${modal.type.charAt(0).toUpperCase() + modal.type.slice(1)} — ${modal.note.creditNoteNumber}`} onClose={() => setModal(null)}>
          <div style={{ marginBottom: '12px', padding: '12px', background: '#F9FAFB', borderRadius: '8px', fontSize: '13px' }}>
            <div><strong>Dealer:</strong> {modal.note.dealer?.businessName}</div>
            <div><strong>Amount:</strong> +₹{modal.note.amount?.toLocaleString('en-IN')}</div>
            <div><strong>Type:</strong> {TYPE_LABELS[modal.note.type] || modal.note.type}</div>
            {modal.note.reason && <div><strong>Reason:</strong> {modal.note.reason}</div>}
          </div>
          {modal.type === 'apply' && (
            <div style={{ padding: '10px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: '12px', color: '#166534', marginBottom: '12px' }}>
              Applying this note will create a ledger credit entry and notify the dealer.
            </div>
          )}
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Notes</label>
          <textarea value={actionNote} onChange={e => setActionNote(e.target.value)} rows={3}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '14px' }} />
          <button onClick={handleAction} disabled={saving}
            style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: modal.type === 'reject' ? '#EF4444' : modal.type === 'apply' ? '#10B981' : '#3B82F6', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1, width: '100%' }}>
            {saving ? 'Processing…' : `${modal.type.charAt(0).toUpperCase() + modal.type.slice(1)} Credit Note`}
          </button>
        </Modal>
      )}
    </div>
  );
}

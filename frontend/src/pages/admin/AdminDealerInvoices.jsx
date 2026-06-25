import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const STATUS_COLORS = { draft: '#9CA3AF', issued: '#3B82F6', paid: '#10B981', partially_paid: '#F59E0B', overdue: '#EF4444', cancelled: '#6B7280' };
const STATUS_LABELS = { draft: 'Draft', issued: 'Issued', paid: 'Paid', partially_paid: 'Part Paid', overdue: 'Overdue', cancelled: 'Cancelled' };

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#111' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminDealerInvoices() {
  const [invoices,   setInvoices]   = useState([]);
  const [dealers,    setDealers]    = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [search,       setSearch]       = useState('');
  const [modal,       setModal]     = useState(null);
  const [form,        setForm]      = useState({ dealer: '', orderReference: '', dueDate: '', notes: '' });
  const [statusForm,  setStatusForm] = useState({ status: '', notes: '' });
  const [saving,      setSaving]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filterStatus) params.set('status', filterStatus);
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/dealer-finance/invoices?${params}`);
      setInvoices(data.invoices || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, filterStatus, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/admin/dealers?limit=200').then(r => setDealers(r.data.dealers || [])).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.dealer) return alert('Select a dealer');
    setSaving(true);
    try {
      await api.post('/admin/dealer-finance/invoices', { dealer: form.dealer, orderReference: form.orderReference, dueDate: form.dueDate || undefined, notes: form.notes });
      setModal(null);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleStatusUpdate = async () => {
    if (!statusForm.status) return alert('Select a status');
    setSaving(true);
    try {
      await api.put(`/admin/dealer-finance/invoices/${modal.invoice._id}/status`, { status: statusForm.status, notes: statusForm.notes });
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
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: '0 0 4px' }}>Dealer Invoices</h2>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Manage GST invoices for dealers</div>
        </div>
        <button onClick={() => { setModal('create'); setForm({ dealer: '', orderReference: '', dueDate: '', notes: '' }); }}
          style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          + Create Invoice
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search invoice #, dealer…"
          style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', background: '#fff' }} />
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
          <option value="">All Status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Invoice #', 'Dealer', 'Date', 'Grand Total', 'Status', 'Due Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading…</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No invoices found</td></tr>
            ) : invoices.map(inv => (
              <tr key={inv._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#FF7A00', fontWeight: 700 }}>{inv.invoiceNumber}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#111' }}>{inv.dealer?.businessName || '—'}</td>
                <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#111' }}>₹{(inv.grandTotal || 0).toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLORS[inv.status] || '#6B7280') + '1A', color: STATUS_COLORS[inv.status] || '#6B7280' }}>
                    {STATUS_LABELS[inv.status] || inv.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: inv.status === 'overdue' ? '#EF4444' : '#9CA3AF', fontSize: '12px', fontWeight: inv.status === 'overdue' ? 700 : 400 }}>
                  {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => { setModal({ type: 'status', invoice: inv }); setStatusForm({ status: inv.status, notes: '' }); }}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '11px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                    Update Status
                  </button>
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
        <Modal title="Create Invoice" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Dealer *</label>
              <select value={form.dealer} onChange={e => setForm(f => ({ ...f, dealer: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                <option value="">Select dealer…</option>
                {dealers.map(d => <option key={d._id} value={d._id}>{d.businessName} ({d.dealerCode})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Order Reference</label>
              <input value={form.orderReference} onChange={e => setForm(f => ({ ...f, orderReference: e.target.value }))} placeholder="MTR-DO-…"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleCreate} disabled={saving}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Creating…' : 'Create Invoice'}
            </button>
          </div>
        </Modal>
      )}

      {modal?.type === 'status' && (
        <Modal title={`Update Status — ${modal.invoice.invoiceNumber}`} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Status *</label>
              <select value={statusForm.status} onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Notes</label>
              <textarea value={statusForm.notes} onChange={e => setStatusForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleStatusUpdate} disabled={saving}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Update Status'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

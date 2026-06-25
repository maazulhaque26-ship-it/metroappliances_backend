import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import api from '../../services/api';

const STATUS_COLORS = {
  pending:    '#F59E0B',
  confirmed:  '#3B82F6',
  processing: '#8B5CF6',
  shipped:    '#06B6D4',
  delivered:  '#10B981',
  cancelled:  '#EF4444',
};

const ALL_STATUSES = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminDealerOrders() {
  const [orders,      setOrders]     = useState([]);
  const [pagination,  setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,     setLoading]    = useState(true);
  const [status,      setStatus]     = useState('');
  const [search,      setSearch]     = useState('');
  const [page,        setPage]       = useState(1);
  const [selected,    setSelected]   = useState([]);
  const [toast,       setToast]      = useState('');
  const [statusModal, setStatusModal] = useState(null); // { order }
  const [statusForm,  setStatusForm]  = useState({ status: '', trackingNumber: '', trackingUrl: '', adminNotes: '' });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/dealer-orders?${params}`);
      setOrders(data.orders || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    const pendingIds = orders.filter(o => o.requiresApproval && !o.isApproved).map(o => o._id);
    if (selected.length === pendingIds.length) setSelected([]);
    else setSelected(pendingIds);
  };

  const handleBulkApprove = async () => {
    if (!selected.length) return;
    try {
      const { data } = await api.post('/admin/dealer-orders/bulk-approve', { orderIds: selected });
      showToast(data.message);
      setSelected([]);
      load();
    } catch {
      showToast('Bulk approve failed');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/dealer-orders/${id}/approve`);
      showToast('Order approved');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Approve failed');
    }
  };

  const openStatusModal = (order) => {
    setStatusForm({ status: order.status, trackingNumber: order.trackingNumber || '', trackingUrl: order.trackingUrl || '', adminNotes: order.adminNotes || '' });
    setStatusModal({ order });
  };

  const handleUpdateStatus = async () => {
    try {
      await api.put(`/admin/dealer-orders/${statusModal.order._id}/status`, statusForm);
      showToast('Status updated');
      setStatusModal(null);
      load();
    } catch {
      showToast('Failed to update status');
    }
  };

  const pendingApprovalCount = orders.filter(o => o.requiresApproval && !o.isApproved).length;

  return (
    <AdminLayout>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: '#111', color: '#fff', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>{toast}</div>
      )}

      {statusModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--card,#fff)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text,#111)' }}>Update Order Status</div>
              <button onClick={() => setStatusModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-4,#9CA3AF)' }}>×</button>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)', marginBottom: '16px' }}>{statusModal.order.orderNumber} · {statusModal.order.dealer?.businessName}</div>
            {[
              { key: 'status', label: 'Status', type: 'select', options: ALL_STATUSES.slice(1) },
              { key: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'e.g. 1234567890' },
              { key: 'trackingUrl', label: 'Tracking URL', type: 'text', placeholder: 'https://...' },
              { key: 'adminNotes', label: 'Admin Notes', type: 'textarea' },
            ].map(({ key, label, type, options, placeholder }) => (
              <div key={key} style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-4,#9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>{label}</label>
                {type === 'select' ? (
                  <select value={statusForm[key]} onChange={e => setStatusForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px' }}>
                    {options.map(o => <option key={o} value={o} style={{ textTransform: 'capitalize' }}>{o}</option>)}
                  </select>
                ) : type === 'textarea' ? (
                  <textarea value={statusForm[key]} onChange={e => setStatusForm(f => ({ ...f, [key]: e.target.value }))}
                    rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                ) : (
                  <input type="text" value={statusForm[key]} placeholder={placeholder} onChange={e => setStatusForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', boxSizing: 'border-box' }} />
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => setStatusModal(null)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border,#E5E7EB)', borderRadius: '8px', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleUpdateStatus} style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '8px', background: 'var(--accent,#FF7A00)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Update Status</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text,#111)', margin: '0 0 4px' }}>Dealer Orders</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>{pagination.total} total orders</div>
        </div>
        {selected.length > 0 && (
          <button onClick={handleBulkApprove}
            style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            ✓ Approve Selected ({selected.length})
          </button>
        )}
      </div>

      {pendingApprovalCount > 0 && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
          <span>⏳</span>
          <span style={{ color: '#92400E', fontWeight: 600 }}>{pendingApprovalCount} order{pendingApprovalCount !== 1 ? 's' : ''} awaiting approval on this page</span>
          <button onClick={handleBulkApprove}
            style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: '7px', border: 'none', background: '#F59E0B', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            Approve All
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by order number…"
          style={{ flex: '1', minWidth: '200px', padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)', color: 'var(--text,#111)' }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              style={{ padding: '7px 12px', borderRadius: '100px', border: '1px solid', borderColor: status === s ? (STATUS_COLORS[s] || 'var(--accent,#FF7A00)') : 'var(--border,#E5E7EB)', background: status === s ? (STATUS_COLORS[s] || 'var(--accent,#FF7A00)') + '1A' : 'var(--card,#fff)', color: status === s ? (STATUS_COLORS[s] || 'var(--accent,#FF7A00)') : 'var(--text-2,#374151)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-4,#9CA3AF)' }}>Loading…</div>
      ) : (
        <>
          <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', overflow: 'auto', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg,#F9FAFB)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-4,#9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border,#E5E7EB)', width: '32px' }}>
                    <input type="checkbox" onChange={toggleAll} checked={selected.length > 0 && selected.length === orders.filter(o => o.requiresApproval && !o.isApproved).length} />
                  </th>
                  {['Order #', 'Dealer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-4,#9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border,#E5E7EB)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>No orders found</td></tr>
                ) : orders.map(order => (
                  <tr key={order._id} style={{ borderBottom: '1px solid var(--border,#E5E7EB)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      {order.requiresApproval && !order.isApproved && (
                        <input type="checkbox" checked={selected.includes(order._id)} onChange={() => toggleSelect(order._id)} />
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text,#111)', whiteSpace: 'nowrap' }}>
                      {order.orderNumber}
                      {order.requiresApproval && !order.isApproved && (
                        <span style={{ display: 'block', fontSize: '10px', color: '#F59E0B', fontWeight: 700 }}>⏳ Needs Approval</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text,#111)' }}>{order.dealer?.businessName || '—'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)' }}>{order.dealer?.dealerCode}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-4,#9CA3AF)' }}>{order.items?.length}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent,#FF7A00)' }}>₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '100px', background: (STATUS_COLORS[order.status] || '#6B7280') + '1A', color: STATUS_COLORS[order.status] || '#6B7280', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize' }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-4,#9CA3AF)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                        <button onClick={() => openStatusModal(order)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--text,#111)', whiteSpace: 'nowrap' }}>Update</button>
                        {order.requiresApproval && !order.isApproved && (
                          <button onClick={() => handleApprove(order._id)} style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#DCFCE7', color: '#16A34A', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>Approve</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ padding: '7px 16px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '13px', opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>Page {page} of {pagination.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                style={{ padding: '7px 16px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '13px', opacity: page >= pagination.totalPages ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}

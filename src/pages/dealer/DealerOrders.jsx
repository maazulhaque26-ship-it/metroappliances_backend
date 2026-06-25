import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DealerLayout from '../../components/dealer/DealerLayout';
import dealerAPI from '../../services/dealerAPI';

const STATUS_COLORS = {
  pending:    '#F59E0B',
  confirmed:  '#3B82F6',
  processing: '#8B5CF6',
  shipped:    '#06B6D4',
  delivered:  '#10B981',
  cancelled:  '#EF4444',
};

const STATUSES = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function DealerOrders() {
  const [orders,      setOrders]     = useState([]);
  const [pagination,  setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,     setLoading]    = useState(true);
  const [status,      setStatus]     = useState('');
  const [search,      setSearch]     = useState('');
  const [page,        setPage]       = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const { data } = await dealerAPI.get(`/dealer/orders?${params}`);
      setOrders(data.orders || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <DealerLayout>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text,#111)', margin: '0 0 4px' }}>My Orders</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>{pagination.total} total orders</div>
        </div>
        <Link to="/dealer/products" style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--accent,#FF7A00)', color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>New Order</Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by order number…"
          style={{ flex: '1', minWidth: '200px', padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)', color: 'var(--text,#111)' }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              style={{
                padding: '7px 14px', borderRadius: '100px', border: '1px solid',
                borderColor: status === s ? (STATUS_COLORS[s] || 'var(--accent,#FF7A00)') : 'var(--border,#E5E7EB)',
                background:  status === s ? (STATUS_COLORS[s] || 'var(--accent,#FF7A00)') + '1A' : 'var(--card,#fff)',
                color:       status === s ? (STATUS_COLORS[s] || 'var(--accent,#FF7A00)') : 'var(--text-2,#374151)',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1,2,3,4].map(i => <div key={i} style={{ background: 'var(--border,#E5E7EB)', borderRadius: '10px', height: '80px' }} />)}
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-4,#9CA3AF)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '6px' }}>No orders found</div>
          <div style={{ fontSize: '13px', marginBottom: '20px' }}>Place your first order from the dealer catalog</div>
          <Link to="/dealer/products" style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--accent,#FF7A00)', color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>Browse Catalog</Link>
        </div>
      ) : (
        <>
          <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
            {orders.map((order, idx) => (
              <Link key={order._id} to={`/dealer/orders/${order._id}`} style={{
                display: 'flex', alignItems: 'center', padding: '16px 20px', textDecoration: 'none',
                borderBottom: idx < orders.length - 1 ? '1px solid var(--border,#E5E7EB)' : 'none',
                transition: 'background 0.15s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg,#F9FAFB)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)' }}>{order.orderNumber}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)', marginTop: '3px' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                    {order.trackingNumber && ` · Tracking: ${order.trackingNumber}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent,#FF7A00)', marginBottom: '4px' }}>₹{order.totalAmount?.toLocaleString('en-IN')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: STATUS_COLORS[order.status] || '#6B7280', textTransform: 'capitalize' }}>{order.status}</span>
                    {order.requiresApproval && !order.isApproved && (
                      <span style={{ fontSize: '10px', background: '#FFF7ED', color: '#F59E0B', padding: '2px 6px', borderRadius: '100px', fontWeight: 700 }}>Needs Approval</span>
                    )}
                  </div>
                </div>
                <span style={{ marginLeft: '16px', fontSize: '16px', color: 'var(--text-4,#9CA3AF)' }}>›</span>
              </Link>
            ))}
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
    </DealerLayout>
  );
}

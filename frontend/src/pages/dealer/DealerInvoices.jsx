import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DealerLayout from '../../components/dealer/DealerLayout';
import dealerAPI from '../../services/dealerAPI';

const STATUS_COLORS = { draft: '#9CA3AF', issued: '#3B82F6', paid: '#10B981', partially_paid: '#F59E0B', overdue: '#EF4444', cancelled: '#6B7280' };
const STATUS_LABELS = { draft: 'Draft', issued: 'Issued', paid: 'Paid', partially_paid: 'Part Paid', overdue: 'Overdue', cancelled: 'Cancelled' };

export default function DealerInvoices() {
  const [invoices,   setInvoices]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const { data } = await dealerAPI.get(`/dealer/finance/invoices?${params}`);
      setInvoices(data.invoices || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <DealerLayout>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text,#111)', margin: '0 0 4px' }}>GST Invoices</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>All invoices raised on your account</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search invoice #, order #…"
          style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)' }}
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)' }}>
          <option value="">All Status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--card,#fff)', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '640px' }}>
          <thead>
            <tr style={{ background: 'var(--bg,#F9FAFB)' }}>
              {['Invoice #', 'Date', 'Order Ref', 'Amount', 'Status', 'Due Date', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-4,#9CA3AF)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border,#E5E7EB)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>Loading…</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>🧾</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '4px' }}>No invoices yet</div>
                <div style={{ fontSize: '12px' }}>Invoices will appear here once raised by admin</div>
              </td></tr>
            ) : invoices.map(inv => (
              <tr key={inv._id} style={{ borderBottom: '1px solid var(--border,#E5E7EB)' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--accent,#FF7A00)', fontWeight: 700 }}>{inv.invoiceNumber}</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-4,#9CA3AF)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-4,#9CA3AF)', fontSize: '12px' }}>
                  {inv.dealerOrder?.orderNumber || inv.orderReference || '—'}
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text,#111)', whiteSpace: 'nowrap' }}>
                  ₹{(inv.grandTotal || 0).toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLORS[inv.status] || '#6B7280') + '1A', color: STATUS_COLORS[inv.status] || '#6B7280' }}>
                    {STATUS_LABELS[inv.status] || inv.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: inv.status === 'overdue' ? '#EF4444' : 'var(--text-4,#9CA3AF)', fontSize: '12px', fontWeight: inv.status === 'overdue' ? 700 : 400 }}>
                  {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <Link to={`/dealer/finance/invoices/${inv._id}`} style={{ fontSize: '12px', color: 'var(--accent,#FF7A00)', textDecoration: 'none', fontWeight: 600 }}>View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.totalPages > 1 && !loading && (
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '12px', opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
            <span style={{ fontSize: '12px', color: 'var(--text-4,#9CA3AF)' }}>Page {page} of {pagination.totalPages} · {pagination.total} invoices</span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '12px', opacity: page >= pagination.totalPages ? 0.4 : 1 }}>Next →</button>
          </div>
        )}
      </div>
    </DealerLayout>
  );
}

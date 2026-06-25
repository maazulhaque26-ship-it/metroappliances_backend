import React, { useEffect, useState, useCallback } from 'react';
import { FiSearch, FiFilter, FiEye } from 'react-icons/fi';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Pagination from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import api from '../../services/api';
import { usePagination } from '../../hooks/usePagination';
import { useFilters } from '../../hooks/useFilters';

const STATUSES = ['open','verified','warranty_check','assigned','accepted','travelling','reached','diagnosis','repair','testing','awaiting_confirmation','completed','closed','escalated','cancelled'];
const PRIORITIES = ['low','medium','high','urgent'];

export default function AdminServiceRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { page, setPage, total, setTotal, limit } = usePagination();
  const { filters, setFilter, toParams } = useFilters({ status: '', priority: '' });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit, ...toParams() });
    if (search) params.set('search', search);
    api.get(`/admin/service/requests?${params}`)
      .then(r => { setItems(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, limit, search, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { key: 'ticketNumber', header: 'Ticket #', render: r => <span style={{ fontWeight: 600, color: '#3B82F6' }}>{r.ticketNumber}</span> },
    { key: 'customer', header: 'Customer', render: r => <div><div style={{ fontWeight: 600 }}>{r.customer?.name}</div><div style={{ fontSize: 11, color: '#6B7280' }}>{r.customer?.phone}</div></div> },
    { key: 'category', header: 'Category', render: r => r.category },
    { key: 'priority', header: 'Priority', render: r => <StatusBadge status={r.priority} /> },
    { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'tech', header: 'Technician', render: r => r.assignedTechnician?.name || <span style={{ color: '#9CA3AF' }}>Unassigned</span> },
    { key: 'created', header: 'Raised', render: r => new Date(r.createdAt).toLocaleDateString('en-IN') },
    {
      key: 'actions', header: '', render: r => (
        <a href={`/admin/service/requests/${r._id}`} style={{ color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <FiEye size={13} /> View
        </a>
      )
    },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#111827' }}>Service Requests</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search ticket, serial, product..."
            style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 36, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select value={filters.status} onChange={e => { setFilter('status', e.target.value); setPage(1); }}
          style={{ height: 36, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, padding: '0 12px' }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filters.priority} onChange={e => { setFilter('priority', e.target.value); setPage(1); }}
          style={{ height: 36, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, padding: '0 12px' }}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={items} loading={loading} rowKey="_id" emptyTitle="No service requests" emptyMessage="No requests match your filters" />
      <div style={{ marginTop: 16 }}>
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiSearch, FiCheck, FiSlash } from 'react-icons/fi';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Pagination from '../../components/shared/Pagination';
import MetricCard from '../../components/shared/MetricCard';
import api from '../../services/api';
import { usePagination } from '../../hooks/usePagination';

const WARRANTY_TYPES = ['manufacturer','extended','dealer','amc'];

export default function AdminWarranty() {
  const [tab, setTab] = useState('warranty');
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [amcStats, setAmcStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const { page, setPage, total, setTotal, limit } = usePagination();

  const load = useCallback(() => {
    setLoading(true);
    const endpoint = tab === 'warranty' ? '/admin/warranty' : '/admin/amc';
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter && tab === 'warranty') params.set('warrantyType', typeFilter);
    api.get(`${endpoint}?${params}`)
      .then(r => { setItems(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab, page, limit, search, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/admin/warranty/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/admin/amc/stats').then(r => setAmcStats(r.data)).catch(() => {});
  }, []);

  const handleActivate = async (id) => {
    const endpoint = tab === 'warranty' ? `/admin/warranty/${id}/activate` : `/admin/amc/${id}/activate`;
    await api.put(endpoint);
    load();
  };

  const handleVoid = async (id) => {
    if (!window.confirm('Void this warranty?')) return;
    await api.put(`/admin/warranty/${id}/void`);
    load();
  };

  const warrantyColumns = [
    { key: 'warrantyNumber', header: 'Warranty #', render: r => <span style={{ fontWeight: 600, color: '#3B82F6' }}>{r.warrantyNumber}</span> },
    { key: 'customer', header: 'Customer', render: r => r.customer?.name || '—' },
    { key: 'product', header: 'Product', render: r => r.product?.name || '—' },
    { key: 'serial', header: 'Serial', render: r => r.serialNumber || '—' },
    { key: 'type', header: 'Type', render: r => <StatusBadge status={r.warrantyType} label={r.warrantyType?.replace('_',' ')} /> },
    { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'end', header: 'Expires', render: r => r.endDate ? new Date(r.endDate).toLocaleDateString('en-IN') : '—' },
    {
      key: 'actions', header: '', render: r => (
        <div style={{ display: 'flex', gap: 8 }}>
          {r.status === 'pending_activation' && (
            <button onClick={() => handleActivate(r._id)} style={{ background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiCheck size={11} /> Activate
            </button>
          )}
          {r.status === 'active' && (
            <button onClick={() => handleVoid(r._id)} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiSlash size={11} /> Void
            </button>
          )}
        </div>
      )
    },
  ];

  const amcColumns = [
    { key: 'contractNumber', header: 'Contract #', render: r => <span style={{ fontWeight: 600, color: '#3B82F6' }}>{r.contractNumber}</span> },
    { key: 'customer', header: 'Customer', render: r => r.customer?.name || '—' },
    { key: 'product', header: 'Product', render: r => r.product?.name || '—' },
    { key: 'amount', header: 'Amount', render: r => `₹${r.amount?.toLocaleString('en-IN')}` },
    { key: 'visits', header: 'Visits', render: r => `${r.completedVisits}/${r.totalVisits}` },
    { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'end', header: 'Expires', render: r => r.endDate ? new Date(r.endDate).toLocaleDateString('en-IN') : '—' },
    {
      key: 'actions', header: '', render: r => r.status === 'pending_activation' ? (
        <button onClick={() => handleActivate(r._id)} style={{ background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>
          Activate
        </button>
      ) : null
    },
  ];

  const currentStats = tab === 'warranty' ? stats : amcStats;

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#111827' }}>Warranty & AMC</h1>

      {currentStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <MetricCard title="Total" value={currentStats.total || 0} accent="#3B82F6" />
          <MetricCard title="Active" value={currentStats.active || 0} accent="#10B981" />
          <MetricCard title="Expired" value={currentStats.expired || 0} accent="#EF4444" />
          <MetricCard title={tab === 'warranty' ? 'Expiring (30d)' : 'Renewal Due'} value={currentStats.expiringIn30 || currentStats.renewalDue || 0} accent="#F59E0B" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #E5E7EB' }}>
        {['warranty', 'amc'].map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            style={{ padding: '10px 20px', border: 'none', borderBottom: tab === t ? '2px solid #111827' : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === t ? 700 : 400, color: tab === t ? '#111827' : '#6B7280', cursor: 'pointer' }}>
            {t === 'warranty' ? 'Warranty Cards' : 'AMC Contracts'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search serial, number..."
            style={{ width: '100%', paddingLeft: 32, height: 36, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ height: 36, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, padding: '0 12px' }}>
          <option value="">All Statuses</option>
          {['active','expired','pending_activation','transferred','void'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
        {tab === 'warranty' && (
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ height: 36, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, padding: '0 12px' }}>
            <option value="">All Types</option>
            {WARRANTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      <DataTable columns={tab === 'warranty' ? warrantyColumns : amcColumns} data={items} loading={loading} rowKey="_id"
        emptyTitle={`No ${tab === 'warranty' ? 'warranty cards' : 'AMC contracts'}`} emptyMessage="None found" />
      <div style={{ marginTop: 16 }}><Pagination page={page} total={total} limit={limit} onPageChange={setPage} /></div>
    </div>
  );
}

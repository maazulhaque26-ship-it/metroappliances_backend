import React, { useEffect, useState, useCallback } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import {
  DataTable, Pagination, FilterToolbar, SearchToolbar, SectionHeader, StatusBadge, ExportButton,
} from '../../components/shared';
import { useSearch }     from '../../hooks/useSearch';
import { usePagination } from '../../hooks/usePagination';
import { useFilters }    from '../../hooks/useFilters';
import { useExport }     from '../../hooks/useExport';
import api from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_OPTS = [
  { label: 'All',        value: '' },
  { label: 'Active',     value: 'active' },
  { label: 'Depleted',   value: 'depleted' },
  { label: 'Expired',    value: 'expired' },
  { label: 'Quarantine', value: 'quarantine' },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

const daysUntilExpiry = (d) => {
  if (!d) return null;
  const diff = Math.ceil((new Date(d) - new Date()) / 86400000);
  return diff;
};

export default function AdminBatchManagement() {
  const { query, setQuery, debouncedQuery, clear: clearSearch } = useSearch();
  const { page, setPage, total, setTotal, limit } = usePagination();
  const { filters, setFilter, toParams }          = useFilters({ status: '' });
  const { exportCSV }                             = useExport();

  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [whFilter,   setWhFilter]   = useState('');
  const [expiring,   setExpiring]   = useState(false);

  useEffect(() => {
    api.get('/admin/warehouses', { params: { limit: 100 } })
      .then(r => setWarehouses(r.data.data || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    const endpoint = expiring ? '/admin/inventory/batches/expiring' : '/admin/inventory/batches';
    api.get(endpoint, {
      params: { page, limit, warehouseId: whFilter || undefined, ...toParams(), ...(expiring ? { days: 30 } : {}) },
    })
      .then(r => {
        setRows(r.data.data || []);
        setTotal(r.data.pagination?.total || (r.data.data?.length) || 0);
      })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [page, limit, whFilter, toParams, expiring]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { key: 'batchNumber', label: 'Batch No', render: (r) => (
        <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.batchNumber}</span>
      )},
    { key: 'product', label: 'Product', render: (r) => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{r.product?.name || '—'}</p>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{r.product?.sku || ''}</p>
        </div>
      )},
    { key: 'warehouse', label: 'Warehouse', render: (r) => <span className="text-sm" style={{ color: 'var(--text)' }}>{r.warehouse?.name || '—'}</span> },
    { key: 'qty', label: 'Qty', render: (r) => (
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{r.availableQty} available</p>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{r.usedQty} used / {r.initialQty} initial</p>
        </div>
      )},
    { key: 'expiry', label: 'Expiry', render: (r) => {
        const days = daysUntilExpiry(r.expiryDate);
        const isExpiring = days !== null && days <= 30 && days >= 0;
        const isExpired  = days !== null && days < 0;
        return (
          <div className="flex items-center gap-1.5">
            {(isExpiring || isExpired) && <FiAlertTriangle size={13} style={{ color: isExpired ? '#EF4444' : '#F59E0B' }} />}
            <div>
              <p className="text-sm" style={{ color: isExpired ? '#EF4444' : isExpiring ? '#F59E0B' : 'var(--text)' }}>
                {fmtDate(r.expiryDate)}
              </p>
              {days !== null && <p className="text-xs" style={{ color: 'var(--text-4)' }}>{days >= 0 ? `${days}d left` : 'Expired'}</p>}
            </div>
          </div>
        );
      }},
    { key: 'mfg', label: 'Mfg Date', render: (r) => <span className="text-xs" style={{ color: 'var(--text-4)' }}>{fmtDate(r.manufacturingDate)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <SectionHeader
          title="Batch Management"
          subtitle={`${total} batches`}
          actions={
            <div className="flex gap-2">
              <button
                onClick={() => { setExpiring(p => !p); setPage(1); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: expiring ? '#F59E0B' : 'var(--bg-2)', color: expiring ? '#fff' : 'var(--text)' }}
              >
                {expiring ? 'All Batches' : 'Expiring Soon (30d)'}
              </button>
              <ExportButton onExportCSV={() => exportCSV(rows, 'batches')} />
            </div>
          }
        />

        <div className="flex flex-wrap gap-3">
          <select value={whFilter} onChange={e => { setWhFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          {!expiring && (
            <FilterToolbar
              filters={STATUS_OPTS.map(o => ({ ...o, active: filters.status === o.value }))}
              onSelect={v => { setFilter('status', v); setPage(1); }}
            />
          )}
        </div>

        <DataTable columns={columns} data={rows} loading={loading} />
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}

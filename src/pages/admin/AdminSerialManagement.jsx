import React, { useEffect, useState, useCallback } from 'react';
import { FiSearch } from 'react-icons/fi';
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
  { label: 'All',       value: '' },
  { label: 'In Stock',  value: 'in_stock' },
  { label: 'Reserved',  value: 'reserved' },
  { label: 'Sold',      value: 'sold' },
  { label: 'Returned',  value: 'returned' },
  { label: 'Damaged',   value: 'damaged' },
  { label: 'Lost',      value: 'lost' },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

export default function AdminSerialManagement() {
  const { query, setQuery, debouncedQuery, clear: clearSearch } = useSearch();
  const { page, setPage, total, setTotal, limit } = usePagination();
  const { filters, setFilter, toParams }          = useFilters({ status: '' });
  const { exportCSV }                             = useExport();

  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [whFilter,   setWhFilter]   = useState('');

  useEffect(() => {
    api.get('/admin/warehouses', { params: { limit: 100 } })
      .then(r => setWarehouses(r.data.data || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/admin/inventory/serials', {
      params: { page, limit, search: debouncedQuery, warehouseId: whFilter || undefined, ...toParams() },
    })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedQuery, whFilter, toParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { key: 'serialNumber', label: 'Serial No', render: (r) => (
        <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.serialNumber}</span>
      )},
    { key: 'product', label: 'Product', render: (r) => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{r.product?.name || '—'}</p>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{r.product?.sku || ''}</p>
        </div>
      )},
    { key: 'warehouse', label: 'Warehouse', render: (r) => <span className="text-sm" style={{ color: 'var(--text)' }}>{r.warehouse?.name || '—'}</span> },
    { key: 'batch', label: 'Batch', render: (r) => (
        <span className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>{r.batch?.batchNumber || '—'}</span>
      )},
    { key: 'imei', label: 'IMEI', render: (r) => (
        <span className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>{r.imei || '—'}</span>
      )},
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} label={r.status.replace(/_/g, ' ')} /> },
    { key: 'soldTo', label: 'Sold To / Reserved For', render: (r) => (
        <span className="text-xs" style={{ color: 'var(--text-4)' }}>{r.soldTo || r.reservedFor || '—'}</span>
      )},
    { key: 'warranty', label: 'Warranty', render: (r) => (
        <span className="text-xs" style={{ color: 'var(--text-4)' }}>{fmtDate(r.warrantyExpiry)}</span>
      )},
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <SectionHeader
          title="Serial Number Management"
          subtitle={`${total} serial numbers`}
          actions={<ExportButton onExportCSV={() => exportCSV(rows, 'serial-numbers')} />}
        />

        <div className="flex flex-wrap gap-3">
          <SearchToolbar
            value={query}
            onChange={setQuery}
            onClear={clearSearch}
            placeholder="Search serial number, IMEI…"
          />
          <select value={whFilter} onChange={e => { setWhFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <FilterToolbar
            filters={STATUS_OPTS.map(o => ({ ...o, active: filters.status === o.value }))}
            onSelect={v => { setFilter('status', v); setPage(1); }}
          />
        </div>

        <DataTable columns={columns} data={rows} loading={loading} />
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}

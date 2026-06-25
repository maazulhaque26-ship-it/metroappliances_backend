import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiAlertTriangle } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import {
  DataTable, Pagination, SearchToolbar, FilterToolbar,
  SectionHeader, StatusBadge, ExportButton, LoadingState, EmptyState,
} from '../../components/shared';
import { useSearch }     from '../../hooks/useSearch';
import { usePagination } from '../../hooks/usePagination';
import { useFilters }    from '../../hooks/useFilters';
import { useExport }     from '../../hooks/useExport';
import api from '../../services/api';
import { toast } from 'react-toastify';

const formatINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const STOCK_OPTS = [
  { label: 'All Stock', value: '' },
  { label: 'In Stock',  value: 'in_stock' },
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
];

export default function AdminInventoryList() {
  const navigate = useNavigate();
  const { query, setQuery, debouncedQuery, clear: clearSearch } = useSearch();
  const { page, setPage, total, setTotal, limit }               = usePagination();
  const { filters, setFilter, toParams }                        = useFilters({ stockStatus: '', warehouseId: '' });
  const { exportCSV }                                           = useExport();

  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    api.get('/admin/warehouses', { params: { limit: 100 } })
      .then(r => setWarehouses(r.data.data || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/admin/inventory', {
      params: { page, limit, search: debouncedQuery, ...toParams() },
    })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedQuery, toParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stockStatusBadge = (inv) => {
    if (inv.availableQty === 0) return <StatusBadge status="out_of_stock" label="Out of Stock" />;
    if (inv.reorderLevel > 0 && inv.availableQty <= inv.reorderLevel) return <StatusBadge status="low" label="Low Stock" />;
    return <StatusBadge status="active" label="In Stock" />;
  };

  const columns = [
    { key: 'product', label: 'Product', render: (r) => (
        <div className="flex items-center gap-3">
          {r.product?.images?.[0] && <img src={r.product.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover" />}
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{r.product?.name || '—'}</p>
            <p className="text-xs" style={{ color: 'var(--text-4)' }}>{r.product?.sku || ''}</p>
          </div>
        </div>
      )},
    { key: 'warehouse', label: 'Warehouse', render: (r) => (
        <span className="text-sm" style={{ color: 'var(--text)' }}>{r.warehouse?.name || '—'}</span>
      )},
    { key: 'location', label: 'Location', render: (r) => (
        <div>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{r.zone?.name || '—'}</p>
          {r.storageLocation && (
            <p className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>
              {r.storageLocation.rack}-{r.storageLocation.shelf}-{r.storageLocation.bin}
            </p>
          )}
        </div>
      )},
    { key: 'qty', label: 'Stock', render: (r) => (
        <div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{r.availableQty}</span>
            {r.reorderLevel > 0 && r.availableQty <= r.reorderLevel && r.availableQty > 0 && (
              <FiAlertTriangle size={12} style={{ color: '#F59E0B' }} />
            )}
          </div>
          {r.reservedQty > 0 && <p className="text-xs" style={{ color: '#8B5CF6' }}>{r.reservedQty} reserved</p>}
          {r.damagedQty  > 0 && <p className="text-xs" style={{ color: '#EF4444' }}>{r.damagedQty} damaged</p>}
        </div>
      )},
    { key: 'value', label: 'Value', render: (r) => (
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          {formatINR(r.availableQty * r.averageCost)}
        </span>
      )},
    { key: 'status', label: 'Status', render: stockStatusBadge },
    { key: 'actions', label: '', render: (r) => (
        <button onClick={() => navigate(`/admin/inventory/${r._id}`)} className="p-1.5 rounded hover:opacity-70" title="View">
          <FiEye size={14} />
        </button>
      )},
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <SectionHeader
          title="Inventory"
          subtitle={`${total} SKUs`}
          actions={<ExportButton onExportCSV={() => exportCSV(rows, 'inventory')} />}
        />

        <div className="flex flex-wrap gap-3">
          <SearchToolbar value={query} onChange={setQuery} onClear={clearSearch} placeholder="Search product name or SKU…" />
          <select
            value={filters.warehouseId || ''}
            onChange={e => { setFilter('warehouseId', e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
          >
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <FilterToolbar
            filters={STOCK_OPTS.map(o => ({ ...o, active: filters.stockStatus === o.value }))}
            onSelect={v => { setFilter('stockStatus', v); setPage(1); }}
          />
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          onRowClick={r => navigate(`/admin/inventory/${r._id}`)}
        />
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}

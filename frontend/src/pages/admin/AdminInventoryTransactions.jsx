import React, { useEffect, useState, useCallback } from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import {
  DataTable, Pagination, FilterToolbar, SectionHeader, ExportButton,
} from '../../components/shared';
import { usePagination } from '../../hooks/usePagination';
import { useFilters }    from '../../hooks/useFilters';
import { useExport }     from '../../hooks/useExport';
import api from '../../services/api';
import { toast } from 'react-toastify';

const TXN_TYPES = ['purchase', 'sale', 'transfer', 'adjustment', 'damage', 'return', 'cycle_count', 'reservation', 'release', 'manual'];
const TYPE_OPTS = [{ label: 'All Types', value: '' }, ...TXN_TYPES.map(t => ({ label: t.replace(/_/g, ' '), value: t }))];

const TYPE_COLOR = { purchase: '#10B981', sale: '#EF4444', adjustment: '#8B5CF6', damage: '#F97316', return: '#3B82F6', cycle_count: '#6B7280', reservation: '#F59E0B', release: '#06B6D4', transfer: '#EC4899', manual: '#6B7280' };

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export default function AdminInventoryTransactions() {
  const { page, setPage, total, setTotal, limit } = usePagination();
  const { filters, setFilter, toParams }          = useFilters({ type: '', warehouseId: '' });
  const { exportCSV }                             = useExport();

  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    api.get('/admin/warehouses', { params: { limit: 100 } })
      .then(r => setWarehouses(r.data.data || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/admin/inventory/transactions', {
      params: { page, limit, ...toParams() },
    })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [page, limit, toParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { key: 'type', label: 'Type', render: (r) => (
        <div className="flex items-center gap-2">
          {r.quantity > 0
            ? <FiTrendingUp size={13} style={{ color: '#10B981' }} />
            : <FiTrendingDown size={13} style={{ color: '#EF4444' }} />}
          <span className="text-xs font-semibold capitalize" style={{ color: TYPE_COLOR[r.type] || '#6B7280' }}>
            {r.type.replace(/_/g, ' ')}
          </span>
        </div>
      )},
    { key: 'product', label: 'Product', render: (r) => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{r.product?.name || '—'}</p>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{r.product?.sku || ''}</p>
        </div>
      )},
    { key: 'warehouse', label: 'Warehouse', render: (r) => (
        <span className="text-sm" style={{ color: 'var(--text)' }}>{r.warehouse?.name || '—'}</span>
      )},
    { key: 'qty', label: 'Qty', render: (r) => (
        <span className="font-bold text-sm" style={{ color: r.quantity > 0 ? '#10B981' : '#EF4444' }}>
          {r.quantity > 0 ? '+' : ''}{r.quantity}
        </span>
      )},
    { key: 'balance', label: 'New Balance', render: (r) => (
        <span className="text-sm" style={{ color: 'var(--text)' }}>{r.newQty}</span>
      )},
    { key: 'reference', label: 'Reference', render: (r) => (
        <span className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>{r.referenceNumber || '—'}</span>
      )},
    { key: 'by', label: 'By', render: (r) => (
        <span className="text-xs" style={{ color: 'var(--text-4)' }}>{r.performedByName || '—'}</span>
      )},
    { key: 'date', label: 'Date', render: (r) => (
        <span className="text-xs" style={{ color: 'var(--text-4)' }}>{fmtDate(r.createdAt)}</span>
      )},
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <SectionHeader
          title="Inventory Transactions"
          subtitle={`${total} records`}
          actions={<ExportButton onExportCSV={() => exportCSV(rows, 'transactions')} />}
        />

        <div className="flex flex-wrap gap-3">
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
            filters={TYPE_OPTS.map(o => ({ ...o, active: filters.type === o.value }))}
            onSelect={v => { setFilter('type', v); setPage(1); }}
          />
        </div>

        <DataTable columns={columns} data={rows} loading={loading} />
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}

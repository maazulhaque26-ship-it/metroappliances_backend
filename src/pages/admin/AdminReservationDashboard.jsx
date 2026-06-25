import React, { useEffect, useState, useCallback } from 'react';
import { FiRefreshCw, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import {
  DataTable, Pagination, FilterToolbar, SectionHeader, StatusBadge, MetricCard, ConfirmDialog,
} from '../../components/shared';
import { usePagination } from '../../hooks/usePagination';
import { useFilters }    from '../../hooks/useFilters';
import { useConfirm }    from '../../hooks/useModal';
import api from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_OPTS = [
  { label: 'All',       value: '' },
  { label: 'Active',    value: 'active' },
  { label: 'Released',  value: 'released' },
  { label: 'Fulfilled', value: 'fulfilled' },
  { label: 'Expired',   value: 'expired' },
  { label: 'Cancelled', value: 'cancelled' },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

export default function AdminReservationDashboard() {
  const { page, setPage, total, setTotal, limit } = usePagination();
  const { filters, setFilter, toParams }          = useFilters({ status: '' });
  const { open: confirmOpen, ask, cancel, loading: acting } = useConfirm();

  const [dashData, setDashData]       = useState(null);
  const [rows,       setRows]         = useState([]);
  const [loading,    setLoading]      = useState(true);
  const [warehouses, setWarehouses]   = useState([]);
  const [whFilter,   setWhFilter]     = useState('');
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType,   setActionType]   = useState('');

  useEffect(() => {
    api.get('/admin/warehouses', { params: { limit: 100 } }).then(r => setWarehouses(r.data.data || [])).catch(() => {});
    api.get('/admin/inventory/reservations/dashboard').then(r => setDashData(r.data.data)).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/admin/inventory/reservations', {
      params: { page, limit, warehouseId: whFilter || undefined, ...toParams() },
    })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [page, limit, whFilter, toParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doAction = (rsv, type) => {
    setActionTarget(rsv);
    setActionType(type);
    ask(`${type === 'release' ? 'Release' : 'Fulfill'} this reservation for ${rsv.quantity} units of ${rsv.product?.name || 'product'}?`);
  };

  const confirmAction = async () => {
    try {
      await api.put(`/admin/inventory/reservations/${actionTarget._id}/${actionType}`);
      toast.success(`Reservation ${actionType}d`);
      fetchData();
      api.get('/admin/inventory/reservations/dashboard').then(r => setDashData(r.data.data)).catch(() => {});
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const activeStats  = dashData?.stats?.active;
  const releasedStats= dashData?.stats?.released;

  const columns = [
    { key: 'product', label: 'Product', render: (r) => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{r.product?.name || '—'}</p>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{r.product?.sku || ''}</p>
        </div>
      )},
    { key: 'qty',  label: 'Qty',  render: (r) => <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{r.quantity}</span> },
    { key: 'type', label: 'For',  render: (r) => <span className="text-xs capitalize" style={{ color: 'var(--text-4)' }}>{r.referenceType.replace(/_/g, ' ')}</span> },
    { key: 'ref',  label: 'Reference', render: (r) => <span className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>{r.referenceNumber || '—'}</span> },
    { key: 'status',  label: 'Status',  render: (r) => <StatusBadge status={r.status} /> },
    { key: 'expires', label: 'Expires', render: (r) => (
        <div className="flex items-center gap-1">
          {r.expiresAt && new Date(r.expiresAt) < new Date(Date.now() + 24*3600000) && r.status === 'active' && (
            <FiAlertTriangle size={12} style={{ color: '#F59E0B' }} />
          )}
          <span className="text-xs" style={{ color: 'var(--text-4)' }}>{fmtDate(r.expiresAt)}</span>
        </div>
      )},
    { key: 'actions', label: '', render: (r) => r.status === 'active' ? (
        <div className="flex items-center gap-2 justify-end">
          <button onClick={() => doAction(r, 'fulfill')} className="p-1.5 rounded hover:opacity-70 text-green-600" title="Fulfill"><FiCheckCircle size={14} /></button>
          <button onClick={() => doAction(r, 'release')} className="p-1.5 rounded hover:opacity-70" title="Release"><FiRefreshCw size={14} /></button>
        </div>
      ) : null },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <SectionHeader title="Stock Reservations" subtitle={`${total} records`} />

        {dashData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Active"    value={activeStats?.count || 0}    icon={FiRefreshCw}  accentColor="#8B5CF6" />
            <MetricCard label="Qty Reserved" value={activeStats?.totalQty || 0} icon={FiRefreshCw} accentColor="#FF7A00" />
            <MetricCard label="Expiring Soon" value={dashData?.expiringSoon?.length || 0} icon={FiAlertTriangle} accentColor="#F59E0B" />
            <MetricCard label="Released"  value={releasedStats?.count || 0}  icon={FiCheckCircle} accentColor="#10B981" />
          </div>
        )}

        {dashData?.expiringSoon?.length > 0 && (
          <div className="rounded-xl p-4 border" style={{ borderColor: '#F59E0B', background: '#FFFBEB' }}>
            <p className="text-sm font-semibold text-amber-800 mb-2">⚠ Expiring within 24 hours ({dashData.expiringSoon.length})</p>
            <div className="flex flex-wrap gap-2">
              {dashData.expiringSoon.map(r => (
                <span key={r._id} className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">
                  {r.product?.name} ({r.quantity} units)
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
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

      <ConfirmDialog
        open={confirmOpen}
        title={actionType === 'fulfill' ? 'Fulfill Reservation' : 'Release Reservation'}
        message={actionType === 'fulfill'
          ? 'Mark as fulfilled — stock was dispatched for this reservation.'
          : 'Release reservation — stock will return to available inventory.'}
        type={actionType === 'fulfill' ? 'success' : 'danger'}
        loading={acting}
        onConfirm={confirmAction}
        onCancel={cancel}
      />
    </AdminLayout>
  );
}

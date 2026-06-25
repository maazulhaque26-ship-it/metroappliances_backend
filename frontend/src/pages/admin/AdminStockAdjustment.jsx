import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiCheckCircle, FiXCircle, FiEye, FiX } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import {
  DataTable, Pagination, FilterToolbar, SectionHeader, StatusBadge, ConfirmDialog,
} from '../../components/shared';
import { usePagination } from '../../hooks/usePagination';
import { useFilters }    from '../../hooks/useFilters';
import { useConfirm }    from '../../hooks/useModal';
import api from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_OPTS = [
  { label: 'All',      value: '' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Applied',  value: 'applied' },
  { label: 'Rejected', value: 'rejected' },
];

const REASONS = ['damage', 'lost', 'expired', 'manual', 'correction', 'theft', 'sample', 'write_off'];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

export default function AdminStockAdjustment() {
  const { page, setPage, total, setTotal, limit } = usePagination();
  const { filters, setFilter, toParams }          = useFilters({ status: '' });
  const { open: confirmOpen, ask, cancel, loading: acting } = useConfirm();

  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [whFilter,   setWhFilter]   = useState('');
  const [detail,     setDetail]     = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType,   setActionType]   = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    api.get('/admin/warehouses', { params: { limit: 100 } })
      .then(r => setWarehouses(r.data.data || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/admin/inventory/adjustments', {
      params: { page, limit, warehouseId: whFilter || undefined, ...toParams() },
    })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [page, limit, whFilter, toParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openApprove = (adj) => { setActionTarget(adj); setActionType('approve'); ask(`Approve adjustment "${adj.adjustmentNumber}" and apply to inventory?`); };
  const openReject  = (adj) => { setActionTarget(adj); setActionType('reject');  ask(`Reject adjustment "${adj.adjustmentNumber}"?`); };

  const confirmAction = async () => {
    try {
      if (actionType === 'approve') {
        await api.put(`/admin/inventory/adjustments/${actionTarget._id}/approve`);
        toast.success('Adjustment approved and applied');
      } else {
        await api.put(`/admin/inventory/adjustments/${actionTarget._id}/reject`, { reason: rejectReason || 'Admin rejected' });
        toast.success('Adjustment rejected');
      }
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const columns = [
    { key: 'adjNumber', label: 'Adj No', render: (r) => (
        <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.adjustmentNumber}</span>
      )},
    { key: 'warehouse', label: 'Warehouse', render: (r) => <span className="text-sm" style={{ color: 'var(--text)' }}>{r.warehouse?.name || '—'}</span> },
    { key: 'requestedBy', label: 'Requested By', render: (r) => <span className="text-sm" style={{ color: 'var(--text)' }}>{r.requestedByName || '—'}</span> },
    { key: 'items', label: 'Items', render: (r) => <span className="text-sm" style={{ color: 'var(--text)' }}>{r.items?.length || 0}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'date', label: 'Date', render: (r) => <span className="text-xs" style={{ color: 'var(--text-4)' }}>{fmtDate(r.createdAt)}</span> },
    { key: 'actions', label: '', render: (r) => (
        <div className="flex items-center gap-2 justify-end">
          <button onClick={() => setDetail(r)} className="p-1.5 rounded hover:opacity-70" title="View"><FiEye size={14} /></button>
          {r.status === 'pending' && (
            <>
              <button onClick={() => openApprove(r)} className="p-1.5 rounded hover:opacity-70 text-green-600"><FiCheckCircle size={14} /></button>
              <button onClick={() => openReject(r)}  className="p-1.5 rounded hover:opacity-70 text-red-500"><FiXCircle size={14} /></button>
            </>
          )}
        </div>
      )},
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <SectionHeader title="Stock Adjustments" subtitle={`${total} records`} />

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

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold" style={{ color: 'var(--text)' }}>Adjustment: {detail.adjustmentNumber}</h2>
              <button onClick={() => setDetail(null)}><FiX size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-4 text-sm">
                <div><span style={{ color: 'var(--text-4)' }}>Status: </span><StatusBadge status={detail.status} /></div>
                <div><span style={{ color: 'var(--text-4)' }}>Warehouse: </span><span style={{ color: 'var(--text)' }}>{detail.warehouse?.name}</span></div>
                <div><span style={{ color: 'var(--text-4)' }}>By: </span><span style={{ color: 'var(--text)' }}>{detail.requestedByName}</span></div>
              </div>
              {detail.notes && <p className="text-sm" style={{ color: 'var(--text-4)' }}>{detail.notes}</p>}
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Product', 'Reason', 'Current Qty', 'Adjustment', 'Notes'].map(h => (
                      <th key={h} className="pb-2 pr-4 text-left text-xs font-semibold" style={{ color: 'var(--text-4)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(detail.items || []).map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-2 pr-4" style={{ color: 'var(--text)' }}>{item.productName || '—'}</td>
                      <td className="py-2 pr-4 capitalize" style={{ color: 'var(--text-4)' }}>{item.reason}</td>
                      <td className="py-2 pr-4" style={{ color: 'var(--text)' }}>{item.currentQty}</td>
                      <td className="py-2 pr-4 font-bold" style={{ color: item.adjustedQty > 0 ? '#10B981' : '#EF4444' }}>
                        {item.adjustedQty > 0 ? '+' : ''}{item.adjustedQty}
                      </td>
                      <td className="py-2 pr-4 text-xs" style={{ color: 'var(--text-4)' }}>{item.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {detail.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setDetail(null); openApprove(detail); }} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#10B981' }}>Approve</button>
                  <button onClick={() => { setDetail(null); openReject(detail); }}  className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#EF4444' }}>Reject</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={actionType === 'approve' ? 'Approve Adjustment' : 'Reject Adjustment'}
        message={actionType === 'approve'
          ? `Apply this adjustment to inventory? This will update stock quantities.`
          : `Reject this adjustment? No inventory changes will be made.`}
        type={actionType === 'approve' ? 'success' : 'danger'}
        loading={acting}
        onConfirm={confirmAction}
        onCancel={cancel}
      />
    </AdminLayout>
  );
}

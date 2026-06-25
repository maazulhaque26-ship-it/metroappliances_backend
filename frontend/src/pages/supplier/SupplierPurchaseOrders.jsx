import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import supplierAPI from '../../services/supplierAPI';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge   from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { useFilters }    from '../../hooks/useFilters';
import { useConfirm }    from '../../hooks/useModal';
import { toast } from 'react-toastify';

const fmtDate     = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtCurrency = v => `₹${(v || 0).toLocaleString('en-IN')}`;

const STATUS_OPTS = [
  { label: 'All',           value: '' },
  { label: 'Sent',          value: 'sent' },
  { label: 'Acknowledged',  value: 'acknowledged' },
  { label: 'Accepted',      value: 'supplier_accepted' },
  { label: 'Rejected',      value: 'supplier_rejected' },
  { label: 'Completed',     value: 'completed' },
];

export default function SupplierPurchaseOrders() {
  const navigate = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const { page, limit, setPage } = usePagination();
  const { filters, setFilter }   = useFilters({ status: '' });
  const { open: confirmOpen, ask, cancel, confirm: runConfirm, loading: confirming, title: confirmTitle, message: confirmMsg } = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    supplierAPI.get('/supplier/orders', { params: { status: filters.status, page, limit } })
      .then(r => { setOrders(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [filters.status, page, limit]);

  React.useEffect(() => { load(); }, [load]);

  const doAction = async (id, action) => {
    try {
      await supplierAPI.put(`/supplier/orders/${id}/${action}`);
      toast.success(`Order ${action}d`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const columns = [
    { header: 'PO #',     accessor: 'poNumber',   render: r => <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.poNumber}</span> },
    { header: 'Amount',   accessor: 'totalAmount', render: r => <span className="font-bold">{fmtCurrency(r.totalAmount)}</span> },
    { header: 'Expected', accessor: 'expectedDeliveryDate', render: r => <span className="text-xs">{fmtDate(r.expectedDeliveryDate)}</span> },
    { header: 'Status',   accessor: 'status',      render: r => <StatusBadge status={r.status} /> },
    {
      header: 'Actions', accessor: '_id', render: r => (
        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
          {r.status === 'sent' && (
            <button onClick={() => ask({ title: 'Acknowledge Order', message: 'Acknowledge receipt of this PO?', type: 'info', onConfirm: () => doAction(r._id, 'acknowledge') })}
              className="px-2 py-1 rounded text-xs font-bold text-white" style={{ background: '#3B82F6' }}>Acknowledge</button>
          )}
          {r.status === 'acknowledged' && (
            <>
              <button onClick={() => ask({ title: 'Accept Order', message: 'Accept this purchase order?', type: 'info', onConfirm: () => doAction(r._id, 'accept') })}
                className="px-2 py-1 rounded text-xs font-bold text-white" style={{ background: '#10B981' }}>Accept</button>
              <button onClick={() => ask({ title: 'Reject Order', message: 'Reject this purchase order?', type: 'danger', onConfirm: () => doAction(r._id, 'reject') })}
                className="px-2 py-1 rounded text-xs font-bold text-white" style={{ background: '#EF4444' }}>Reject</button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <SectionHeader title="Purchase Orders" subtitle={`${total} orders`} />
      <FilterToolbar filters={[{ key: 'status', label: 'Status', options: STATUS_OPTS, value: filters.status, onChange: v => setFilter('status', v) }]} />
      <DataTable columns={columns} data={orders} loading={loading} onRowClick={r => navigate(`/supplier/orders/${r._id}`)} emptyMessage="No purchase orders" />
      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMsg}
        onConfirm={runConfirm}
        onCancel={cancel}
        loading={confirming}
      />
    </div>
  );
}

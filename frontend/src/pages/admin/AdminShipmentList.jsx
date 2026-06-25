import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import api from '../../services/api';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge   from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { useSearch }     from '../../hooks/useSearch';
import { useFilters }    from '../../hooks/useFilters';
import { useConfirm }    from '../../hooks/useModal';
import { toast } from 'react-toastify';

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';

const STATUS_OPTS = [
  { label: 'All', value: '' },
  { label: 'Created', value: 'created' }, { label: 'Packed', value: 'packed' },
  { label: 'Ready', value: 'ready' }, { label: 'Dispatched', value: 'dispatched' },
  { label: 'In Transit', value: 'in_transit' }, { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered', value: 'delivered' }, { label: 'Failed', value: 'failed' },
  { label: 'Returned', value: 'returned' }, { label: 'Cancelled', value: 'cancelled' },
];

export default function AdminShipmentList() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [couriers,  setCouriers]  = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [dispatches, setDispatches] = useState([]);
  const [form, setForm] = useState({ dispatchId: '', courierId: '', serviceLevel: 'standard', trackingNumber: '', estimatedDelivery: '', weight: '', freightCharge: 0 });

  const { page, limit, setPage } = usePagination();
  const { query: search, setQuery: setSearch, debouncedQuery: debouncedSearch } = useSearch();
  const { filters, setFilter } = useFilters({ status: '', courier: '' });
  const { open: confirmOpen, ask, cancel, confirm: runConfirm, loading: confirming, title: confirmTitle, message: confirmMsg } = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/logistics/shipments', { params: { search: debouncedSearch, status: filters.status, courier: filters.courier, page, limit } })
      .then(r => { setShipments(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, filters.status, filters.courier, page, limit]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/admin/logistics/couriers', { params: { status: 'active' } }).then(r => setCouriers(r.data.data || []));
    api.get('/admin/logistics/dispatches', { params: { status: 'ready', limit: 100 } }).then(r => setDispatches(r.data.data || []));
  }, []);

  const courierOpts = [{ label: 'All Couriers', value: '' }, ...couriers.map(c => ({ label: c.name, value: c._id }))];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/admin/logistics/shipments', form);
      toast.success('Shipment created');
      setShowCreate(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Create failed'); }
  };

  const handleStatusUpdate = (id, status) => {
    ask({
      title: `Mark as ${status}`,
      message: `Update shipment status to "${status}"?`,
      type: 'info',
      onConfirm: async () => {
        await api.put(`/admin/logistics/shipments/${id}/status`, { status });
        toast.success('Shipment updated');
        load();
      },
    });
  };

  const columns = [
    { header: 'Shipment #',  accessor: 'shipmentNumber', render: r => <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.shipmentNumber}</span> },
    { header: 'Courier',     accessor: 'courierName',    render: r => <span className="text-sm" style={{ color: 'var(--text)' }}>{r.courierName || '—'}</span> },
    { header: 'Tracking #',  accessor: 'trackingNumber', render: r => <span className="font-mono text-xs" style={{ color: 'var(--text-4)' }}>{r.trackingNumber || '—'}</span> },
    { header: 'Recipient',   accessor: 'recipientName',  render: r => <span className="text-sm" style={{ color: 'var(--text)' }}>{r.recipientName}</span> },
    { header: 'Est. Delivery', accessor: 'estimatedDelivery', render: r => <span className="text-xs">{fmtDate(r.estimatedDelivery)}</span> },
    { header: 'Status',      accessor: 'status',         render: r => <StatusBadge status={r.status} /> },
    { header: 'Actions',     accessor: '_id', render: r => r.status === 'ready' ? (
      <button onClick={e => { e.stopPropagation(); handleStatusUpdate(r._id, 'dispatched'); }}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#FF7A00' }}>Dispatch</button>
    ) : r.status === 'dispatched' ? (
      <button onClick={e => { e.stopPropagation(); handleStatusUpdate(r._id, 'in_transit'); }}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#3B82F6' }}>In Transit</button>
    ) : null },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Shipments" subtitle={`${total} shipments`} />
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>
          <FiPlus size={16} /> New Shipment
        </button>
      </div>
      <SearchToolbar value={search} onChange={setSearch} placeholder="Search shipment #, tracking, recipient…" />
      <FilterToolbar filters={[
        { key: 'status',  label: 'Status',  options: STATUS_OPTS,  value: filters.status,  onChange: v => setFilter('status', v) },
        { key: 'courier', label: 'Courier', options: courierOpts,  value: filters.courier, onChange: v => setFilter('courier', v) },
      ]} />
      <DataTable columns={columns} data={shipments} loading={loading}
        onRowClick={r => navigate(`/admin/logistics/shipments/${r._id}`)}
        emptyMessage="No shipments found" />
      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg mx-4 rounded-2xl p-6" style={{ background: 'var(--card)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>New Shipment</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Dispatch (Ready) *</label>
                <select required value={form.dispatchId} onChange={e => setForm(f => ({ ...f, dispatchId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                  <option value="">Select dispatch</option>
                  {dispatches.map(d => <option key={d._id} value={d._id}>{d.dispatchNumber} — {d.recipientName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Courier</label>
                  <select value={form.courierId} onChange={e => setForm(f => ({ ...f, courierId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                    <option value="">Manual courier</option>
                    {couriers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Tracking Number</label>
                  <input value={form.trackingNumber} onChange={e => setForm(f => ({ ...f, trackingNumber: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Est. Delivery</label>
                  <input type="date" value={form.estimatedDelivery} onChange={e => setForm(f => ({ ...f, estimatedDelivery: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Weight (kg)</label>
                  <input type="number" step="0.1" min={0} value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>Create Shipment</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog open={confirmOpen} title={confirmTitle} message={confirmMsg} onConfirm={runConfirm} onCancel={cancel} loading={confirming} />
    </div>
  );
}

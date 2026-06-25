import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTruck } from 'react-icons/fi';
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

const PRIORITY_COLORS = { low: '#6B7280', normal: '#3B82F6', high: '#F59E0B', urgent: '#EF4444' };

const STATUS_OPTS = [
  { label: 'All', value: '' },
  { label: 'Pending',     value: 'pending' },
  { label: 'Assigned',    value: 'assigned' },
  { label: 'Picking',     value: 'picking' },
  { label: 'Picked',      value: 'picked' },
  { label: 'Packing',     value: 'packing' },
  { label: 'Packed',      value: 'packed' },
  { label: 'Ready',       value: 'ready' },
  { label: 'Dispatched',  value: 'dispatched' },
  { label: 'In Transit',  value: 'in_transit' },
  { label: 'Delivered',   value: 'delivered' },
  { label: 'Failed',      value: 'failed' },
  { label: 'Cancelled',   value: 'cancelled' },
];

const PRIORITY_OPTS = [
  { label: 'All Priorities', value: '' },
  { label: 'Urgent', value: 'urgent' }, { label: 'High', value: 'high' },
  { label: 'Normal', value: 'normal' }, { label: 'Low', value: 'low' },
];

export default function AdminDispatchQueue() {
  const navigate = useNavigate();
  const [dispatches, setDispatches] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ recipientName: '', recipientPhone: '', deliveryAddress: { street: '', city: '', state: '', pincode: '' }, priority: 'normal', orderType: 'manual', items: [{ productName: '', quantity: 1, unit: 'pcs' }] });

  const { page, limit, setPage } = usePagination();
  const { query: search, setQuery: setSearch, debouncedQuery: debouncedSearch } = useSearch();
  const { filters, setFilter } = useFilters({ status: '', priority: '' });
  const { open: confirmOpen, ask, cancel, confirm: runConfirm, loading: confirming, title: confirmTitle, message: confirmMsg } = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/logistics/dispatches', { params: { search: debouncedSearch, status: filters.status, priority: filters.priority, page, limit } })
      .then(r => { setDispatches(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, filters.status, filters.priority, page, limit]);

  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/admin/logistics/dispatches', form);
      toast.success('Dispatch created');
      setShowCreate(false);
      navigate(`/admin/logistics/dispatches/${r.data.data._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Create failed'); }
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productName: '', quantity: 1, unit: 'pcs' }] }));
  const updItem = (i, k, v) => setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items }; });

  const columns = [
    { header: 'Dispatch #', accessor: 'dispatchNumber', render: r => <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.dispatchNumber}</span> },
    { header: 'Recipient',  accessor: 'recipientName',  render: r => (
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{r.recipientName}</p>
        <p className="text-xs" style={{ color: 'var(--text-4)' }}>{r.orderNumber || r.orderType}</p>
      </div>
    )},
    { header: 'Priority', accessor: 'priority', render: r => (
      <span className="text-xs font-bold capitalize" style={{ color: PRIORITY_COLORS[r.priority] || '#6B7280' }}>{r.priority}</span>
    )},
    { header: 'Status',   accessor: 'status',   render: r => <StatusBadge status={r.status} /> },
    { header: 'Created',  accessor: 'createdAt', render: r => <span className="text-xs">{fmtDate(r.createdAt)}</span> },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Dispatch Queue" subtitle={`${total} dispatches`} />
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>
          <FiPlus size={16} /> New Dispatch
        </button>
      </div>

      <SearchToolbar value={search} onChange={setSearch} placeholder="Search dispatch #, recipient…" />
      <FilterToolbar filters={[
        { key: 'status',   label: 'Status',   options: STATUS_OPTS,   value: filters.status,   onChange: v => setFilter('status', v) },
        { key: 'priority', label: 'Priority', options: PRIORITY_OPTS, value: filters.priority, onChange: v => setFilter('priority', v) },
      ]} />

      <DataTable columns={columns} data={dispatches} loading={loading}
        onRowClick={r => navigate(`/admin/logistics/dispatches/${r._id}`)}
        emptyMessage="No dispatches found" />
      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-xl mx-4 rounded-2xl p-6 max-h-screen overflow-y-auto" style={{ background: 'var(--card)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>New Dispatch</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Recipient Name *</label>
                  <input required value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Phone</label>
                  <input value={form.recipientPhone} onChange={e => setForm(f => ({ ...f, recipientPhone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>City</label>
                  <input value={form.deliveryAddress.city} onChange={e => setForm(f => ({ ...f, deliveryAddress: { ...f.deliveryAddress, city: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Pincode</label>
                  <input value={form.deliveryAddress.pincode} onChange={e => setForm(f => ({ ...f, deliveryAddress: { ...f.deliveryAddress, pincode: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                  <option value="low">Low</option><option value="normal">Normal</option>
                  <option value="high">High</option><option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold" style={{ color: 'var(--text-4)' }}>ITEMS</label>
                  <button type="button" onClick={addItem} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-2)', color: '#FF7A00' }}>+ Add</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                    <input required placeholder="Product name" value={item.productName} onChange={e => updItem(i, 'productName', e.target.value)}
                      className="col-span-2 px-2 py-1.5 rounded border text-xs outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                    <input type="number" min={1} placeholder="Qty" value={item.quantity} onChange={e => updItem(i, 'quantity', Number(e.target.value))}
                      className="px-2 py-1.5 rounded border text-xs outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmOpen} title={confirmTitle} message={confirmMsg} onConfirm={runConfirm} onCancel={cancel} loading={confirming} />
    </div>
  );
}

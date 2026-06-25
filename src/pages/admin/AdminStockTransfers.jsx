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
  { label: 'Draft', value: 'draft' }, { label: 'Submitted', value: 'submitted' },
  { label: 'Approved', value: 'approved' }, { label: 'Rejected', value: 'rejected' },
  { label: 'In Transit', value: 'in_transit' }, { label: 'Received', value: 'received' },
  { label: 'Completed', value: 'completed' }, { label: 'Cancelled', value: 'cancelled' },
];

export default function AdminStockTransfers() {
  const navigate = useNavigate();
  const [transfers,   setTransfers]  = useState([]);
  const [total,       setTotal]      = useState(0);
  const [loading,     setLoading]    = useState(false);
  const [warehouses,  setWarehouses] = useState([]);
  const [showCreate,  setShowCreate] = useState(false);
  const [form, setForm] = useState({
    fromWarehouse: '', toWarehouse: '', reason: '', priority: 'normal',
    items: [{ productName: '', sku: '', quantityRequested: 1, unit: 'pcs' }],
  });

  const { page, limit, setPage } = usePagination();
  const { query: search, setQuery: setSearch, debouncedQuery: debouncedSearch } = useSearch();
  const { filters, setFilter } = useFilters({ status: '' });
  const { open: confirmOpen, ask, cancel, confirm: runConfirm, loading: confirming, title: confirmTitle, message: confirmMsg } = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/logistics/transfers', { params: { search: debouncedSearch, status: filters.status, page, limit } })
      .then(r => { setTransfers(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, filters.status, page, limit]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/admin/warehouses').then(r => setWarehouses(r.data.data || [])); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const fw = warehouses.find(w => w._id === form.fromWarehouse);
      const tw = warehouses.find(w => w._id === form.toWarehouse);
      await api.post('/admin/logistics/transfers', {
        ...form,
        fromWarehouseName: fw?.name || '',
        toWarehouseName:   tw?.name || '',
      });
      toast.success('Transfer request created');
      setShowCreate(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAction = (id, action) => {
    const labels = { submit: 'Submit', approve: 'Approve', reject: 'Reject', complete: 'Complete', cancel: 'Cancel' };
    ask({
      title:  `${labels[action]} Transfer`,
      message: `${labels[action]} this stock transfer?`,
      type:   action === 'reject' || action === 'cancel' ? 'danger' : 'info',
      onConfirm: async () => {
        await api.put(`/admin/logistics/transfers/${id}/${action}`);
        toast.success(`Transfer ${action}d`);
        load();
      },
    });
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productName: '', sku: '', quantityRequested: 1, unit: 'pcs' }] }));
  const updItem = (i, k, v) => setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items }; });

  const columns = [
    { header: 'Transfer #',    accessor: 'transferNumber',   render: r => <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.transferNumber}</span> },
    { header: 'From',          accessor: 'fromWarehouseName', render: r => <span className="text-sm" style={{ color: 'var(--text)' }}>{r.fromWarehouseName}</span> },
    { header: 'To',            accessor: 'toWarehouseName',   render: r => <span className="text-sm" style={{ color: 'var(--text)' }}>{r.toWarehouseName}</span> },
    { header: 'Items',         accessor: 'items',             render: r => <span className="text-xs">{r.items?.length || 0} items</span> },
    { header: 'Status',        accessor: 'status',            render: r => <StatusBadge status={r.status} /> },
    { header: 'Created',       accessor: 'createdAt',         render: r => <span className="text-xs">{fmtDate(r.createdAt)}</span> },
    { header: 'Actions', accessor: '_id', render: r => (
      <div className="flex gap-1.5">
        {r.status === 'draft'     && <button onClick={e => { e.stopPropagation(); handleAction(r._id, 'submit'); }}  className="px-2 py-1 rounded text-xs font-bold text-white" style={{ background: '#3B82F6' }}>Submit</button>}
        {r.status === 'submitted' && <button onClick={e => { e.stopPropagation(); handleAction(r._id, 'approve'); }} className="px-2 py-1 rounded text-xs font-bold text-white" style={{ background: '#10B981' }}>Approve</button>}
        {r.status === 'submitted' && <button onClick={e => { e.stopPropagation(); handleAction(r._id, 'reject'); }}  className="px-2 py-1 rounded text-xs font-bold text-white" style={{ background: '#EF4444' }}>Reject</button>}
        {r.status === 'received'  && <button onClick={e => { e.stopPropagation(); handleAction(r._id, 'complete'); }} className="px-2 py-1 rounded text-xs font-bold text-white" style={{ background: '#8B5CF6' }}>Complete</button>}
      </div>
    )},
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Stock Transfers" subtitle={`${total} transfers`} />
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>
          <FiPlus size={16} /> New Transfer
        </button>
      </div>
      <SearchToolbar value={search} onChange={setSearch} placeholder="Search transfer #, warehouse…" />
      <FilterToolbar filters={[{ key: 'status', label: 'Status', options: STATUS_OPTS, value: filters.status, onChange: v => setFilter('status', v) }]} />
      <DataTable columns={columns} data={transfers} loading={loading}
        onRowClick={r => navigate(`/admin/logistics/transfers/${r._id}`)}
        emptyMessage="No transfers found" />
      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-xl mx-4 rounded-2xl p-6 max-h-screen overflow-y-auto" style={{ background: 'var(--card)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>New Stock Transfer</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>From Warehouse *</label>
                  <select required value={form.fromWarehouse} onChange={e => setForm(f => ({ ...f, fromWarehouse: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                    <option value="">Select</option>
                    {warehouses.filter(w => w._id !== form.toWarehouse).map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>To Warehouse *</label>
                  <select required value={form.toWarehouse} onChange={e => setForm(f => ({ ...f, toWarehouse: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                    <option value="">Select</option>
                    {warehouses.filter(w => w._id !== form.fromWarehouse).map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Reason</label>
                <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold" style={{ color: 'var(--text-4)' }}>ITEMS</label>
                  <button type="button" onClick={addItem} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-2)', color: '#FF7A00' }}>+ Add</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                    <input required placeholder="Product" value={item.productName} onChange={e => updItem(i, 'productName', e.target.value)}
                      className="col-span-2 px-2 py-1.5 rounded border text-xs outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                    <input type="number" min={1} placeholder="Qty" value={item.quantityRequested} onChange={e => updItem(i, 'quantityRequested', Number(e.target.value))}
                      className="px-2 py-1.5 rounded border text-xs outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>Create Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog open={confirmOpen} title={confirmTitle} message={confirmMsg} onConfirm={runConfirm} onCancel={cancel} loading={confirming} />
    </div>
  );
}

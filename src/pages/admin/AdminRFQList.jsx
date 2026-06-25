import React, { useState, useCallback } from 'react';
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
  { label: 'All', value: '' }, { label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' },
  { label: 'Closed', value: 'closed' }, { label: 'Awarded', value: 'awarded' }, { label: 'Cancelled', value: 'cancelled' },
];

export default function AdminRFQList() {
  const navigate = useNavigate();
  const [rfqs, setRFQs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { page, limit, setPage } = usePagination();
  const { query: search, setQuery: setSearch, debouncedQuery: debouncedSearch } = useSearch();
  const { filters, setFilter } = useFilters({ status: '' });
  const { open: confirmOpen, ask, cancel, confirm: runConfirm, loading: confirming, title: confirmTitle, message: confirmMsg } = useConfirm();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', submissionDeadline: '', items: [{ productName: '', quantity: 1, unit: 'pcs' }] });

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/admin/procurement/rfq', { params: { search: debouncedSearch, status: filters.status, page, limit } })
      .then(r => { setRFQs(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, filters.status, page, limit]);

  React.useEffect(() => { fetch(); }, [fetch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/admin/procurement/rfq', form);
      toast.success('RFQ created');
      setShowCreate(false);
      navigate(`/admin/procurement/rfq/${r.data.data._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Create failed'); }
  };

  const handleAction = async (id, action) => {
    try {
      await api.put(`/admin/procurement/rfq/${id}/${action}`);
      toast.success(`RFQ ${action}d`);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productName: '', quantity: 1, unit: 'pcs' }] }));
  const updateItem = (i, k, v) => setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items }; });

  const columns = [
    { header: 'RFQ #',      accessor: 'rfqNumber', render: r => <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.rfqNumber}</span> },
    { header: 'Title',      accessor: 'title',     render: r => <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{r.title}</p> },
    { header: 'Vendors',    accessor: 'vendors',   render: r => <span className="text-sm">{r.vendors?.length || 0}</span> },
    { header: 'Responses',  accessor: 'responses', render: r => <span className="text-sm">{r.vendors?.filter(v => v.status === 'responded').length || 0}</span> },
    { header: 'Deadline',   accessor: 'submissionDeadline', render: r => <span className="text-xs">{fmtDate(r.submissionDeadline)}</span> },
    { header: 'Status',     accessor: 'status',    render: r => <StatusBadge status={r.status} /> },
    { header: '',           accessor: 'actions',   render: r => (
      <div className="flex gap-1">
        {r.status === 'draft'     && <button onClick={e => { e.stopPropagation(); ask({ title: 'Publish RFQ', message: 'Publish this RFQ to vendors?', type: 'info', onConfirm: () => handleAction(r._id, 'publish') }); }} className="px-2 py-1 rounded text-xs font-semibold text-white" style={{ background: '#3B82F6' }}>Publish</button>}
        {r.status === 'published' && <button onClick={e => { e.stopPropagation(); ask({ title: 'Close RFQ', message: 'Close this RFQ for new responses?', type: 'warning', onConfirm: () => handleAction(r._id, 'close') }); }} className="px-2 py-1 rounded text-xs font-semibold text-white" style={{ background: '#8B5CF6' }}>Close</button>}
      </div>
    )},
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Request for Quotations" subtitle={`${total} RFQs`} />
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: '#FF7A00' }}>
          <FiPlus size={16} /> New RFQ
        </button>
      </div>

      <SearchToolbar value={search} onChange={setSearch} placeholder="Search RFQ number, title…" />
      <FilterToolbar filters={[{ key: 'status', label: 'Status', options: STATUS_OPTS, value: filters.status, onChange: v => setFilter('status', v) }]} />

      <DataTable columns={columns} data={rfqs} loading={loading} onRowClick={r => navigate(`/admin/procurement/rfq/${r._id}`)} emptyMessage="No RFQs found" />
      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg mx-4 rounded-2xl p-6 space-y-4" style={{ background: 'var(--card)' }}>
            <h3 className="font-bold" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>New RFQ</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
              <input type="date" placeholder="Submission Deadline" value={form.submissionDeadline} onChange={e => setForm(f => ({ ...f, submissionDeadline: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold" style={{ color: 'var(--text-4)' }}>ITEMS</p>
                  <button type="button" onClick={addItem} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-2)', color: '#FF7A00' }}>+ Add</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <input required placeholder="Product" value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)}
                      className="col-span-2 px-2 py-1.5 rounded border text-xs outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                    <input type="number" min={1} placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
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

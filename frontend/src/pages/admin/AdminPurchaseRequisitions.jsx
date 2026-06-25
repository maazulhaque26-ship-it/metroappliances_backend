import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiChevronRight } from 'react-icons/fi';
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

const fmtDate     = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtCurrency = v => `₹${(v || 0).toLocaleString('en-IN')}`;

const STATUS_OPTS = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Manager Review', value: 'manager_review' },
  { label: 'Finance Review', value: 'finance_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Converted', value: 'converted' },
];

const PRIORITY_OPTS = [
  { label: 'All', value: '' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

const PRIORITY_COLORS = { low: '#6B7280', medium: '#3B82F6', high: '#F59E0B', urgent: '#EF4444' };

export default function AdminPurchaseRequisitions() {
  const navigate  = useNavigate();
  const [prs,     setPRs]    = useState([]);
  const [total,   setTotal]  = useState(0);
  const [loading, setLoading] = useState(false);
  const { page, limit, setPage } = usePagination();
  const { query: search, setQuery: setSearch, debouncedQuery: debouncedSearch } = useSearch();
  const { filters, setFilter } = useFilters({ status: '', priority: '' });
  const { open: confirmOpen, ask, cancel, confirm: runConfirm, loading: confirming, title: confirmTitle, message: confirmMsg } = useConfirm();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', justification: '', priority: 'medium', requiredByDate: '', items: [{ productName: '', quantity: 1, unit: 'pcs', estimatedCost: 0 }] });

  const fetchPRs = useCallback(() => {
    setLoading(true);
    api.get('/admin/procurement/requisitions', { params: { search: debouncedSearch, status: filters.status, priority: filters.priority, page, limit } })
      .then(r => { setPRs(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, filters.status, filters.priority, page, limit]);

  React.useEffect(() => { fetchPRs(); }, [fetchPRs]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/procurement/requisitions', form);
      toast.success('Purchase requisition created');
      setShowCreate(false);
      setForm({ title: '', justification: '', priority: 'medium', requiredByDate: '', items: [{ productName: '', quantity: 1, unit: 'pcs', estimatedCost: 0 }] });
      fetchPRs();
    } catch (err) { toast.error(err.response?.data?.message || 'Create failed'); }
  };

  const handleAction = async (id, action) => {
    try {
      await api.put(`/admin/procurement/requisitions/${id}/${action}`);
      toast.success(`Requisition ${action}d`);
      fetchPRs();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productName: '', quantity: 1, unit: 'pcs', estimatedCost: 0 }] }));
  const updateItem = (i, field, value) => setForm(f => {
    const items = [...f.items]; items[i] = { ...items[i], [field]: value }; return { ...f, items };
  });

  const columns = [
    { header: 'PR #',      accessor: 'prNumber', render: r => <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.prNumber}</span> },
    { header: 'Title',     accessor: 'title', render: r => <div><p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{r.title}</p><p className="text-xs" style={{ color: 'var(--text-4)' }}>by {r.requestedByName}</p></div> },
    { header: 'Priority',  accessor: 'priority', render: r => <span className="text-xs font-bold capitalize" style={{ color: PRIORITY_COLORS[r.priority] }}>{r.priority}</span> },
    { header: 'Est. Cost', accessor: 'totalEstimatedCost', render: r => <span className="text-sm">{fmtCurrency(r.totalEstimatedCost)}</span> },
    { header: 'Req. By',   accessor: 'requiredByDate', render: r => <span className="text-xs">{fmtDate(r.requiredByDate)}</span> },
    { header: 'Status',    accessor: 'status', render: r => <StatusBadge status={r.status} /> },
    { header: '',          accessor: 'actions', render: r => (
      <div className="flex gap-1.5">
        {r.status === 'draft' && <button onClick={e => { e.stopPropagation(); ask({ title: 'Submit Requisition', message: 'Submit this PR for approval?', type: 'info', onConfirm: () => handleAction(r._id, 'submit') }); }} className="px-2 py-1 rounded text-xs font-semibold text-white" style={{ background: '#3B82F6' }}>Submit</button>}
        {['submitted','manager_review','finance_review'].includes(r.status) && (
          <>
            <button onClick={e => { e.stopPropagation(); ask({ title: 'Approve Requisition', message: 'Approve this PR?', type: 'info', onConfirm: () => handleAction(r._id, 'approve') }); }} className="px-2 py-1 rounded text-xs font-semibold text-white" style={{ background: '#10B981' }}>Approve</button>
            <button onClick={e => { e.stopPropagation(); ask({ title: 'Reject Requisition', message: 'Reject this PR?', type: 'danger', onConfirm: () => handleAction(r._id, 'reject') }); }} className="px-2 py-1 rounded text-xs font-semibold text-white" style={{ background: '#EF4444' }}>Reject</button>
          </>
        )}
        <FiChevronRight size={14} style={{ color: 'var(--text-4)' }} />
      </div>
    )},
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Purchase Requisitions" subtitle={`${total} requisitions`} />
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: '#FF7A00' }}>
          <FiPlus size={16} /> New PR
        </button>
      </div>

      <SearchToolbar value={search} onChange={setSearch} placeholder="Search PR number, title…" />
      <FilterToolbar filters={[
        { key: 'status',   label: 'Status',   options: STATUS_OPTS,   value: filters.status,   onChange: v => setFilter('status', v) },
        { key: 'priority', label: 'Priority', options: PRIORITY_OPTS, value: filters.priority, onChange: v => setFilter('priority', v) },
      ]} />

      <DataTable columns={columns} data={prs} loading={loading} onRowClick={r => navigate(`/admin/procurement/requisitions/${r._id}`)} emptyMessage="No purchase requisitions found" />
      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-xl mx-4 rounded-2xl p-6 space-y-4 max-h-screen overflow-y-auto" style={{ background: 'var(--card)' }}>
            <h3 className="font-bold" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>New Purchase Requisition</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                </select>
                <input type="date" value={form.requiredByDate} onChange={e => setForm(f => ({ ...f, requiredByDate: e.target.value }))}
                  className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
              </div>
              <textarea placeholder="Justification" rows={2} value={form.justification} onChange={e => setForm(f => ({ ...f, justification: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold" style={{ color: 'var(--text-4)' }}>ITEMS</p>
                  <button type="button" onClick={addItem} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-2)', color: '#FF7A00' }}>+ Add Item</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>
                    <input placeholder="Product name" required value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)}
                      className="col-span-2 px-2 py-1.5 rounded border text-xs outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                    <input type="number" min={1} placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                      className="px-2 py-1.5 rounded border text-xs outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                    <input type="number" min={0} placeholder="Est. cost" value={item.estimatedCost} onChange={e => updateItem(i, 'estimatedCost', Number(e.target.value))}
                      className="px-2 py-1.5 rounded border text-xs outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
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

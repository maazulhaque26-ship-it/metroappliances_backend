import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye, FiX } from 'react-icons/fi';
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
  { label: 'All',          value: '' },
  { label: 'Draft',        value: 'draft' },
  { label: 'Pending',      value: 'pending' },
  { label: 'Receiving',    value: 'receiving' },
  { label: 'Quality Check',value: 'quality_check' },
  { label: 'Completed',    value: 'completed' },
  { label: 'Cancelled',    value: 'cancelled' },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const formatINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const INITIAL_FORM = { warehouse: '', supplier: '', supplierInvoice: '', purchaseOrder: '', remarks: '' };

export default function AdminGRNList() {
  const navigate = useNavigate();
  const { page, setPage, total, setTotal, limit } = usePagination();
  const { filters, setFilter, toParams }          = useFilters({ status: '' });
  const { open: confirmOpen, ask, cancel, loading: cancelling } = useConfirm();

  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [whFilter,   setWhFilter]   = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [form,       setForm]       = useState(INITIAL_FORM);
  const [saving,     setSaving]     = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => {
    api.get('/admin/warehouses', { params: { limit: 100 } })
      .then(r => setWarehouses(r.data.data || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/admin/grn', {
      params: { page, limit, warehouseId: whFilter || undefined, ...toParams() },
    })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [page, limit, whFilter, toParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.warehouse) return toast.error('Warehouse is required');
    setSaving(true);
    try {
      const r = await api.post('/admin/grn', form);
      toast.success('GRN created');
      setModalOpen(false);
      navigate(`/admin/inventory/grn/${r.data.data._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Create failed'); }
    finally { setSaving(false); }
  };

  const handleCancel = (grn) => {
    setCancelTarget(grn);
    ask(`Cancel GRN "${grn.grnNumber}"?`);
  };

  const confirmCancel = async () => {
    try {
      await api.put(`/admin/grn/${cancelTarget._id}/cancel`, { reason: 'Admin cancelled' });
      toast.success('GRN cancelled');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Cancel failed'); }
  };

  const columns = [
    { key: 'grnNumber', label: 'GRN No', render: (r) => (
        <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.grnNumber}</span>
      )},
    { key: 'warehouse', label: 'Warehouse', render: (r) => (
        <span className="text-sm" style={{ color: 'var(--text)' }}>{r.warehouse?.name || '—'}</span>
      )},
    { key: 'supplier', label: 'Supplier', render: (r) => (
        <span className="text-sm" style={{ color: 'var(--text)' }}>{r.supplier || '—'}</span>
      )},
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} label={r.status.replace(/_/g, ' ')} /> },
    { key: 'items', label: 'Items / Value', render: (r) => (
        <div>
          <p className="text-sm" style={{ color: 'var(--text)' }}>{r.totalItems} units</p>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{formatINR(r.totalValue)}</p>
        </div>
      )},
    { key: 'date', label: 'Date', render: (r) => (
        <span className="text-xs" style={{ color: 'var(--text-4)' }}>{fmtDate(r.createdAt)}</span>
      )},
    { key: 'actions', label: '', render: (r) => (
        <div className="flex items-center gap-2 justify-end">
          <button onClick={() => navigate(`/admin/inventory/grn/${r._id}`)} className="p-1.5 rounded hover:opacity-70"><FiEye size={14} /></button>
          {!['completed', 'cancelled'].includes(r.status) && (
            <button onClick={() => handleCancel(r)} className="p-1.5 rounded hover:opacity-70 text-red-500"><FiX size={14} /></button>
          )}
        </div>
      )},
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <SectionHeader
          title="Goods Receipt Notes (GRN)"
          subtitle={`${total} records`}
          actions={
            <button onClick={() => { setForm(INITIAL_FORM); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: '#FF7A00' }}>
              <FiPlus size={14} /> New GRN
            </button>
          }
        />

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

        <DataTable columns={columns} data={rows} loading={loading} onRowClick={r => navigate(`/admin/inventory/grn/${r._id}`)} />
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold" style={{ color: 'var(--text)' }}>New GRN</h2>
              <button onClick={() => setModalOpen(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Warehouse *</label>
                <select value={form.warehouse} onChange={e => setForm(p => ({ ...p, warehouse: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                  <option value="">Select warehouse</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
                </select>
              </div>
              {[
                { key: 'supplier',        label: 'Supplier Name',     placeholder: 'Supplier Co. Ltd' },
                { key: 'supplierInvoice', label: 'Supplier Invoice',  placeholder: 'INV-2026-001' },
                { key: 'purchaseOrder',   label: 'Purchase Order No', placeholder: 'PO-2026-001' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>{f.label}</label>
                  <input type="text" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#FF7A00' }}>
                  {saving ? 'Creating…' : 'Create GRN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen} title="Cancel GRN"
        message={`Cancel GRN "${cancelTarget?.grnNumber}"? This cannot be undone.`}
        type="danger" loading={cancelling} onConfirm={confirmCancel} onCancel={cancel}
      />
    </AdminLayout>
  );
}

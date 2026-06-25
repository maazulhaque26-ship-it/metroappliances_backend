import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiPlay, FiCheckCircle, FiEye, FiX } from 'react-icons/fi';
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
  { label: 'All',       value: '' },
  { label: 'Planned',   value: 'planned' },
  { label: 'Started',   value: 'started' },
  { label: 'Completed', value: 'completed' },
  { label: 'Approved',  value: 'approved' },
  { label: 'Cancelled', value: 'cancelled' },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

export default function AdminCycleCount() {
  const navigate = useNavigate();
  const { page, setPage, total, setTotal, limit } = usePagination();
  const { filters, setFilter, toParams }          = useFilters({ status: '' });
  const { open: confirmOpen, ask, cancel, loading: acting } = useConfirm();

  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [zones,      setZones]      = useState([]);
  const [whFilter,   setWhFilter]   = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [form,       setForm]       = useState({ warehouse: '', zone: '', scheduledDate: '', notes: '' });
  const [saving,     setSaving]     = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType,   setActionType]   = useState('');

  useEffect(() => {
    api.get('/admin/warehouses', { params: { limit: 100 } })
      .then(r => setWarehouses(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.warehouse) { setZones([]); return; }
    api.get('/admin/warehouse-zones', { params: { warehouseId: form.warehouse, limit: 100 } })
      .then(r => setZones(r.data.data || [])).catch(() => {});
  }, [form.warehouse]);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/admin/inventory/cycle-counts', {
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
      await api.post('/admin/inventory/cycle-counts', form);
      toast.success('Cycle count created');
      setModalOpen(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Create failed'); }
    finally { setSaving(false); }
  };

  const doAction = (cc, type) => {
    setActionTarget(cc);
    setActionType(type);
    ask(`${type === 'start' ? 'Start' : type === 'complete' ? 'Complete' : 'Approve'} cycle count "${cc.countNumber}"?`);
  };

  const confirmAction = async () => {
    const endpoint = actionType === 'start' ? 'start' : actionType === 'complete' ? 'complete' : 'approve';
    try {
      await api.put(`/admin/inventory/cycle-counts/${actionTarget._id}/${endpoint}`);
      toast.success(`Cycle count ${endpoint}d`);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const varianceColor = (v) => v > 0 ? '#10B981' : v < 0 ? '#EF4444' : 'var(--text-4)';

  const columns = [
    { key: 'countNumber', label: 'Count No', render: (r) => (
        <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.countNumber}</span>
      )},
    { key: 'warehouse', label: 'Warehouse', render: (r) => <span className="text-sm" style={{ color: 'var(--text)' }}>{r.warehouse?.name || '—'}</span> },
    { key: 'zone',      label: 'Zone',      render: (r) => <span className="text-sm" style={{ color: 'var(--text)' }}>{r.zone?.name || 'All zones'}</span> },
    { key: 'items', label: 'Items / Variance', render: (r) => (
        <div>
          <p className="text-sm" style={{ color: 'var(--text)' }}>{r.items?.length || 0} items</p>
          {r.totalVariance !== 0 && (
            <p className="text-xs font-semibold" style={{ color: varianceColor(r.totalVariance) }}>
              Variance: {r.totalVariance > 0 ? '+' : ''}{r.totalVariance}
            </p>
          )}
        </div>
      )},
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'date', label: 'Scheduled', render: (r) => <span className="text-xs" style={{ color: 'var(--text-4)' }}>{fmtDate(r.scheduledDate)}</span> },
    { key: 'actions', label: '', render: (r) => (
        <div className="flex items-center gap-2 justify-end">
          {r.status === 'planned'   && <button onClick={() => doAction(r, 'start')}    className="p-1.5 rounded hover:opacity-70 text-blue-500"><FiPlay size={14} /></button>}
          {r.status === 'started'   && <button onClick={() => doAction(r, 'complete')} className="p-1.5 rounded hover:opacity-70 text-amber-500"><FiCheckCircle size={14} /></button>}
          {r.status === 'completed' && <button onClick={() => doAction(r, 'approve')}  className="p-1.5 rounded hover:opacity-70 text-green-600"><FiCheckCircle size={14} /></button>}
        </div>
      )},
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <SectionHeader
          title="Cycle Counts"
          subtitle={`${total} counts`}
          actions={
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: '#FF7A00' }}>
              <FiPlus size={14} /> New Count
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

        <DataTable columns={columns} data={rows} loading={loading} />
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold" style={{ color: 'var(--text)' }}>New Cycle Count</h2>
              <button onClick={() => setModalOpen(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Warehouse *</label>
                <select value={form.warehouse} onChange={e => setForm(p => ({ ...p, warehouse: e.target.value, zone: '' }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                  <option value="">Select warehouse</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Zone (optional — leave blank for full warehouse)</label>
                <select value={form.zone} onChange={e => setForm(p => ({ ...p, zone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                  <option value="">All Zones</option>
                  {zones.map(z => <option key={z._id} value={z._id}>{z.name} ({z.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Scheduled Date</label>
                <input type="date" value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#FF7A00' }}>
                  {saving ? 'Creating…' : 'Create Count'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={`${actionType === 'start' ? 'Start' : actionType === 'complete' ? 'Complete' : 'Approve'} Cycle Count`}
        message={actionType === 'approve'
          ? 'Approving will apply all variance adjustments to inventory. This cannot be undone.'
          : `Confirm ${actionType} of this cycle count.`}
        type={actionType === 'approve' ? 'danger' : 'success'}
        loading={acting}
        onConfirm={confirmAction}
        onCancel={cancel}
      />
    </AdminLayout>
  );
}

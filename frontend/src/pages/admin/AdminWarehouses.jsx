import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiEye, FiPlus, FiX } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import {
  DataTable, Pagination, SearchToolbar, FilterToolbar,
  SectionHeader, StatusBadge, ConfirmDialog, EmptyState, ExportButton,
} from '../../components/shared';
import { useSearch }     from '../../hooks/useSearch';
import { usePagination } from '../../hooks/usePagination';
import { useFilters }    from '../../hooks/useFilters';
import { useExport }     from '../../hooks/useExport';
import { useConfirm }    from '../../hooks/useModal';
import api from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_OPTS = [
  { label: 'All Status', value: '' },
  { label: 'Active',      value: 'active' },
  { label: 'Inactive',    value: 'inactive' },
  { label: 'Maintenance', value: 'maintenance' },
];

const INITIAL_FORM = { code: '', name: '', address: '', city: '', state: '', country: 'India', pincode: '', gst: '', phone: '', email: '', totalCapacity: '', timezone: 'Asia/Kolkata', notes: '' };

export default function AdminWarehouses() {
  const navigate = useNavigate();
  const { query, setQuery, debouncedQuery, clear: clearSearch } = useSearch();
  const { page, setPage, total, setTotal, limit }               = usePagination();
  const { filters, setFilter, clearAll: clearFilters, toParams } = useFilters({ status: '' });
  const { exportCSV }                                            = useExport();
  const { open: confirmOpen, ask, cancel, confirm, loading: deleting } = useConfirm();

  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(INITIAL_FORM);
  const [saving,    setSaving]    = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/admin/warehouses', {
      params: { page, limit, search: debouncedQuery, ...toParams() },
    })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Failed to load warehouses'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedQuery, toParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditing(null); setForm(INITIAL_FORM); setModalOpen(true); };
  const openEdit   = (wh) => {
    setEditing(wh);
    setForm({
      code: wh.code, name: wh.name, address: wh.address, city: wh.city,
      state: wh.state, country: wh.country || 'India', pincode: wh.pincode || '',
      gst: wh.gst || '', phone: wh.phone || '', email: wh.email || '',
      totalCapacity: wh.totalCapacity || '', timezone: wh.timezone || 'Asia/Kolkata',
      notes: wh.notes || '', status: wh.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.address || !form.city || !form.state) {
      return toast.error('Code, name, address, city, state are required');
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/warehouses/${editing._id}`, form);
        toast.success('Warehouse updated');
      } else {
        await api.post('/admin/warehouses', form);
        toast.success('Warehouse created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = (wh) => {
    setDeleteTarget(wh);
    ask(`Delete "${wh.name}"? This cannot be undone.`);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/warehouses/${deleteTarget._id}`);
      toast.success('Warehouse deleted');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleExport = () => exportCSV(rows, 'warehouses');

  const columns = [
    { key: 'code',   label: 'Code',     render: (r) => <span className="font-mono font-bold text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-2)', color: '#FF7A00' }}>{r.code}</span> },
    { key: 'name',   label: 'Warehouse', render: (r) => (
        <div>
          <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{r.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{r.city}, {r.state}</p>
        </div>
      )},
    { key: 'status', label: 'Status',   render: (r) => <StatusBadge status={r.status} /> },
    { key: 'capacity', label: 'Capacity', render: (r) => (
        <span className="text-sm" style={{ color: 'var(--text)' }}>
          {r.usedCapacity}/{r.totalCapacity || '—'}
        </span>
      )},
    { key: 'gst',    label: 'GST',      render: (r) => <span className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>{r.gst || '—'}</span> },
    { key: 'actions', label: '', render: (r) => (
        <div className="flex items-center gap-2 justify-end">
          <button onClick={() => navigate(`/admin/warehouses/${r._id}`)} className="p-1.5 rounded hover:opacity-70" title="View"><FiEye size={14} /></button>
          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:opacity-70" title="Edit"><FiEdit2 size={14} /></button>
          <button onClick={() => handleDelete(r)} className="p-1.5 rounded hover:opacity-70 text-red-500" title="Delete"><FiTrash2 size={14} /></button>
        </div>
      )},
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <SectionHeader
          title="Warehouses"
          subtitle={`${total} warehouses`}
          actions={
            <div className="flex gap-2">
              <ExportButton onExportCSV={handleExport} />
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: '#FF7A00' }}>
                <FiPlus size={14} /> Add Warehouse
              </button>
            </div>
          }
        />

        <div className="flex flex-wrap gap-3">
          <SearchToolbar value={query} onChange={setQuery} onClear={clearSearch} placeholder="Search by name, code, city…" />
          <FilterToolbar
            filters={STATUS_OPTS.map(o => ({ ...o, active: filters.status === o.value }))}
            onSelect={(v) => { setFilter('status', v); setPage(1); }}
          />
        </div>

        <DataTable columns={columns} data={rows} loading={loading} onRowClick={(r) => navigate(`/admin/warehouses/${r._id}`)} />
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{editing ? 'Edit Warehouse' : 'New Warehouse'}</h2>
              <button onClick={() => setModalOpen(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'code',          label: 'Code *',     placeholder: 'MUM01', disabled: !!editing },
                  { key: 'name',          label: 'Name *',     placeholder: 'Mumbai Central Warehouse' },
                  { key: 'address',       label: 'Address *',  placeholder: '123 Main Road', span: 2 },
                  { key: 'city',          label: 'City *',     placeholder: 'Mumbai' },
                  { key: 'state',         label: 'State *',    placeholder: 'Maharashtra' },
                  { key: 'country',       label: 'Country',    placeholder: 'India' },
                  { key: 'pincode',       label: 'Pincode',    placeholder: '400001' },
                  { key: 'gst',           label: 'GST Number', placeholder: '27AABCU9603R1ZX' },
                  { key: 'phone',         label: 'Phone',      placeholder: '+91 98765 43210' },
                  { key: 'email',         label: 'Email',      placeholder: 'warehouse@metro.com' },
                  { key: 'totalCapacity', label: 'Total Capacity (units)', placeholder: '10000', type: 'number' },
                  { key: 'timezone',      label: 'Timezone',   placeholder: 'Asia/Kolkata' },
                ].map(f => (
                  <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      value={form[f.key] || ''}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      disabled={f.disabled}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
                    />
                  </div>
                ))}
                {editing && (
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Status</label>
                    <select
                      value={form.status || 'active'}
                      onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Notes</label>
                  <textarea
                    value={form.notes || ''}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    placeholder="Optional notes…"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#FF7A00' }}>
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Warehouse"
        message={`Delete "${deleteTarget?.name}"? All associated zones and settings will also be removed.`}
        type="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={cancel}
      />
    </AdminLayout>
  );
}

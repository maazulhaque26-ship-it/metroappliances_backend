import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiX } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import {
  DataTable, Pagination, SearchToolbar, FilterToolbar,
  SectionHeader, StatusBadge, ConfirmDialog, ExportButton,
} from '../../components/shared';
import { useSearch }     from '../../hooks/useSearch';
import { usePagination } from '../../hooks/usePagination';
import { useExport }     from '../../hooks/useExport';
import { useConfirm }    from '../../hooks/useModal';
import api from '../../services/api';
import { toast } from 'react-toastify';

const ZONE_TYPES = ['receiving', 'storage', 'picking', 'packing', 'returns', 'damaged', 'dispatch', 'custom'];
const TYPE_COLORS = {
  receiving: '#3B82F6', storage: '#8B5CF6', picking: '#F59E0B', packing: '#10B981',
  returns: '#EF4444', damaged: '#F97316', dispatch: '#06B6D4', custom: '#6B7280',
};
const TYPE_OPTS = [{ label: 'All Types', value: '' }, ...ZONE_TYPES.map(t => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))];

const INITIAL_FORM = { warehouse: '', code: '', name: '', type: 'storage', description: '', capacity: '' };

export default function AdminWarehouseZones() {
  const { query, setQuery, debouncedQuery, clear: clearSearch } = useSearch();
  const { page, setPage, total, setTotal, limit }               = usePagination();
  const { exportCSV }                                           = useExport();
  const { open: confirmOpen, ask, cancel, confirm, loading: deleting } = useConfirm();

  const [rows,       setRows]       = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [whFilter,   setWhFilter]   = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(INITIAL_FORM);
  const [saving,     setSaving]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    api.get('/admin/warehouses', { params: { limit: 100 } })
      .then(r => setWarehouses(r.data.data || []))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/admin/warehouse-zones', {
      params: { page, limit, warehouseId: whFilter || undefined, type: typeFilter || undefined },
    })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [page, limit, whFilter, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditing(null); setForm(INITIAL_FORM); setModalOpen(true); };
  const openEdit   = (z) => {
    setEditing(z);
    setForm({ warehouse: z.warehouse?._id || z.warehouse, code: z.code, name: z.name, type: z.type, description: z.description || '', capacity: z.capacity || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.warehouse || !form.code || !form.name || !form.type) return toast.error('Warehouse, code, name, type required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/warehouse-zones/${editing._id}`, { name: form.name, type: form.type, description: form.description, capacity: form.capacity });
        toast.success('Zone updated');
      } else {
        await api.post('/admin/warehouse-zones', form);
        toast.success('Zone created');
      }
      setModalOpen(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (z) => {
    try {
      await api.put(`/admin/warehouse-zones/${z._id}/toggle`);
      toast.success(`Zone ${z.isActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Toggle failed'); }
  };

  const handleDelete = (z) => { setDeleteTarget(z); ask(`Delete zone "${z.name}"?`); };
  const confirmDelete = async () => {
    try { await api.delete(`/admin/warehouse-zones/${deleteTarget._id}`); toast.success('Zone deleted'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const columns = [
    { key: 'code', label: 'Code', render: (r) => <span className="font-mono font-bold text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-2)', color: TYPE_COLORS[r.type] || '#6B7280' }}>{r.code}</span> },
    { key: 'name', label: 'Zone', render: (r) => (
        <div>
          <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{r.name}</p>
          <p className="text-xs capitalize" style={{ color: 'var(--text-4)' }}>{r.type}</p>
        </div>
      )},
    { key: 'warehouse', label: 'Warehouse', render: (r) => <span className="text-sm" style={{ color: 'var(--text)' }}>{r.warehouse?.name || '—'}</span> },
    { key: 'capacity', label: 'Capacity', render: (r) => <span className="text-sm" style={{ color: 'var(--text)' }}>{r.capacity || '—'}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
    { key: 'actions', label: '', render: (r) => (
        <div className="flex items-center gap-2 justify-end">
          <button onClick={() => handleToggle(r)} className="p-1.5 rounded hover:opacity-70" title={r.isActive ? 'Deactivate' : 'Activate'}>
            {r.isActive ? <FiToggleRight size={16} style={{ color: '#10B981' }} /> : <FiToggleLeft size={16} style={{ color: '#6B7280' }} />}
          </button>
          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:opacity-70"><FiEdit2 size={14} /></button>
          <button onClick={() => handleDelete(r)} className="p-1.5 rounded hover:opacity-70 text-red-500"><FiTrash2 size={14} /></button>
        </div>
      )},
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <SectionHeader
          title="Warehouse Zones"
          subtitle={`${total} zones`}
          actions={
            <div className="flex gap-2">
              <ExportButton onExportCSV={() => exportCSV(rows, 'warehouse-zones')} />
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: '#FF7A00' }}>
                <FiPlus size={14} /> Add Zone
              </button>
            </div>
          }
        />

        <div className="flex flex-wrap gap-3">
          <select
            value={whFilter}
            onChange={e => { setWhFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
          >
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <FilterToolbar
            filters={TYPE_OPTS.map(o => ({ ...o, active: typeFilter === o.value }))}
            onSelect={(v) => { setTypeFilter(v); setPage(1); }}
          />
        </div>

        <DataTable columns={columns} data={rows} loading={loading} />
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{editing ? 'Edit Zone' : 'New Zone'}</h2>
              <button onClick={() => setModalOpen(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {!editing && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Warehouse *</label>
                  <select value={form.warehouse} onChange={e => setForm(p => ({ ...p, warehouse: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'code', label: 'Zone Code *', placeholder: 'REC01', disabled: !!editing },
                  { key: 'name', label: 'Zone Name *', placeholder: 'Receiving Area A' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>{f.label}</label>
                    <input type="text" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      disabled={f.disabled} placeholder={f.placeholder}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Zone Type *</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                  {ZONE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Capacity (units)</label>
                <input type="number" value={form.capacity || ''} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                  placeholder="500"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Description</label>
                <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2} placeholder="Optional description"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
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
        open={confirmOpen} title="Delete Zone"
        message={`Delete zone "${deleteTarget?.name}"? All storage locations in this zone will also be removed.`}
        type="danger" loading={deleting} onConfirm={confirmDelete} onCancel={cancel}
      />
    </AdminLayout>
  );
}

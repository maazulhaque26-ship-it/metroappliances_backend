import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiLayers } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import {
  DataTable, Pagination, SearchToolbar, SectionHeader,
  StatusBadge, ConfirmDialog, ExportButton, FilterToolbar,
} from '../../components/shared';
import { useSearch }     from '../../hooks/useSearch';
import { usePagination } from '../../hooks/usePagination';
import { useExport }     from '../../hooks/useExport';
import { useConfirm }    from '../../hooks/useModal';
import api from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_OPTS = [
  { label: 'All', value: '' }, { label: 'Available', value: 'available' },
  { label: 'Occupied', value: 'occupied' }, { label: 'Reserved', value: 'reserved' },
  { label: 'Blocked', value: 'blocked' },
];

const INIT_FORM  = { warehouse: '', zone: '', rack: '', shelf: '', bin: '', capacity: 1, barcode: '' };
const INIT_BULK  = { warehouse: '', zone: '', rack: '', shelves: '', capacity: 1, barcodePrefix: '' };

export default function AdminWarehouseLocations() {
  const { query, setQuery, debouncedQuery, clear: clearSearch } = useSearch();
  const { page, setPage, total, setTotal, limit }               = usePagination();
  const { exportCSV }                                           = useExport();
  const { open: confirmOpen, ask, cancel, confirm, loading: deleting } = useConfirm();

  const [rows,       setRows]       = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [zones,      setZones]      = useState([]);
  const [whFilter,   setWhFilter]   = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading,    setLoading]    = useState(true);
  const [modalMode,  setModalMode]  = useState(null); // 'single' | 'bulk' | null
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(INIT_FORM);
  const [bulkForm,   setBulkForm]   = useState(INIT_BULK);
  const [saving,     setSaving]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    api.get('/admin/warehouses', { params: { limit: 100 } }).then(r => setWarehouses(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!whFilter) { setZones([]); return; }
    api.get('/admin/warehouse-zones', { params: { warehouseId: whFilter, limit: 200 } }).then(r => setZones(r.data.data || [])).catch(() => {});
  }, [whFilter]);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/admin/warehouse-locations', {
      params: { page, limit, search: debouncedQuery, warehouseId: whFilter || undefined, zoneId: zoneFilter || undefined, status: statusFilter || undefined },
    })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedQuery, whFilter, zoneFilter, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditing(null); setForm(INIT_FORM); setModalMode('single'); };
  const openBulk   = () => { setBulkForm(INIT_BULK); setModalMode('bulk'); };
  const openEdit   = (l) => {
    setEditing(l);
    setForm({ warehouse: l.warehouse?._id || l.warehouse, zone: l.zone?._id || l.zone, rack: l.rack, shelf: l.shelf, bin: l.bin || '', capacity: l.capacity, barcode: l.barcode || '' });
    setModalMode('single');
  };

  const handleSaveSingle = async (e) => {
    e.preventDefault();
    if (!form.warehouse || !form.zone || !form.rack || !form.shelf) return toast.error('Warehouse, zone, rack, shelf required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/warehouse-locations/${editing._id}`, { shelf: form.shelf, bin: form.bin, barcode: form.barcode, capacity: form.capacity });
        toast.success('Location updated');
      } else {
        await api.post('/admin/warehouse-locations', form);
        toast.success('Location created');
      }
      setModalMode(null); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleSaveBulk = async (e) => {
    e.preventDefault();
    if (!bulkForm.warehouse || !bulkForm.zone || !bulkForm.rack || !bulkForm.shelves) {
      return toast.error('Warehouse, zone, rack, shelves required');
    }
    const shelves = bulkForm.shelves.split(',').map(s => s.trim()).filter(Boolean);
    if (!shelves.length) return toast.error('Enter at least one shelf label (comma-separated)');
    setSaving(true);
    try {
      const r = await api.post('/admin/warehouse-locations/bulk', { ...bulkForm, shelves });
      toast.success(`${r.data.data?.length || shelves.length} locations created`);
      setModalMode(null); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Bulk create failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = (l) => { setDeleteTarget(l); ask(`Delete location ${l.rack}-${l.shelf}${l.bin ? `-${l.bin}` : ''}?`); };
  const confirmDelete = async () => {
    try { await api.delete(`/admin/warehouse-locations/${deleteTarget._id}`); toast.success('Location deleted'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const statusColor = { available: '#10B981', occupied: '#EF4444', reserved: '#F59E0B', blocked: '#6B7280' };

  const columns = [
    { key: 'rack',  label: 'Rack',  render: (r) => <span className="font-mono font-bold text-xs" style={{ color: '#FF7A00' }}>{r.rack}</span> },
    { key: 'shelf', label: 'Shelf', render: (r) => <span className="font-mono text-xs" style={{ color: 'var(--text)' }}>{r.shelf}{r.bin ? `-${r.bin}` : ''}</span> },
    { key: 'warehouse', label: 'Warehouse', render: (r) => <span className="text-xs" style={{ color: 'var(--text)' }}>{r.warehouse?.code || '—'}</span> },
    { key: 'zone',  label: 'Zone',  render: (r) => <span className="text-xs" style={{ color: 'var(--text)' }}>{r.zone?.name || '—'}</span> },
    { key: 'capacity', label: 'Cap/Used', render: (r) => <span className="text-xs" style={{ color: 'var(--text)' }}>{r.occupied}/{r.capacity}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'barcode', label: 'Barcode', render: (r) => <span className="font-mono text-xs" style={{ color: 'var(--text-4)' }}>{r.barcode || '—'}</span> },
    { key: 'actions', label: '', render: (r) => (
        <div className="flex items-center gap-2 justify-end">
          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:opacity-70"><FiEdit2 size={14} /></button>
          <button onClick={() => handleDelete(r)} className="p-1.5 rounded hover:opacity-70 text-red-500"><FiTrash2 size={14} /></button>
        </div>
      )},
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <SectionHeader
          title="Storage Locations"
          subtitle={`${total} bins/racks/shelves`}
          actions={
            <div className="flex gap-2">
              <ExportButton onExportCSV={() => exportCSV(rows, 'warehouse-locations')} />
              <button onClick={openBulk} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border" style={{ borderColor: '#FF7A00', color: '#FF7A00' }}>
                <FiLayers size={14} /> Bulk Create
              </button>
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: '#FF7A00' }}>
                <FiPlus size={14} /> Add Location
              </button>
            </div>
          }
        />

        <div className="flex flex-wrap gap-3">
          <SearchToolbar value={query} onChange={setQuery} onClear={clearSearch} placeholder="Search rack, shelf, barcode…" />
          <select value={whFilter} onChange={e => { setWhFilter(e.target.value); setZoneFilter(''); setPage(1); }}
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.code} — {w.name}</option>)}
          </select>
          {zones.length > 0 && (
            <select value={zoneFilter} onChange={e => { setZoneFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
              <option value="">All Zones</option>
              {zones.map(z => <option key={z._id} value={z._id}>{z.code} — {z.name}</option>)}
            </select>
          )}
          <FilterToolbar
            filters={STATUS_OPTS.map(o => ({ ...o, active: statusFilter === o.value }))}
            onSelect={(v) => { setStatusFilter(v); setPage(1); }}
          />
        </div>

        <DataTable columns={columns} data={rows} loading={loading} />
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>

      {/* Single Location Modal */}
      {modalMode === 'single' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{editing ? 'Edit Location' : 'New Location'}</h2>
              <button onClick={() => setModalMode(null)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSaveSingle} className="p-6 space-y-4">
              {!editing && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Warehouse *</label>
                    <select value={form.warehouse} onChange={e => { setForm(p => ({ ...p, warehouse: e.target.value, zone: '' })); api.get('/admin/warehouse-zones', { params: { warehouseId: e.target.value, limit: 200 } }).then(r => setZones(r.data.data || [])); }}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                      <option value="">Select warehouse</option>
                      {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Zone *</label>
                    <select value={form.zone} onChange={e => setForm(p => ({ ...p, zone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                      <option value="">Select zone</option>
                      {zones.map(z => <option key={z._id} value={z._id}>{z.code} — {z.name}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'rack',  label: 'Rack *',  placeholder: 'A1', disabled: !!editing },
                  { key: 'shelf', label: 'Shelf *', placeholder: '01' },
                  { key: 'bin',   label: 'Bin',     placeholder: 'B' },
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Capacity</label>
                  <input type="number" min={1} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Barcode</label>
                  <input type="text" value={form.barcode || ''} onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalMode(null)} className="px-5 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#FF7A00' }}>
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {modalMode === 'bulk' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Bulk Create Locations</h2>
              <button onClick={() => setModalMode(null)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSaveBulk} className="p-6 space-y-4">
              <p className="text-xs" style={{ color: 'var(--text-4)' }}>Creates one location per shelf entry for the specified rack. Enter shelf labels as comma-separated values.</p>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Warehouse *</label>
                <select value={bulkForm.warehouse} onChange={e => { setBulkForm(p => ({ ...p, warehouse: e.target.value, zone: '' })); api.get('/admin/warehouse-zones', { params: { warehouseId: e.target.value, limit: 200 } }).then(r => setZones(r.data.data || [])); }}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                  <option value="">Select warehouse</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Zone *</label>
                <select value={bulkForm.zone} onChange={e => setBulkForm(p => ({ ...p, zone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                  <option value="">Select zone</option>
                  {zones.map(z => <option key={z._id} value={z._id}>{z.code} — {z.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Rack Label *</label>
                  <input type="text" value={bulkForm.rack} onChange={e => setBulkForm(p => ({ ...p, rack: e.target.value }))} placeholder="A1"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Capacity per bin</label>
                  <input type="number" min={1} value={bulkForm.capacity} onChange={e => setBulkForm(p => ({ ...p, capacity: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Shelf Labels * (comma-separated)</label>
                <input type="text" value={bulkForm.shelves} onChange={e => setBulkForm(p => ({ ...p, shelves: e.target.value }))} placeholder="01, 02, 03, 04, 05"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
                  {bulkForm.shelves ? `Will create ${bulkForm.shelves.split(',').filter(s => s.trim()).length} locations` : 'e.g. "01, 02, 03" creates 3 locations'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Barcode Prefix (optional)</label>
                <input type="text" value={bulkForm.barcodePrefix} onChange={e => setBulkForm(p => ({ ...p, barcodePrefix: e.target.value }))} placeholder="WH-MUM01"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalMode(null)} className="px-5 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#FF7A00' }}>
                  {saving ? 'Creating…' : 'Bulk Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen} title="Delete Location"
        message={`Delete location ${deleteTarget?.rack}-${deleteTarget?.shelf}?`}
        type="danger" loading={deleting} onConfirm={confirmDelete} onCancel={cancel}
      />
    </AdminLayout>
  );
}

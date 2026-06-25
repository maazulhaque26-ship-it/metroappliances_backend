import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiKey, FiX } from 'react-icons/fi';
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

const ROLES = ['warehouse_manager', 'supervisor', 'picker', 'packer', 'loader', 'auditor'];
const ROLE_OPTS = [{ label: 'All Roles', value: '' }, ...ROLES.map(r => ({ label: r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: r }))];
const STATUS_OPTS = [{ label: 'All Status', value: '' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }, { label: 'Suspended', value: 'suspended' }];

const INIT_FORM = { name: '', email: '', phone: '', password: '', role: 'picker', warehouse: '', employeeId: '' };

export default function AdminWarehouseUsers() {
  const { query, setQuery, debouncedQuery, clear: clearSearch } = useSearch();
  const { page, setPage, total, setTotal, limit }               = usePagination();
  const { exportCSV }                                           = useExport();
  const { open: confirmOpen, ask, cancel, confirm, loading: deleting } = useConfirm();

  const [rows,       setRows]       = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [whFilter,   setWhFilter]   = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [pwModal,    setPwModal]    = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(INIT_FORM);
  const [newPassword, setNewPassword] = useState('');
  const [saving,     setSaving]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    api.get('/admin/warehouses', { params: { limit: 100 } }).then(r => setWarehouses(r.data.data || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/admin/warehouse-users', {
      params: { page, limit, search: debouncedQuery, warehouseId: whFilter || undefined, role: roleFilter || undefined, status: statusFilter || undefined },
    })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedQuery, whFilter, roleFilter, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditing(null); setForm(INIT_FORM); setModalOpen(true); };
  const openEdit   = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, phone: u.phone || '', password: '', role: u.role, warehouse: u.warehouse?._id || u.warehouse, employeeId: u.employeeId || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.warehouse) return toast.error('Name, email, warehouse required');
    if (!editing && !form.password) return toast.error('Password required for new users');
    setSaving(true);
    try {
      const payload = { name: form.name, phone: form.phone, role: form.role, warehouse: form.warehouse, employeeId: form.employeeId };
      if (!editing) { payload.email = form.email; payload.password = form.password; }
      if (editing) {
        await api.put(`/admin/warehouse-users/${editing._id}`, payload);
        toast.success('User updated');
      } else {
        await api.post('/admin/warehouse-users', payload);
        toast.success('User created');
      }
      setModalOpen(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (u) => {
    try { await api.put(`/admin/warehouse-users/${u._id}/toggle`); toast.success('Status updated'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Toggle failed'); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await api.put(`/admin/warehouse-users/${editing._id}/password`, { password: newPassword });
      toast.success('Password reset'); setPwModal(false); setNewPassword('');
    } catch (err) { toast.error(err.response?.data?.message || 'Reset failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = (u) => { setDeleteTarget(u); ask(`Delete user "${u.name}"?`); };
  const confirmDelete = async () => {
    try { await api.delete(`/admin/warehouse-users/${deleteTarget._id}`); toast.success('User deleted'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const columns = [
    { key: 'name', label: 'User', render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0" style={{ background: '#FF7A00', color: '#fff' }}>
            {r.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{r.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-4)' }}>{r.email}</p>
          </div>
        </div>
      )},
    { key: 'role', label: 'Role', render: (r) => <span className="text-xs capitalize px-2 py-1 rounded" style={{ background: 'var(--bg-2)', color: 'var(--text)' }}>{r.role.replace(/_/g, ' ')}</span> },
    { key: 'warehouse', label: 'Warehouse', render: (r) => <span className="text-xs" style={{ color: 'var(--text)' }}>{r.warehouse?.name || '—'}</span> },
    { key: 'employeeId', label: 'Emp ID', render: (r) => <span className="font-mono text-xs" style={{ color: 'var(--text-4)' }}>{r.employeeId || '—'}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', label: '', render: (r) => (
        <div className="flex items-center gap-2 justify-end">
          <button onClick={() => handleToggle(r)} className="p-1.5 rounded hover:opacity-70" title={r.status === 'active' ? 'Deactivate' : 'Activate'}>
            {r.status === 'active' ? <FiToggleRight size={16} style={{ color: '#10B981' }} /> : <FiToggleLeft size={16} style={{ color: '#6B7280' }} />}
          </button>
          <button onClick={() => { setEditing(r); setPwModal(true); }} className="p-1.5 rounded hover:opacity-70" title="Reset password"><FiKey size={14} /></button>
          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:opacity-70"><FiEdit2 size={14} /></button>
          <button onClick={() => handleDelete(r)} className="p-1.5 rounded hover:opacity-70 text-red-500"><FiTrash2 size={14} /></button>
        </div>
      )},
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <SectionHeader
          title="Warehouse Users"
          subtitle={`${total} users across all warehouses`}
          actions={
            <div className="flex gap-2">
              <ExportButton onExportCSV={() => exportCSV(rows, 'warehouse-users')} />
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: '#FF7A00' }}>
                <FiPlus size={14} /> Add User
              </button>
            </div>
          }
        />

        <div className="flex flex-wrap gap-3">
          <SearchToolbar value={query} onChange={setQuery} onClear={clearSearch} placeholder="Search name, email, employee ID…" />
          <select value={whFilter} onChange={e => { setWhFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <FilterToolbar
            filters={ROLE_OPTS.map(o => ({ ...o, active: roleFilter === o.value }))}
            onSelect={(v) => { setRoleFilter(v); setPage(1); }}
          />
          <FilterToolbar
            filters={STATUS_OPTS.map(o => ({ ...o, active: statusFilter === o.value }))}
            onSelect={(v) => { setStatusFilter(v); setPage(1); }}
          />
        </div>

        <DataTable columns={columns} data={rows} loading={loading} />
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>

      {/* Create / Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{editing ? 'Edit User' : 'New Warehouse User'}</h2>
              <button onClick={() => setModalOpen(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'name',       label: 'Full Name *',     placeholder: 'Raj Kumar' },
                  { key: 'email',      label: 'Email *',         placeholder: 'raj@warehouse.com', disabled: !!editing },
                  { key: 'phone',      label: 'Phone',           placeholder: '+91 98765 43210' },
                  { key: 'employeeId', label: 'Employee ID',     placeholder: 'EMP001' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>{f.label}</label>
                    <input type="text" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      disabled={f.disabled} placeholder={f.placeholder}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                  </div>
                ))}
                {!editing && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Password *</label>
                    <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Role</label>
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                    {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Warehouse *</label>
                  <select value={form.warehouse} onChange={e => setForm(p => ({ ...p, warehouse: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
                  </select>
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

      {/* Reset Password Modal */}
      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Reset Password</h2>
              <button onClick={() => { setPwModal(false); setNewPassword(''); }}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-4)' }}>Reset password for <strong style={{ color: 'var(--text)' }}>{editing?.name}</strong></p>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setPwModal(false); setNewPassword(''); }} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#EF4444' }}>
                  {saving ? 'Resetting…' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen} title="Delete Warehouse User"
        message={`Delete "${deleteTarget?.name}"? This action cannot be undone.`}
        type="danger" loading={deleting} onConfirm={confirmDelete} onCancel={cancel}
      />
    </AdminLayout>
  );
}

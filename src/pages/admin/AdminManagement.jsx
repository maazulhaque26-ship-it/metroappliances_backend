import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  FiPlus, FiTrash2, FiSearch, FiX, FiShield, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiToggleLeft, FiToggleRight,
  FiAlertTriangle, FiCheck,
} from 'react-icons/fi';

const ROLE_BADGE = {
  super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
  admin:       'bg-amber-50 text-amber-700 border-amber-200',
  moderator:   'bg-blue-50 text-blue-700 border-blue-200',
};

const ROLE_PERMISSIONS = {
  super_admin: ['All permissions', 'Create/delete admins', 'Change roles', 'Full store access'],
  admin:       ['Manage products', 'Manage orders', 'Manage reviews', 'Manage categories', 'View subscribers', 'Manage settings'],
  moderator:   ['Approve/reject reviews', 'View dashboard'],
};

function CreateAdminModal({ onClose, onCreated }) {
  const [form,   setForm]   = useState({ name: '', email: '', password: '', role: 'admin' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('All fields required');
    try {
      setSaving(true);
      const { data } = await API.post('/admin/admins', form);
      onCreated(data.user);
      onClose();
      toast.success(`${data.user.role} account created`);
    } catch (err) { toast.error(err.response?.data?.message || 'Create failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/80">
      <div className="w-full max-w-md bg-white border border-[#E5E5E5] shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#E5E5E5]">
          <h2 className="text-xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>Create Admin Account</h2>
          <button onClick={onClose} className="text-[#666666] hover:text-[#111111] transition-colors"><FiX size={20} /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">Full Name *</label>
            <input type="text" className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="John Doe"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">Email *</label>
            <input type="email" className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="admin@example.com"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">Password *</label>
            <input type="password" className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111]" placeholder="Min 6 characters"
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-2">Role *</label>
            <select className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3 text-sm outline-none focus:border-[#111111]" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>

          {/* Permission preview */}
          <div className="p-4 bg-[#F7F6F3] border border-[#E5E5E5] text-xs space-y-2">
            <p className="text-[#111111] font-bold uppercase tracking-widest mb-3">Permissions granted:</p>
            {ROLE_PERMISSIONS[form.role]?.map(p => (
              <div key={p} className="flex items-center gap-3 text-[#666666] font-medium">
                <FiCheck size={14} className="text-green-600 flex-shrink-0" /> {p}
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4 border-t border-[#E5E5E5]">
            <button type="button" onClick={onClose} className="w-1/3 py-4 border border-[#111111] text-[#111111] text-xs font-bold uppercase tracking-widest hover:bg-[#F7F6F3] transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="w-2/3 py-4 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminManagement() {
  const { user: currentUser } = useSelector(s => s.auth);
  const [admins,  setAdmins]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [modal,   setModal]   = useState(false);
  const [acting,  setActing]  = useState(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const fetchAdmins = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      setLoading(true);
      const { data } = await API.get('/admin/admins', { params: { search, page, limit: 20 } });
      setAdmins(data.admins || []);
      setTotal(data.total   || 0);
      setPages(data.pages   || 1);
    } catch { toast.error('Failed to load team members'); }
    finally { setLoading(false); }
  }, [search, page, isSuperAdmin]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);
  useEffect(() => { setPage(1); }, [search]);

  const changeRole = async (id, role) => {
    try {
      setActing(id + 'role');
      const { data } = await API.put(`/admin/admins/${id}/role`, { role });
      setAdmins(prev => prev.map(a => a._id === id ? data.user : a));
      toast.success('Role updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setActing(null); }
  };

  const toggleStatus = async (id) => {
    try {
      setActing(id + 'toggle');
      const { data } = await API.put(`/admin/admins/${id}/toggle`);
      setAdmins(prev => prev.map(a => a._id === id ? data.user : a));
      toast.success(data.user.isActive ? 'Account restored' : 'Account suspended');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setActing(null); }
  };

  const deleteAdmin = async (id, name) => {
    if (!window.confirm(`Delete admin account "${name}"? This cannot be undone.`)) return;
    try {
      setActing(id + 'delete');
      await API.delete(`/admin/admins/${id}`);
      setAdmins(prev => prev.filter(a => a._id !== id));
      setTotal(t => t - 1);
      toast.success('Admin account deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setActing(null); }
  };

  // Non-super_admin view
  if (!isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-3xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>Team Management</h1>
          <div className="bg-white border border-[#E5E5E5] p-12 text-center">
            <FiShield size={48} className="mx-auto text-[#CCCCCC] mb-6" />
            <h2 className="text-[#111111] font-bold text-lg mb-2">Super Admin Only</h2>
            <p className="text-[#666666] text-sm font-medium">Only super admins can manage admin accounts and roles.</p>
          </div>

          {/* Permission Matrix (visible to all) */}
          <div className="bg-white border border-[#E5E5E5] p-8 space-y-6">
            <h2 className="text-xl font-bold text-[#111111] mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Role Permissions</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
                <div key={role} className="p-6 bg-[#F7F6F3] border border-[#E5E5E5]">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E5E5E5]">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 border ${ROLE_BADGE[role]}`}>
                      {role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {perms.map(p => (
                      <div key={p} className="flex items-center gap-3 text-[#666666] text-xs font-medium">
                        <FiCheck size={14} className="text-green-600 flex-shrink-0" /> {p}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>Team Management</h1>
            <p className="text-[#666666] text-sm font-medium mt-1">{total} admin accounts</p>
          </div>
          <div className="flex gap-4">
            <button onClick={fetchAdmins} className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E5E5E5] text-[#111111] text-xs font-bold uppercase tracking-widest hover:border-[#111111] transition-colors">
              <FiRefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setModal(true)} className="flex items-center gap-2 px-6 py-3 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">
              <FiPlus size={16} /> Add Admin
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input type="text" placeholder="Search by name or email…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-[#E5E5E5] text-sm outline-none focus:border-[#111111]" />
        </div>

        {/* Table */}
        <div className="bg-white border border-[#E5E5E5]">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F6F3]">
                  <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-widest border-b border-[#E5E5E5]">Member</th>
                  <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-widest border-b border-[#E5E5E5] hidden md:table-cell">Role</th>
                  <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-widest border-b border-[#E5E5E5] hidden sm:table-cell">Status</th>
                  <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-widest border-b border-[#E5E5E5] hidden lg:table-cell">Joined</th>
                  <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-widest border-b border-[#E5E5E5] w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-6"><TableSkeleton rows={5} /></td></tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-24 text-[#666666] bg-[#F7F6F3]">
                      <FiShield size={48} className="mx-auto mb-6 text-[#CCCCCC]" />
                      <p className="font-medium text-sm">No admin accounts found</p>
                    </td>
                  </tr>
                ) : admins.map(admin => {
                  const isCurrentUser = admin._id === currentUser?._id;
                  const isSA = admin.role === 'super_admin';
                  return (
                    <tr key={admin._id} className={`border-b border-[#E5E5E5] transition-colors ${!admin.isActive ? 'opacity-50' : 'hover:bg-[#F7F6F3]'}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                            isSA ? 'bg-purple-100 text-purple-700' : admin.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {admin.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[#111111] font-bold flex items-center gap-2 mb-1">
                              {admin.name}
                              {isCurrentUser && <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200 uppercase tracking-widest">You</span>}
                            </p>
                            <p className="text-[#666666] text-xs font-medium">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {isSA || isCurrentUser ? (
                          <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 border ${ROLE_BADGE[admin.role]}`}>
                            {admin.role.replace('_', ' ')}
                          </span>
                        ) : (
                          <select
                            value={admin.role}
                            disabled={acting === admin._id + 'role'}
                            onChange={e => changeRole(admin._id, e.target.value)}
                            className="bg-white border border-[#E5E5E5] px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#111111] outline-none focus:border-[#111111]">
                            <option value="admin">Admin</option>
                            <option value="moderator">Moderator</option>
                            <option value="user">User (Demote)</option>
                          </select>
                        )}
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${
                          admin.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {admin.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-[#666666] text-xs font-bold uppercase tracking-widest">
                          {new Date(admin.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {!isSA && !isCurrentUser ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleStatus(admin._id)}
                              disabled={acting === admin._id + 'toggle'}
                              title={admin.isActive ? 'Suspend' : 'Restore'}
                              className={`p-2 transition-colors disabled:opacity-50 border ${
                                admin.isActive
                                  ? 'text-orange-600 hover:bg-orange-50 border-transparent hover:border-orange-200'
                                  : 'text-green-600 hover:bg-green-50 border-transparent hover:border-green-200'
                              }`}>
                              {admin.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                            </button>
                            <button
                              onClick={() => deleteAdmin(admin._id, admin.name)}
                              disabled={acting === admin._id + 'delete'}
                              className="p-2 text-[#666666] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors disabled:opacity-50">
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[#CCCCCC] font-bold">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="block lg:hidden divide-y divide-[#E5E5E5]">
            {loading ? (
              <div className="p-6"><TableSkeleton rows={4} /></div>
            ) : admins.length === 0 ? (
              <div className="text-center py-16 text-[#666666] bg-[#F7F6F3]">
                <FiShield size={32} className="mx-auto mb-4 text-[#CCCCCC]" />
                <p className="font-medium text-sm">No admin accounts found</p>
              </div>
            ) : admins.map(admin => {
              const isCurrentUser = admin._id === currentUser?._id;
              const isSA = admin.role === 'super_admin';
              return (
                <div key={admin._id} className={`p-4 space-y-4 transition-colors ${!admin.isActive ? 'opacity-50' : 'hover:bg-[#F7F6F3]'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isSA ? 'bg-purple-100 text-purple-700' : admin.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {admin.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[#111111] font-bold text-sm flex items-center gap-2 mb-0.5">
                          {admin.name}
                          {isCurrentUser && <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200 uppercase tracking-widest">You</span>}
                        </p>
                        <p className="text-[#666666] text-xs font-medium">{admin.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F7F6F3] border border-[#E5E5E5] p-3 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      {isSA || isCurrentUser ? (
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border ${ROLE_BADGE[admin.role]}`}>
                          {admin.role.replace('_', ' ')}
                        </span>
                      ) : (
                        <select
                          value={admin.role}
                          disabled={acting === admin._id + 'role'}
                          onChange={e => changeRole(admin._id, e.target.value)}
                          className="bg-white border border-[#E5E5E5] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#111111] outline-none focus:border-[#111111]">
                          <option value="admin">Admin</option>
                          <option value="moderator">Moderator</option>
                          <option value="user">User (Demote)</option>
                        </select>
                      )}
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${
                        admin.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {admin.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[#666666] text-[10px] font-bold uppercase tracking-widest">
                      Joined: {new Date(admin.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-2">
                      {!isSA && !isCurrentUser ? (
                        <>
                          <button
                            onClick={() => toggleStatus(admin._id)}
                            disabled={acting === admin._id + 'toggle'}
                            title={admin.isActive ? 'Suspend' : 'Restore'}
                            className={`p-2 transition-colors disabled:opacity-50 border ${
                              admin.isActive
                                ? 'text-orange-600 hover:bg-orange-50 border-transparent hover:border-orange-200'
                                : 'text-green-600 hover:bg-green-50 border-transparent hover:border-green-200'
                            }`}>
                            {admin.isActive ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                          </button>
                          <button
                            onClick={() => deleteAdmin(admin._id, admin.name)}
                            disabled={acting === admin._id + 'delete'}
                            className="p-2 text-[#666666] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors disabled:opacity-50">
                            <FiTrash2 size={16} />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[#E5E5E5] bg-[#F7F6F3]">
              <p className="text-[#666666] text-xs font-bold uppercase tracking-widest">Page {page} of {pages}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-4 py-2 bg-white border border-[#E5E5E5] text-[#111111] text-xs font-bold uppercase disabled:opacity-50 hover:border-[#111111] transition-colors">Prev</button>
                <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-4 py-2 bg-white border border-[#E5E5E5] text-[#111111] text-xs font-bold uppercase disabled:opacity-50 hover:border-[#111111] transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Permission Matrix */}
        <div className="bg-white border border-[#E5E5E5] p-8 space-y-6">
          <h2 className="text-xl font-bold text-[#111111] mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Role Permissions Matrix</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
              <div key={role} className="p-6 bg-[#F7F6F3] border border-[#E5E5E5]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E5E5E5]">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 border ${ROLE_BADGE[role]}`}>
                    {role.replace('_', ' ')}
                  </span>
                </div>
                <div className="space-y-3">
                  {perms.map(p => (
                    <div key={p} className="flex items-center gap-3 text-[#666666] text-xs font-medium">
                      <FiCheck size={14} className="text-green-600 flex-shrink-0" /> {p}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <CreateAdminModal
          onClose={() => setModal(false)}
          onCreated={user => { setAdmins(prev => [user, ...prev]); setTotal(t => t + 1); }}
        />
      )}
    </AdminLayout>
  );
}

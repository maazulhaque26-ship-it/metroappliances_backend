import React, { useEffect, useState, useCallback } from 'react';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { FiSearch, FiUsers, FiToggleLeft, FiToggleRight, FiShield } from 'react-icons/fi';

export default function AdminUsers() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [toggling, setToggling] = useState(null);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/users', { params: { page, limit: 15, search } });
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (userId, currentStatus, name) => {
    try {
      setToggling(userId);
      const { data } = await API.put(`/admin/users/${userId}/toggle`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
      toast.success(`${name} ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update user'); }
    finally { setToggling(null); }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Customers</h1>
            <p className="text-[var(--text-3)] text-sm font-medium mt-1">{total} registered users</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search users..." className="w-full pl-12 pr-4 py-4 bg-white border border-[var(--border)] text-sm outline-none focus:border-[#111111]" />
        </div>

        {/* Table */}
        <div className="bg-white border border-[var(--border)]">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={10} cols={5} /></div>
          ) : users.length > 0 ? (
            <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg)]">
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">User</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Email</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Role</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Joined</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Status</th>
                    <th className="p-4 border-b border-[var(--border)]"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-[var(--border)] hover:bg-[var(--bg)] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[var(--text)] text-white flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ fontFamily: 'var(--font-display)' }}>
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-[var(--text)] font-bold text-sm">{u.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-[var(--text-3)] text-sm font-medium">{u.email}</td>
                      <td className="p-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--text)] text-white text-[10px] font-bold uppercase tracking-widest">
                            <FiShield size={12} /> Admin
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-3)] text-[10px] font-bold uppercase tracking-widest">Customer</span>
                        )}
                      </td>
                      <td className="p-4 text-[var(--text-3)] text-sm font-medium">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="p-4">
                        <span className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${u.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggle(u._id, u.isActive, u.name)}
                            disabled={toggling === u._id}
                            className={`flex items-center gap-2 px-4 py-2 border text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 inline-flex ${
                              u.isActive ? 'border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg)]' : 'border-green-600 text-green-700 hover:bg-green-50'
                            }`}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {u.isActive ? <><FiToggleRight size={14} /> Deactivate</> : <><FiToggleLeft size={14} /> Activate</>}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block lg:hidden divide-y divide-[#E5E5E5]">
              {users.map(u => (
                <div key={u._id} className="p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[var(--text)] text-white flex items-center justify-center font-bold text-lg flex-shrink-0" style={{ fontFamily: 'var(--font-display)' }}>
                      {u.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text)] font-bold text-sm truncate">{u.name}</p>
                      <p className="text-[var(--text-3)] text-xs truncate mt-0.5">{u.email}</p>
                    </div>
                  </div>
                  
                  <div className="bg-[var(--bg)] border border-[var(--border)] p-3 flex justify-between items-center text-sm">
                    <div>
                      <p className="text-[var(--text-3)] text-[10px] font-bold uppercase tracking-widest">Role</p>
                      <div className="mt-1">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[var(--text)] text-white text-[10px] font-bold uppercase tracking-widest">
                            <FiShield size={10} /> Admin
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-white border border-[var(--border)] text-[var(--text-3)] text-[10px] font-bold uppercase tracking-widest">Customer</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[var(--text-3)] text-[10px] font-bold uppercase tracking-widest">Status</p>
                      <div className="mt-1">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${u.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[var(--text-3)] text-[10px] font-bold uppercase tracking-widest">Joined: {new Date(u.createdAt).toLocaleDateString('en-IN')}</p>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggle(u._id, u.isActive, u.name)}
                        disabled={toggling === u._id}
                        className={`flex items-center gap-2 px-4 py-2 border text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
                          u.isActive ? 'border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg)]' : 'border-green-600 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {u.isActive ? <><FiToggleRight size={14} /> Deactivate</> : <><FiToggleLeft size={14} /> Activate</>}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </>
          ) : (
            <div className="text-center py-24 bg-[var(--bg)]">
              <FiUsers size={48} className="mx-auto mb-6 text-[#CCCCCC]" />
              <p className="text-[var(--text-3)] text-sm font-medium">No users found.</p>
            </div>
          )}

          {total > 15 && (
            <div className="flex items-center justify-between p-4 border-t border-[var(--border)] bg-[var(--bg)]">
              <p className="text-[var(--text-3)] text-xs font-bold uppercase tracking-widest">Page {page} of {Math.ceil(total/15)}</p>
              <div className="flex gap-2">
                <button disabled={page<=1} onClick={() => setPage(p => p-1)} className="px-4 py-2 bg-white border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase disabled:opacity-50 hover:border-[#111111] transition-colors">Prev</button>
                <button disabled={page*15>=total} onClick={() => setPage(p => p+1)} className="px-4 py-2 bg-white border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase disabled:opacity-50 hover:border-[#111111] transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

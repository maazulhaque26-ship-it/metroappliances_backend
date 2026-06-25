import React, { useEffect, useState, useCallback } from 'react';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  FiSearch, FiTrash2, FiDownload, FiMail, FiUsers,
  FiChevronLeft, FiChevronRight, FiRefreshCw,
} from 'react-icons/fi';

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [pages,       setPages]       = useState(1);
  const [activeCount, setActiveCount] = useState(0);
  const [deleting,    setDeleting]    = useState(null);
  const [exporting,   setExporting]   = useState(false);

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/subscribers', { params: { search, page, limit: 20 } });
      setSubscribers(data.subscribers || []);
      setTotal(data.total       || 0);
      setPages(data.pages       || 1);
      setActiveCount(data.activeCount || 0);
    } catch { toast.error('Failed to load subscribers'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);
  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Remove subscriber: ${email}?`)) return;
    try {
      setDeleting(id);
      await API.delete(`/admin/subscribers/${id}`);
      setSubscribers(prev => prev.filter(s => s._id !== id));
      setTotal(t => t - 1);
      toast.success('Subscriber removed');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const { data } = await API.get('/admin/subscribers/export', { responseType: 'blob' });
      const url  = URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href     = url;
      link.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>Subscribers</h1>
            <p className="text-[#666666] text-sm font-medium mt-1">{total} total · {activeCount} active</p>
          </div>
          <div className="flex gap-4">
            <button onClick={fetchSubscribers} className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E5E5E5] text-[#111111] text-xs font-bold uppercase tracking-widest hover:border-[#111111] transition-colors">
              <FiRefreshCw size={14} /> Refresh
            </button>
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-6 py-3 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50">
              <FiDownload size={16} /> {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-[#E5E5E5] p-6 flex items-center gap-6">
            <div className="w-16 h-16 bg-[#F7F6F3] border border-[#E5E5E5] flex items-center justify-center flex-shrink-0">
              <FiUsers size={24} className="text-[#111111]" />
            </div>
            <div>
              <p className="text-4xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>{total}</p>
              <p className="text-[#666666] text-[10px] font-bold uppercase tracking-widest mt-1">Total Subscribers</p>
            </div>
          </div>
          <div className="bg-white border border-[#E5E5E5] p-6 flex items-center gap-6">
            <div className="w-16 h-16 bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
              <FiMail size={24} className="text-green-700" />
            </div>
            <div>
              <p className="text-4xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>{activeCount}</p>
              <p className="text-[#666666] text-[10px] font-bold uppercase tracking-widest mt-1">Active Subscribers</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            placeholder="Search by email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-[#E5E5E5] text-sm outline-none focus:border-[#111111]"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-[#E5E5E5]">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F6F3]">
                  <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-widest border-b border-[#E5E5E5]">Email</th>
                  <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-widest border-b border-[#E5E5E5] hidden sm:table-cell">Date Subscribed</th>
                  <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-widest border-b border-[#E5E5E5]">Status</th>
                  <th className="p-4 border-b border-[#E5E5E5]" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="p-6"><TableSkeleton rows={8} /></td></tr>
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-24 bg-[#F7F6F3]">
                      <FiMail size={48} className="mx-auto mb-6 text-[#CCCCCC]" />
                      <p className="text-[#666666] text-sm font-medium">No subscribers found</p>
                    </td>
                  </tr>
                ) : (
                  subscribers.map(sub => (
                    <tr key={sub._id} className="border-b border-[#E5E5E5] hover:bg-[#F7F6F3] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#111111] flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {sub.email?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-[#111111] text-sm font-bold">{sub.email}</span>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className="text-[#666666] text-xs font-bold uppercase tracking-widest">
                          {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${
                          sub.isActive
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {sub.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(sub._id, sub.email)}
                          disabled={deleting === sub._id}
                          className="p-2 text-[#666666] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors disabled:opacity-50">
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="block lg:hidden divide-y divide-[#E5E5E5]">
            {loading ? (
              <div className="p-6"><TableSkeleton rows={4} /></div>
            ) : subscribers.length === 0 ? (
              <div className="text-center py-16 bg-[#F7F6F3]">
                <FiMail size={32} className="mx-auto mb-4 text-[#CCCCCC]" />
                <p className="text-[#666666] text-sm font-medium">No subscribers found</p>
              </div>
            ) : (
              subscribers.map(sub => (
                <div key={sub._id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#111111] flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {sub.email?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-[#111111] text-sm font-bold truncate max-w-[150px]">{sub.email}</span>
                    </div>
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${
                      sub.isActive
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {sub.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-[#F7F6F3] border border-[#E5E5E5] p-3 text-sm">
                    <div>
                      <p className="text-[#666666] text-[10px] font-bold uppercase tracking-widest mb-1">Subscribed</p>
                      <p className="font-bold text-[#111111]">
                        {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(sub._id, sub.email)}
                      disabled={deleting === sub._id}
                      className="p-2 border border-[#E5E5E5] text-[#666666] hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
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
      </div>
    </AdminLayout>
  );
}

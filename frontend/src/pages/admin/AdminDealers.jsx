import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { FiSearch, FiBriefcase, FiFilter, FiChevronRight } from 'react-icons/fi';

const STATUS_CHIP = {
  pending:   { bg: 'rgba(217,119,6,0.1)',  color: '#D97706', label: 'Pending' },
  approved:  { bg: 'rgba(22,163,74,0.1)',  color: '#16A34A', label: 'Approved' },
  rejected:  { bg: 'rgba(220,38,38,0.1)',  color: '#DC2626', label: 'Rejected' },
  suspended: { bg: 'rgba(124,58,237,0.1)', color: '#7C3AED', label: 'Suspended' },
};

const KYC_CHIP = {
  pending:   { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' },
  submitted: { bg: 'rgba(59,130,246,0.1)',  color: '#2563EB' },
  verified:  { bg: 'rgba(22,163,74,0.1)',   color: '#16A34A' },
  rejected:  { bg: 'rgba(220,38,38,0.1)',   color: '#DC2626' },
};

export default function AdminDealers() {
  const [dealers,  setDealers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [stats,    setStats]    = useState(null);

  const fetchStats = async () => {
    try {
      const { data } = await API.get('/admin/dealers/stats');
      setStats(data.stats);
    } catch { /* silent */ }
  };

  const fetchDealers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15, search };
      if (status) params.status = status;
      const { data } = await API.get('/admin/dealers', { params });
      setDealers(data.dealers || []);
      setTotal(data.total   || 0);
      setPages(data.pages   || 1);
    } catch { toast.error('Failed to load dealers'); }
    finally   { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchDealers(); }, [fetchDealers]);

  const statusChip = (s) => {
    const cfg = STATUS_CHIP[s] || STATUS_CHIP.pending;
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
        {cfg.label}
      </span>
    );
  };

  const kycChip = (s) => {
    const cfg = KYC_CHIP[s] || KYC_CHIP.pending;
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
        {s?.toUpperCase() || 'PENDING'}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>
              Dealer Management
            </h1>
            <p className="text-[var(--text-3)] text-sm font-medium mt-1">{total} dealers registered</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total',     value: stats.total,     color: '#111' },
              { label: 'Pending',   value: stats.pending,   color: '#D97706' },
              { label: 'Approved',  value: stats.approved,  color: '#16A34A' },
              { label: 'Rejected',  value: stats.rejected,  color: '#DC2626' },
              { label: 'Suspended', value: stats.suspended, color: '#7C3AED' },
            ].map(s => (
              <div
                key={s.label}
                onClick={() => { setStatus(s.label === 'Total' ? '' : s.label.toLowerCase()); setPage(1); }}
                className="bg-white border p-4 cursor-pointer hover:border-orange-300 transition-colors"
                style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                <p className="text-2xl font-extrabold" style={{ color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <FiSearch size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, email, GST, city…"
              className="w-full pl-11 pr-4 py-4 bg-white border border-[var(--border)] text-sm outline-none focus:border-[#111111]"
            />
          </div>
          <div className="relative">
            <FiFilter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="pl-11 pr-6 py-4 bg-white border border-[var(--border)] text-sm outline-none focus:border-[#111111] appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[var(--border)]">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={10} cols={6} /></div>
          ) : dealers.length === 0 ? (
            <div className="py-20 text-center">
              <FiBriefcase size={36} className="mx-auto mb-3 text-[var(--text-4)]" />
              <p className="font-bold text-[var(--text-3)]">No dealers found</p>
              <p className="text-sm text-[var(--text-4)] mt-1">Try adjusting the search or filters</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg)]">
                      {['Dealer', 'Business', 'Location', 'Status', 'KYC', 'Applied', ''].map(h => (
                        <th key={h} className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dealers.map(d => (
                      <tr key={d._id} className="border-b border-[var(--border)] hover:bg-[var(--bg)] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: 'var(--text)', color: '#fff', borderRadius: 'var(--radius-sm)' }}>
                              {d.businessName?.[0]?.toUpperCase() || 'D'}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-[var(--text)]">{d.ownerName}</p>
                              <p className="text-[11px] text-[var(--text-4)]">{d.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-sm text-[var(--text)]">{d.businessName}</p>
                          <p className="text-[11px] text-[var(--text-4)] capitalize">{d.dealerType}</p>
                        </td>
                        <td className="p-4 text-sm text-[var(--text-3)]">{d.city}, {d.state}</td>
                        <td className="p-4">{statusChip(d.status)}</td>
                        <td className="p-4">{kycChip(d.kycStatus)}</td>
                        <td className="p-4 text-sm text-[var(--text-4)]">{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="p-4">
                          <Link to={`/admin/dealers/${d._id}`} className="flex items-center gap-1 text-xs font-bold hover:text-[var(--accent)]" style={{ color: 'var(--text-3)' }}>
                            View <FiChevronRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="lg:hidden divide-y divide-[var(--border)]">
                {dealers.map(d => (
                  <Link key={d._id} to={`/admin/dealers/${d._id}`} className="flex items-center justify-between p-4 hover:bg-[var(--bg)]">
                    <div>
                      <p className="font-semibold text-sm text-[var(--text)]">{d.businessName}</p>
                      <p className="text-[12px] text-[var(--text-3)]">{d.ownerName} · {d.city}</p>
                      <div className="flex gap-2 mt-1.5">{statusChip(d.status)}{kycChip(d.kycStatus)}</div>
                    </div>
                    <FiChevronRight size={16} className="text-[var(--text-4)]" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-bold border border-[var(--border)] disabled:opacity-40"
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              Previous
            </button>
            <span className="text-sm text-[var(--text-3)]">Page {page} of {pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-4 py-2 text-sm font-bold border border-[var(--border)] disabled:opacity-40"
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

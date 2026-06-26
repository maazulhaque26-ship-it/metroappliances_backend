import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchCertifications } from '../../services/performanceAPI';
import { FiAward, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const STATUS_COLORS = {
  active:  'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  revoked: 'bg-gray-100 text-gray-500',
};

export default function AdminCertifications() {
  const [certs, setCerts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const limit = 15;

  const load = useCallback(() => {
    setLoading(true);
    fetchCertifications({ page, limit })
      .then(r => { setCerts(r.data.data || r.data.certifications || []); setTotal(r.data.total || 0); })
      .catch(e => setError(e.response?.data?.message || 'Failed to load certifications'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 rounded-lg"><FiAward size={20} className="text-indigo-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Certifications</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} certifications issued</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Employee', 'Course', 'Certificate #', 'Issue Date', 'Expiry Date', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {certs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No certifications found
                  </td>
                </tr>
              ) : certs.map(c => {
                const now = new Date();
                const expiry = c.expiryDate ? new Date(c.expiryDate) : null;
                const isExpired = expiry && expiry < now;
                const status = c.status || (isExpired ? 'expired' : 'active');

                return (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {c.employee?.name || c.employee?.firstName || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.course?.title || c.course || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.certificateNumber || c.certNumber || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {c.issueDate ? new Date(c.issueDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {expiry ? expiry.toLocaleDateString('en-IN') : 'No Expiry'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><FiChevronLeft size={14} /></button>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><FiChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

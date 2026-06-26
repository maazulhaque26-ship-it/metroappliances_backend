import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchReviews, finalizeReview } from '../../services/performanceAPI';
import { FiClipboard, FiCheckCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const RATING_COLORS = {
  outstanding:         'bg-purple-100 text-purple-700',
  exceeds_expectations:'bg-blue-100 text-blue-700',
  meets_expectations:  'bg-green-100 text-green-700',
  needs_improvement:   'bg-yellow-100 text-yellow-700',
  unsatisfactory:      'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  draft:              'bg-gray-100 text-gray-600',
  self_review_pending:'bg-yellow-100 text-yellow-700',
  manager_review_pending:'bg-blue-100 text-blue-700',
  completed:          'bg-green-100 text-green-700',
  finalized:          'bg-purple-100 text-purple-700',
};

const STATUSES = ['', 'draft', 'self_review_pending', 'manager_review_pending', 'completed', 'finalized'];

export default function AdminPerformanceReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 15;

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit };
    if (statusFilter) params.status = statusFilter;
    fetchReviews(params)
      .then(r => { setReviews(r.data.data || r.data.reviews || []); setTotal(r.data.total || 0); })
      .catch(e => setError(e.response?.data?.message || 'Failed to load reviews'))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleFinalize = async (id) => {
    if (!window.confirm('Finalize this review?')) return;
    try {
      await finalizeReview(id);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Failed to finalize'); }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
            <p className="text-sm text-gray-500 mt-1">{total} reviews total</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All Statuses'}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Employee', 'Cycle', 'Type', 'Self Score', 'Manager Score', 'Final Score', 'Rating', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.length === 0 ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-gray-400">No reviews found</td></tr>
              ) : reviews.map((r, i) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{(page - 1) * limit + i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.employee?.name || r.employee?.firstName || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.cycle?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{(r.reviewType || r.type || '').replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-600">{r.selfReview?.totalScore ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.managerReview?.totalScore ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{r.finalScore ?? '—'}</td>
                  <td className="px-4 py-3">
                    {r.overallRating ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${RATING_COLORS[r.overallRating] || 'bg-gray-100 text-gray-600'}`}>
                        {r.overallRating.replace(/_/g, ' ')}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                      {(r.status || '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'completed' && (
                      <button onClick={() => handleFinalize(r._id)} className="p-1.5 text-purple-600 hover:text-purple-800" title="Finalize">
                        <FiCheckCircle size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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

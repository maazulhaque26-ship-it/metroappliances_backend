import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchPerformanceDashboard } from '../../services/performanceAPI';
import { FiRefreshCw, FiTarget, FiCheckCircle, FiClipboard, FiBookOpen, FiStar, FiZap } from 'react-icons/fi';

const KpiCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
    <div className={`p-3 rounded-lg bg-gray-50 ${color}`}><Icon size={22} /></div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
    </div>
  </div>
);

const priorityBadge = (p) => {
  const map = { urgent: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700', medium: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[p] || 'bg-gray-100 text-gray-600'}`}>{p}</span>;
};

export default function AdminPerformanceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    fetchPerformanceDashboard()
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  const k = data?.kpis || {};
  const dist = data?.ratingDistribution || [];
  const announcements = data?.recentAnnouncements || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Management Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Overview of performance cycles, goals, reviews and recognitions</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <FiRefreshCw size={15} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard icon={FiZap}        label="Active Cycles"         value={k.activeCycles}        color="text-indigo-600" />
          <KpiCard icon={FiTarget}     label="Total Goals"           value={k.totalGoals}           color="text-blue-600" />
          <KpiCard icon={FiCheckCircle} label="Achieved Goals"       value={k.achievedGoals}        color="text-green-600" />
          <KpiCard icon={FiClipboard}  label="Pending Reviews"       value={k.pendingReviews}       color="text-yellow-600" />
          <KpiCard icon={FiBookOpen}   label="Training Enrollments"  value={k.trainingEnrollments}  color="text-purple-600" />
          <KpiCard icon={FiStar}       label="Recognitions This Month" value={k.recognitionsThisMonth} color="text-pink-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Performance Rating Distribution</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Rating', 'Count', 'Percentage'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dist.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400 text-sm">No data</td></tr>
                ) : dist.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800 capitalize">{(row.rating || '').replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3 text-gray-700">{row.count || 0}</td>
                    <td className="px-5 py-3 text-gray-500">{row.percentage ? `${row.percentage}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Recent Announcements</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {announcements.length === 0 ? (
                <p className="px-5 py-8 text-center text-gray-400 text-sm">No announcements</p>
              ) : announcements.slice(0, 5).map((a) => (
                <div key={a._id} className="px-5 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.category} · {new Date(a.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  {priorityBadge(a.priority)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

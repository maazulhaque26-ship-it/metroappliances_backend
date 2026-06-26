import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchGoal, fetchGoalProgress, updateGoalProgress, approveGoal } from '../../services/performanceAPI';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-blue-100 text-blue-700',
  achieved: 'bg-green-100 text-green-700',
  partially_achieved: 'bg-yellow-100 text-yellow-700',
  not_achieved: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function AdminGoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressForm, setProgressForm] = useState({ progressPercent: 0, notes: '' });
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([fetchGoal(id), fetchGoalProgress(id)])
      .then(([gr, pr]) => {
        setGoal(gr.data.data || gr.data.goal);
        setHistory(pr.data.data || pr.data.history || []);
        setProgressForm(f => ({ ...f, progressPercent: gr.data.data?.progressPercent || gr.data.goal?.progressPercent || 0 }));
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateGoalProgress(id, progressForm);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleApprove = async () => {
    if (!window.confirm('Approve this goal?')) return;
    try {
      setApproving(true);
      await approveGoal(id);
      load();
    } catch { alert('Failed to approve'); }
    finally { setApproving(false); }
  };

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;
  if (!goal)   return <AdminLayout><ErrorState message="Goal not found" /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><FiArrowLeft size={16} /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{goal.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Goal Detail</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{goal.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[goal.status] || 'bg-gray-100 text-gray-600'}`}>
                  {(goal.status || '').replace(/_/g, ' ')}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-bold text-indigo-600">{goal.progressPercent || 0}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-3 bg-indigo-500 rounded-full transition-all" style={{ width: `${goal.progressPercent || 0}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Employee</span>
                  <p className="font-medium text-gray-800 mt-0.5">{goal.employee?.name || goal.employee?.firstName || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Category</span>
                  <p className="font-medium text-gray-800 mt-0.5">{goal.category?.name || goal.category || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Cycle</span>
                  <p className="font-medium text-gray-800 mt-0.5">{goal.cycle?.name || goal.cycle || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Target Date</span>
                  <p className="font-medium text-gray-800 mt-0.5">{goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en-IN') : '—'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Weightage</span>
                  <p className="font-medium text-gray-800 mt-0.5">{goal.weightage || 0}%</p>
                </div>
                <div>
                  <span className="text-gray-500">Type</span>
                  <p className="font-medium text-gray-800 mt-0.5 capitalize">{goal.type || '—'}</p>
                </div>
              </div>

              {!goal.isApproved && (
                <button onClick={handleApprove} disabled={approving} className="mt-5 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  <FiCheckCircle size={15} /> {approving ? 'Approving…' : 'Approve Goal'}
                </button>
              )}
              {goal.isApproved && (
                <p className="mt-5 flex items-center gap-2 text-sm text-green-600 font-medium"><FiCheckCircle size={15} /> Approved</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Update Progress</h3>
              <form onSubmit={handleUpdateProgress} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Progress ({progressForm.progressPercent}%)</label>
                  <input type="range" min={0} max={100} value={progressForm.progressPercent}
                    onChange={e => setProgressForm(f => ({ ...f, progressPercent: Number(e.target.value) }))}
                    className="w-full accent-indigo-600" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Notes</label>
                  <textarea value={progressForm.notes} onChange={e => setProgressForm(f => ({ ...f, notes: e.target.value }))}
                    rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Progress notes…" />
                </div>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Updating…' : 'Update Progress'}
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
            <h3 className="font-semibold text-gray-900 mb-4">Progress History</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">No progress updates yet</p>
            ) : (
              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={i} className="border-l-2 border-indigo-200 pl-3">
                    <p className="text-sm font-semibold text-gray-800">{h.progressPercent || 0}%</p>
                    {h.notes && <p className="text-xs text-gray-500 mt-0.5">{h.notes}</p>}
                    <p className="text-xs text-gray-400 mt-1">{h.date ? new Date(h.date).toLocaleDateString('en-IN') : '—'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

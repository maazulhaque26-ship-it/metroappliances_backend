import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import {
  fetchGoalAchievement,
  fetchPerformanceDistribution,
  fetchTrainingCompletion,
  fetchRecognitionReport,
  fetchCompetencyMatrix,
  fetchPromotionReadiness,
  fetchLearningHours,
} from '../../services/performanceAPI';

const TABS = [
  { key: 'goals',       label: 'Goal Completion' },
  { key: 'reviews',     label: 'Review Distribution' },
  { key: 'training',    label: 'Training' },
  { key: 'recognition', label: 'Recognition' },
  { key: 'competency',  label: 'Competency' },
  { key: 'promotion',   label: 'Promotion Readiness' },
  { key: 'learning',    label: 'Learning Hours' },
];

function SimpleBar({ label, value, max = 100, color = 'bg-indigo-500' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-gray-700 w-40 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-3 ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-800 w-12 text-right">{value}</span>
    </div>
  );
}

function GoalsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGoalAchievement()
      .then(r => setData(r.data.data || r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>;
  if (error)   return <div className="p-8 text-center text-red-500 text-sm">{error}</div>;

  const rows = Array.isArray(data) ? data : (data?.rows || data?.goals || []);
  const maxVal = Math.max(...rows.map(r => r.count || r.total || 0), 1);

  return (
    <div className="p-5">
      <p className="text-sm text-gray-500 mb-4">Goal completion by status</p>
      {rows.length === 0 ? <p className="text-gray-400 text-sm">No data available</p> : rows.map((r, i) => (
        <SimpleBar key={i} label={r.status || r.label || r._id || `Item ${i + 1}`} value={r.count || r.total || 0} max={maxVal} />
      ))}
    </div>
  );
}

function ReviewsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPerformanceDistribution()
      .then(r => setData(r.data.data || r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>;
  if (error)   return <div className="p-8 text-center text-red-500 text-sm">{error}</div>;

  const rows = Array.isArray(data) ? data : (data?.rows || data?.distribution || []);
  const maxVal = Math.max(...rows.map(r => r.count || 0), 1);

  return (
    <div className="p-5">
      <p className="text-sm text-gray-500 mb-4">Performance review rating distribution</p>
      {rows.length === 0 ? <p className="text-gray-400 text-sm">No data available</p> : rows.map((r, i) => (
        <SimpleBar key={i} label={(r.rating || r._id || `Rating ${i + 1}`).replace(/_/g, ' ')} value={r.count || 0} max={maxVal} color="bg-purple-500" />
      ))}
    </div>
  );
}

function TrainingTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrainingCompletion()
      .then(r => setData(r.data.data || r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>;
  if (error)   return <div className="p-8 text-center text-red-500 text-sm">{error}</div>;

  const rows = Array.isArray(data) ? data : (data?.rows || data?.courses || []);
  const maxVal = Math.max(...rows.map(r => r.completed || r.count || 0), 1);

  return (
    <div className="p-5">
      <p className="text-sm text-gray-500 mb-4">Training completion by course</p>
      {rows.length === 0 ? <p className="text-gray-400 text-sm">No data available</p> : rows.map((r, i) => (
        <SimpleBar key={i} label={r.course || r.title || r._id || `Course ${i + 1}`} value={r.completed || r.count || 0} max={maxVal} color="bg-green-500" />
      ))}
    </div>
  );
}

function RecognitionTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecognitionReport()
      .then(r => setData(r.data.data || r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>;
  if (error)   return <div className="p-8 text-center text-red-500 text-sm">{error}</div>;

  const rows = Array.isArray(data) ? data : (data?.rows || data?.types || []);
  const maxVal = Math.max(...rows.map(r => r.count || 0), 1);

  return (
    <div className="p-5">
      <p className="text-sm text-gray-500 mb-4">Recognition by type</p>
      {rows.length === 0 ? <p className="text-gray-400 text-sm">No data available</p> : rows.map((r, i) => (
        <SimpleBar key={i} label={r.type || r._id || `Type ${i + 1}`} value={r.count || 0} max={maxVal} color="bg-yellow-500" />
      ))}
    </div>
  );
}

function CompetencyTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompetencyMatrix()
      .then(r => setData(r.data.data || r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>;
  if (error)   return <div className="p-8 text-center text-red-500 text-sm">{error}</div>;

  const rows = Array.isArray(data) ? data : (data?.rows || data?.competencies || []);
  const maxVal = Math.max(...rows.map(r => r.avgScore || r.score || r.count || 0), 5);

  return (
    <div className="p-5">
      <p className="text-sm text-gray-500 mb-4">Average competency scores</p>
      {rows.length === 0 ? <p className="text-gray-400 text-sm">No data available</p> : rows.map((r, i) => (
        <SimpleBar key={i} label={r.competency || r.name || r._id || `Competency ${i + 1}`} value={r.avgScore || r.score || r.count || 0} max={maxVal} color="bg-blue-500" />
      ))}
    </div>
  );
}

function PromotionTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPromotionReadiness()
      .then(r => setData(r.data.data || r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>;
  if (error)   return <div className="p-8 text-center text-red-500 text-sm">{error}</div>;

  const rows = Array.isArray(data) ? data : (data?.rows || data?.employees || []);

  return (
    <div className="p-5">
      <p className="text-sm text-gray-500 mb-4">Employees ready for promotion</p>
      {rows.length === 0 ? (
        <p className="text-gray-400 text-sm">No data available</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Employee', 'Current Role', 'Readiness', 'Score'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{r.employee?.name || r.name || r._id || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{r.currentRole || r.designation || '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                    {(r.readiness || r.readinessLevel || '—').replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">{r.score ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function LearningTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLearningHours()
      .then(r => setData(r.data.data || r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>;
  if (error)   return <div className="p-8 text-center text-red-500 text-sm">{error}</div>;

  const rows = Array.isArray(data) ? data : (data?.rows || data?.departments || []);
  const maxVal = Math.max(...rows.map(r => r.hours || r.totalHours || 0), 1);

  return (
    <div className="p-5">
      <p className="text-sm text-gray-500 mb-4">Learning hours by department</p>
      {rows.length === 0 ? <p className="text-gray-400 text-sm">No data available</p> : rows.map((r, i) => (
        <SimpleBar key={i} label={r.department || r.name || r._id || `Dept ${i + 1}`} value={r.hours || r.totalHours || 0} max={maxVal} color="bg-teal-500" />
      ))}
    </div>
  );
}

const TAB_COMPONENTS = {
  goals:       <GoalsTab />,
  reviews:     <ReviewsTab />,
  training:    <TrainingTab />,
  recognition: <RecognitionTab />,
  competency:  <CompetencyTab />,
  promotion:   <PromotionTab />,
  learning:    <LearningTab />,
};

export default function AdminPerformanceReports() {
  const [activeTab, setActiveTab] = useState('goals');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Analytics and insights across the performance module</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-100 overflow-x-auto">
            <div className="flex min-w-max">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div key={activeTab}>
            {TAB_COMPONENTS[activeTab]}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

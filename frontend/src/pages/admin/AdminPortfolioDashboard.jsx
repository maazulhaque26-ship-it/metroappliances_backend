import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiBriefcase, FiLayers, FiFolder, FiTarget, FiAlertTriangle, FiActivity } from 'react-icons/fi';
import { fetchPortfolioDashboard } from '../../services/portfolioAPI';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600', active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700', closed: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-500',
};
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

export default function AdminPortfolioDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioDashboard().then(r => setData(r.data.data || r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><div className="p-8 text-center text-gray-400">Loading...</div></AdminLayout>;

  const kpis = data?.kpis || {};
  const recent = data?.recentPortfolios || [];
  const upcoming = data?.upcomingMilestones || [];
  const statusBreakdown = data?.statusBreakdown || [];

  const cards = [
    { label: 'Portfolios', value: fmt(kpis.total), icon: FiBriefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active', value: fmt(kpis.active), icon: FiActivity, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Programs', value: fmt(kpis.programs), icon: FiLayers, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Projects', value: fmt(kpis.projects), icon: FiFolder, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Initiatives', value: fmt(kpis.initiatives), icon: FiTarget, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Open Risks', value: fmt(kpis.openRisks), icon: FiAlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Enterprise project portfolio management overview</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {cards.map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-2`}>
                <c.icon size={18} className={c.color} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">Recent Portfolios</h2></div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50"><tr>{['Code', 'Name', 'Status', 'Health', 'Owner'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>))}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {recent.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No items found.</td></tr>
                  : recent.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.portfolioCode}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] || 'bg-gray-100'}`}>{p.status}</span></td>
                      <td className="px-4 py-3 text-gray-500">{(p.health || '').replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-gray-500">{p.owner?.name || '—'}</td>
                    </tr>))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">Status Breakdown</h2></div>
            {statusBreakdown.length === 0 ? <div className="px-5 py-8 text-center text-gray-400 text-sm">No items found.</div> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusBreakdown} layout="vertical" margin={{ left: 8, right: 16, top: 16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis dataKey="status" type="category" tick={{ fontSize: 10 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">Upcoming Portfolio Milestones</h2></div>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr>{['Milestone', 'Portfolio', 'Due', 'Status'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>))}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {upcoming.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No items found.</td></tr>
                : upcoming.map(m => (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500">{m.portfolio?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.dueDate ? new Date(m.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{(m.status || '').replace(/_/g, ' ')}</td>
                  </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

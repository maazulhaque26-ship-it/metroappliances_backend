import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { FiArrowLeft, FiDollarSign, FiTrendingUp, FiActivity, FiTarget } from 'react-icons/fi';
import {
  fetchPortfolio, fetchFinancialSummary, fetchPortfolioStatusReport,
  fetchPortfolioMilestones, fetchPortfolioRisks,
} from '../../services/portfolioAPI';

const fmtCur = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const HEALTH_COLORS = { on_track: 'text-green-600', at_risk: 'text-yellow-600', off_track: 'text-red-600', not_started: 'text-gray-500' };

export default function AdminPortfolioDetail() {
  const { id } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [fin, setFin] = useState(null);
  const [status, setStatus] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [risks, setRisks] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchPortfolio(id), fetchFinancialSummary(id), fetchPortfolioStatusReport(id),
      fetchPortfolioMilestones(id), fetchPortfolioRisks(id),
    ]).then(([p, f, s, m, r]) => {
      setPortfolio(p.data.data || p.data);
      setFin(f.data.data || f.data);
      setStatus(s.data.data || s.data);
      setMilestones(m.data.data || m.data || []);
      setRisks(r.data.data || r.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AdminLayout><div className="p-8 text-center text-gray-400">Loading...</div></AdminLayout>;
  if (!portfolio) return <AdminLayout><div className="p-8 text-center text-gray-400">Portfolio not found.</div></AdminLayout>;

  const cards = [
    { label: 'Total Budget', value: fmtCur(fin?.totalBudget), icon: FiDollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Actual Cost', value: fmtCur(fin?.actualCost), icon: FiActivity, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'ROI', value: `${fin?.roi ?? 0}%`, icon: FiTrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Realized Benefit', value: fmtCur(fin?.realizedBenefit), icon: FiTarget, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Link to="/admin/portfolio" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><FiArrowLeft size={16} /> Back to Portfolios</Link>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-gray-400">{portfolio.portfolioCode}</p>
            <h1 className="text-2xl font-bold text-gray-900">{portfolio.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{portfolio.description || 'No description'}</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold capitalize ${HEALTH_COLORS[portfolio.health] || 'text-gray-500'}`}>{(portfolio.health || '').replace(/_/g, ' ')}</p>
            <p className="text-xs text-gray-400 mt-1">{portfolio.programCount ?? 0} programs · {portfolio.initiativeCount ?? 0} initiatives</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500">{c.label}</p><p className="text-xl font-bold text-gray-900 mt-1">{c.value}</p></div>
                <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center`}><c.icon size={20} className={c.color} /></div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {['overview', 'milestones', 'risks'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-white shadow text-indigo-600' : 'text-gray-600'}`}>{t}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">Financial Health</h2>
              {[
                ['Budget Burn', `${fin?.budgetBurn ?? 0}%`], ['NPV', fmtCur(fin?.npv)],
                ['Cost Variance', fmtCur(fin?.costVariance)], ['Benefits Realization', `${fin?.benefitsRealizationPercent ?? 0}%`],
                ['Health', (fin?.health || '').replace(/_/g, ' ')],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                  <span className="text-gray-500">{k}</span><span className="font-medium text-gray-800 capitalize">{v}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">Delivery Snapshot</h2>
              {[
                ['Programs', status?.programCount ?? 0], ['Projects', status?.projectCount ?? 0],
                ['Avg Completion', `${status?.avgCompletion ?? 0}%`], ['Open Risks', status?.openRisks ?? 0],
                ['Milestones Achieved', `${status?.milestonesAchieved ?? 0} / ${status?.milestonesTotal ?? 0}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                  <span className="text-gray-500">{k}</span><span className="font-medium text-gray-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'milestones' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>{['Code', 'Name', 'Type', 'Due', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {milestones.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No milestones.</td></tr>
                  : milestones.map(m => (
                    <tr key={m._id} className="border-b border-gray-100">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{m.milestoneCode}</td>
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3 text-gray-500">{m.type}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{m.dueDate ? new Date(m.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{(m.status || '').replace(/_/g, ' ')}</td>
                    </tr>))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'risks' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>{['Code', 'Title', 'Category', 'Score', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {risks.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No risks.</td></tr>
                  : risks.map(r => (
                    <tr key={r._id} className="border-b border-gray-100">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.riskCode}</td>
                      <td className="px-4 py-3 font-medium">{r.title}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{r.category}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.riskScore >= 9 ? 'bg-red-100 text-red-700' : r.riskScore >= 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{r.riskScore}</span></td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{r.status}</td>
                    </tr>))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

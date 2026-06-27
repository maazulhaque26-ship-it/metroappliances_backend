import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  fetchExecutiveReport, fetchResourceReport, fetchFinancialReport,
  fetchBenefitsReport, fetchRiskSummary, fetchPortfolios,
} from '../../services/portfolioAPI';

const fmtC = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

function Stat({ label, value, sub }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminPortfolioReports() {
  const [tab, setTab]               = useState('executive');
  const [portfolios, setPortfolios] = useState([]);
  const [pfFilter, setPfFilter]     = useState('');
  const [loading, setLoading]       = useState(false);

  const [exec, setExec]     = useState(null);
  const [res, setRes]       = useState(null);
  const [fin, setFin]       = useState(null);
  const [ben, setBen]       = useState(null);
  const [risk, setRisk]     = useState(null);

  useEffect(() => {
    fetchPortfolios().then(r => setPortfolios(r.data.data || r.data || [])).catch(() => {});
  }, []);

  const loadReport = (t) => {
    setLoading(true);
    const params = pfFilter ? { portfolio: pfFilter } : {};
    const loaders = {
      executive: () => fetchExecutiveReport().then(r => setExec(r.data.data || r.data)),
      resource:  () => fetchResourceReport(params).then(r => setRes(r.data.data || r.data)),
      financial: () => fetchFinancialReport(params).then(r => setFin(r.data.data || r.data)),
      benefits:  () => fetchBenefitsReport(params).then(r => setBen(r.data.data || r.data)),
      risk:      () => fetchRiskSummary(params).then(r => setRisk(r.data.data || r.data)),
    };
    (loaders[t] || loaders.executive)()
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReport(tab); }, [tab, pfFilter]);

  const TABS = [
    { id: 'executive', label: 'Executive' },
    { id: 'resource',  label: 'Resource' },
    { id: 'financial', label: 'Financial' },
    { id: 'benefits',  label: 'Benefits' },
    { id: 'risk',      label: 'Risk Summary' },
  ];

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolio Reports</h1>
            <p className="text-sm text-gray-500 mt-1">Cross-portfolio analytics and reporting</p>
          </div>
          <select value={pfFilter} onChange={e => setPfFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Portfolios</option>
            {portfolios.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.id ? 'bg-white shadow text-indigo-600' : 'text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <p className="text-gray-400 text-center py-10">Loading report…</p> : (
          <>
            {tab === 'executive' && exec && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Stat label="Portfolios" value={exec.portfolioCount} />
                  <Stat label="Active Portfolios" value={exec.activePortfolios} />
                  <Stat label="Programs" value={exec.programCount} />
                  <Stat label="Projects" value={exec.projectCount} />
                  <Stat label="Total Budget" value={fmtC(exec.totalBudget)} />
                  <Stat label="Target Benefits" value={fmtC(exec.targetBenefit)} />
                  <Stat label="Realized Benefits" value={fmtC(exec.realizedBenefit)} />
                  <Stat label="Open Risks" value={exec.openRisks} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3">Portfolio Health Distribution</h2>
                    {(exec.healthBreakdown || []).length === 0 ? <p className="text-gray-400 text-center py-6">No data.</p> : (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={exec.healthBreakdown} dataKey="count" nameKey="health" cx="50%" cy="50%" outerRadius={80}
                            label={({ health, count }) => `${(health || '').replace(/_/g, ' ')} (${count})`}>
                            {(exec.healthBreakdown || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-indigo-600">{exec.avgStrategicAlignment || 0}<span className="text-2xl text-gray-400">%</span></p>
                      <p className="text-sm text-gray-500 mt-2">Average Strategic Alignment</p>
                      <div className="w-full h-3 bg-gray-100 rounded-full mt-3">
                        <div className="h-3 bg-indigo-500 rounded-full" style={{ width: `${exec.avgStrategicAlignment || 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'resource' && res && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Stat label="Total Capacity" value={`${res.totalCapacity}h`} />
                  <Stat label="Total Demand" value={`${res.totalDemand}h`} />
                  <Stat label="Utilization" value={`${res.utilization}%`} />
                  <Stat label="Gap (Capacity − Demand)" value={`${res.gap}h`} sub={res.gap >= 0 ? 'Headroom available' : 'Overallocated'} />
                  <Stat label="Allocated Hours" value={`${res.totalAllocated}h`} />
                  <Stat label="Resource Records" value={res.resourceCount} />
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Capacity vs Demand vs Allocated</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={[{ name: 'Overall', capacity: res.totalCapacity, demand: res.totalDemand, allocated: res.totalAllocated }]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `${v}h`} />
                      <Legend />
                      <Bar dataKey="capacity" name="Capacity" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="demand" name="Demand" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="allocated" name="Allocated" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {tab === 'financial' && fin && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Stat label="Total Budget" value={fmtC(fin.totalBudget)} />
                  <Stat label="Actual Spend" value={fmtC(fin.actualSpend)} />
                  <Stat label="Budget Variance" value={fmtC(fin.budgetVariance)} sub={fin.budgetVariance >= 0 ? 'Under budget' : 'Over budget'} />
                  <Stat label="Budget Utilization" value={`${fin.budgetUtilization}%`} />
                  <Stat label="Target Benefits" value={fmtC(fin.targetBenefit)} />
                  <Stat label="Realized Benefits" value={fmtC(fin.realizedBenefit)} />
                  <Stat label="Benefits Realization" value={`${fin.benefitsRealization}%`} />
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Budget vs Spend vs Benefits</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={[{ name: 'Portfolio', budget: fin.totalBudget, spend: fin.actualSpend, targetBen: fin.targetBenefit, realizedBen: fin.realizedBenefit }]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => fmtC(v)} />
                      <Legend />
                      <Bar dataKey="budget" name="Budget" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="spend" name="Actual Spend" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="targetBen" name="Target Benefits" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="realizedBen" name="Realized Benefits" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {tab === 'benefits' && ben && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3">Benefits by Status</h2>
                    {(ben.byStatus || []).length === 0 ? <p className="text-gray-400 text-center py-6">No data.</p> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={ben.byStatus} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="_id" type="category" tick={{ fontSize: 10 }} width={90} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="target" name="Target" fill="#6366f1" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="realized" name="Realized" fill="#22c55e" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3">Benefits by Type</h2>
                    {(ben.byType || []).length === 0 ? <p className="text-gray-400 text-center py-6">No data.</p> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={ben.byType} dataKey="target" nameKey="_id" cx="50%" cy="50%" outerRadius={80}
                            label={({ _id, target }) => `${_id}: ${fmtC(target)}`}>
                            {(ben.byType || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => fmtC(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === 'risk' && risk && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Stat label="Open Risks" value={risk.openRisks} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3">Risks by Category</h2>
                    {(risk.byCategory || []).length === 0 ? <p className="text-gray-400 text-center py-6">No data.</p> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={risk.byCategory} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                          <YAxis dataKey="_id" type="category" tick={{ fontSize: 10 }} width={90} />
                          <Tooltip />
                          <Bar dataKey="count" name="Count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3">Risks by Status</h2>
                    {(risk.byStatus || []).length === 0 ? <p className="text-gray-400 text-center py-6">No data.</p> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={risk.byStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80}
                            label={({ _id, count }) => `${_id} (${count})`}>
                            {(risk.byStatus || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

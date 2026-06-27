import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiPlus, FiTrash2, FiAlertTriangle, FiActivity } from 'react-icons/fi';
import {
  fetchDemandVsCapacity, fetchUtilization, fetchConflicts, fetchHeatmap,
  fetchCapacity, createCapacity, deleteCapacity,
  fetchDemand, createDemand, deleteDemand,
  fetchPortfolios,
} from '../../services/portfolioAPI';

const UTIL_COLOR = (pct) => pct > 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : pct >= 50 ? 'bg-green-500' : 'bg-gray-300';
const UTIL_TEXT  = (pct) => pct > 100 ? 'text-red-700 bg-red-50' : pct >= 80 ? 'text-amber-700 bg-amber-50' : 'text-green-700 bg-green-50';

export default function AdminResourceCapacity() {
  const [tab, setTab]               = useState('overview');
  const [portfolioFilter, setPortfolioFilter] = useState('');
  const [portfolios, setPortfolios] = useState([]);

  const [dvcData, setDvcData]       = useState([]);
  const [utilData, setUtilData]     = useState([]);
  const [conflicts, setConflicts]   = useState([]);
  const [heatmap, setHeatmap]       = useState({ periods: [], rows: [] });
  const [capacityList, setCapacityList] = useState([]);
  const [demandList, setDemandList] = useState([]);
  const [loading, setLoading]       = useState(true);

  const [capModal, setCapModal]     = useState(false);
  const [demModal, setDemModal]     = useState(false);
  const [capForm, setCapForm]       = useState({ employee: '', period: '', availableHours: 160, allocatedHours: 0 });
  const [demForm, setDemForm]       = useState({ employee: '', period: '', demandHours: 80, priority: 'medium' });
  const [saving, setSaving]         = useState(false);

  const params = portfolioFilter ? { portfolio: portfolioFilter } : {};

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchPortfolios(),
      fetchDemandVsCapacity(params),
      fetchUtilization(params),
      fetchConflicts(params),
      fetchHeatmap(params),
      fetchCapacity(params),
      fetchDemand(params),
    ]).then(([pf, dvc, util, conf, hm, cap, dem]) => {
      setPortfolios(pf.data.data || pf.data || []);
      setDvcData(dvc.data.data || dvc.data || []);
      setUtilData(util.data.data || util.data || []);
      setConflicts(conf.data.data || conf.data || []);
      setHeatmap(hm.data.data || hm.data || { periods: [], rows: [] });
      setCapacityList(cap.data.data || cap.data || []);
      setDemandList(dem.data.data || dem.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [portfolioFilter]);

  const saveCapacity = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const p = { ...capForm, availableHours: Number(capForm.availableHours), allocatedHours: Number(capForm.allocatedHours) };
      if (portfolioFilter) p.portfolio = portfolioFilter;
      await createCapacity(p);
      setCapModal(false); loadData();
    } catch (_) {} finally { setSaving(false); }
  };

  const saveDemand = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const p = { ...demForm, demandHours: Number(demForm.demandHours) };
      if (portfolioFilter) p.portfolio = portfolioFilter;
      await createDemand(p);
      setDemModal(false); loadData();
    } catch (_) {} finally { setSaving(false); }
  };

  const TABS = ['overview', 'utilization', 'conflicts', 'heatmap', 'records'];

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resource Capacity Planning</h1>
            <p className="text-sm text-gray-500 mt-1">Cross-portfolio allocation, demand vs capacity, heatmaps</p>
          </div>
          <div className="flex gap-3 items-center">
            <select value={portfolioFilter} onChange={e => setPortfolioFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All Portfolios</option>
              {portfolios.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <button onClick={() => setCapModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
              <FiPlus size={14} /> Capacity
            </button>
            <button onClick={() => setDemModal(true)} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
              <FiPlus size={14} /> Demand
            </button>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-white shadow text-indigo-600' : 'text-gray-600'}`}>{t}</button>
          ))}
        </div>

        {loading ? <p className="text-gray-400 text-center py-10">Loading...</p> : (
          <>
            {tab === 'overview' && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Demand vs Capacity by Period</h2>
                {dvcData.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No data. Add capacity and demand records first.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dvcData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `${v}h`} />
                      <Legend />
                      <Bar dataKey="capacity" name="Capacity (h)" fill="#6366f1" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="demand" name="Demand (h)" fill="#f97316" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {dvcData.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr>{['Period', 'Capacity (h)', 'Demand (h)', 'Gap (h)', 'Utilization'].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>))}</tr></thead>
                      <tbody>
                        {dvcData.map(r => (
                          <tr key={r.period} className="border-b border-gray-100">
                            <td className="px-4 py-2 font-medium text-gray-800">{r.period}</td>
                            <td className="px-4 py-2 text-gray-600">{r.capacity}h</td>
                            <td className="px-4 py-2 text-gray-600">{r.demand}h</td>
                            <td className={`px-4 py-2 font-medium ${r.gap < 0 ? 'text-red-600' : 'text-green-600'}`}>{r.gap > 0 ? '+' : ''}{r.gap}h</td>
                            <td className="px-4 py-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${UTIL_TEXT(r.utilization)}`}>{r.utilization}%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'utilization' && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">Resource Utilization</h2></div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>{['Resource', 'Period', 'Available (h)', 'Demand (h)', 'Utilization', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>))}</tr></thead>
                  <tbody>
                    {utilData.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No utilization data.</td></tr>
                    ) : utilData.map((r, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                        <td className="px-4 py-3 text-gray-500">{r.period}</td>
                        <td className="px-4 py-3 text-gray-600">{r.availableHours}h</td>
                        <td className="px-4 py-3 text-gray-600">{r.demand}h</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-100 rounded-full">
                              <div className={`h-2 rounded-full ${UTIL_COLOR(r.utilization)}`} style={{ width: `${Math.min(r.utilization, 100)}%` }} />
                            </div>
                            <span className="text-xs text-gray-600">{r.utilization}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                            r.status === 'overallocated' ? 'bg-red-100 text-red-700' : r.status === 'optimal' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'conflicts' && (
              <div className="space-y-4">
                {conflicts.length === 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-3">
                    <FiActivity size={20} className="text-green-600" />
                    <p className="text-green-700 font-medium">No resource conflicts detected.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                      <FiAlertTriangle size={18} className="text-red-600" />
                      <p className="text-red-700 text-sm font-medium">{conflicts.length} resource conflict{conflicts.length > 1 ? 's' : ''} detected</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr>{['Resource', 'Period', 'Available (h)', 'Demand (h)', 'Over By', 'Competing'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>))}</tr></thead>
                        <tbody>
                          {conflicts.map((c, i) => (
                            <tr key={i} className="border-b border-gray-100 bg-red-50/30">
                              <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                              <td className="px-4 py-3 text-gray-500">{c.period}</td>
                              <td className="px-4 py-3 text-gray-600">{c.availableHours}h</td>
                              <td className="px-4 py-3 text-red-600 font-medium">{c.demandHours}h</td>
                              <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">+{c.overBy}h</span></td>
                              <td className="px-4 py-3 text-gray-500">{c.competingDemands} tasks</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === 'heatmap' && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Resource Utilization Heatmap</h2>
                {heatmap.periods.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No heatmap data available.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-gray-500 bg-gray-50 border border-gray-200 min-w-[140px]">Resource</th>
                          {heatmap.periods.map(p => (
                            <th key={p} className="px-3 py-2 font-medium text-gray-500 bg-gray-50 border border-gray-200 min-w-[80px]">{p}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {heatmap.rows.map((row, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-medium text-gray-700 border border-gray-200 bg-white">{row.name}</td>
                            {heatmap.periods.map(p => {
                              const val = row.cells?.[p] ?? 0;
                              const bg = val > 100 ? 'bg-red-500' : val >= 90 ? 'bg-orange-400' : val >= 70 ? 'bg-amber-300' : val >= 40 ? 'bg-green-300' : 'bg-gray-100';
                              const tx = val > 100 ? 'text-white' : val >= 90 ? 'text-white' : val >= 70 ? 'text-gray-800' : 'text-gray-600';
                              return (
                                <td key={p} className={`px-3 py-2 text-center border border-gray-200 font-medium ${bg} ${tx}`}>{val}%</td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" /><span>Low (&lt;40%)</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-300" /><span>Healthy (40–69%)</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-300" /><span>Optimal (70–89%)</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-400" /><span>High (90–100%)</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500" /><span>Over (&gt;100%)</span></div>
                </div>
              </div>
            )}

            {tab === 'records' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-gray-900">Capacity Records</h2>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>{['Employee', 'Period', 'Avail. (h)', ''].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>))}</tr></thead>
                    <tbody>
                      {capacityList.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">None yet.</td></tr>
                      ) : capacityList.slice(0, 15).map(c => (
                        <tr key={c._id} className="border-b border-gray-100">
                          <td className="px-4 py-2 text-gray-700">{c.employee ? `${c.employee.firstName || ''} ${c.employee.lastName || ''}`.trim() || c.employee.employeeCode : '—'}</td>
                          <td className="px-4 py-2 text-gray-500">{c.period}</td>
                          <td className="px-4 py-2 text-gray-600">{c.availableHours}h</td>
                          <td className="px-4 py-2">
                            <button onClick={async () => { if (window.confirm('Delete?')) { await deleteCapacity(c._id); loadData(); } }} className="p-1 text-red-400 hover:bg-red-50 rounded"><FiTrash2 size={13} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-gray-900">Demand Records</h2>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>{['Employee', 'Period', 'Demand (h)', 'Priority', ''].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>))}</tr></thead>
                    <tbody>
                      {demandList.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">None yet.</td></tr>
                      ) : demandList.slice(0, 15).map(d => (
                        <tr key={d._id} className="border-b border-gray-100">
                          <td className="px-4 py-2 text-gray-700">{d.employee ? `${d.employee.firstName || ''} ${d.employee.lastName || ''}`.trim() || d.employee.employeeCode : '—'}</td>
                          <td className="px-4 py-2 text-gray-500">{d.period}</td>
                          <td className="px-4 py-2 text-orange-600 font-medium">{d.demandHours}h</td>
                          <td className="px-4 py-2 text-gray-500 capitalize">{d.priority}</td>
                          <td className="px-4 py-2">
                            <button onClick={async () => { if (window.confirm('Delete?')) { await deleteDemand(d._id); loadData(); } }} className="p-1 text-red-400 hover:bg-red-50 rounded"><FiTrash2 size={13} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {capModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Add Capacity Record</h2>
              <form onSubmit={saveCapacity} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input value={capForm.employee} onChange={e => setCapForm(f => ({ ...f, employee: e.target.value }))} required placeholder="MongoDB ObjectId" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Period (e.g. 2026-06)</label>
                  <input value={capForm.period} onChange={e => setCapForm(f => ({ ...f, period: e.target.value }))} required placeholder="YYYY-MM" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Available Hours</label>
                    <input type="number" value={capForm.availableHours} onChange={e => setCapForm(f => ({ ...f, availableHours: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Allocated Hours</label>
                    <input type="number" value={capForm.allocatedHours} onChange={e => setCapForm(f => ({ ...f, allocatedHours: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setCapModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {demModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Add Demand Record</h2>
              <form onSubmit={saveDemand} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input value={demForm.employee} onChange={e => setDemForm(f => ({ ...f, employee: e.target.value }))} required placeholder="MongoDB ObjectId" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Period (e.g. 2026-06)</label>
                  <input value={demForm.period} onChange={e => setDemForm(f => ({ ...f, period: e.target.value }))} required placeholder="YYYY-MM" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Demand Hours</label>
                    <input type="number" value={demForm.demandHours} onChange={e => setDemForm(f => ({ ...f, demandHours: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select value={demForm.priority} onChange={e => setDemForm(f => ({ ...f, priority: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {['low', 'medium', 'high', 'critical'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setDemModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

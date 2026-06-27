import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import {
  fetchPortfolios, fetchPortfolioBudget, upsertPortfolioBudget,
  fetchForecasts, createForecast, updateForecast, deleteForecast,
  fetchBenefits, createBenefit, updateBenefit, deleteBenefit,
  fetchFinancialSummary,
} from '../../services/portfolioAPI';

const fmtC = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const BLANK_FC = { period: '', periodType: 'month', plannedCost: 0, forecastCost: 0, forecastBenefit: 0 };
const BLANK_BEN = { name: '', type: 'financial', status: 'planned', targetValue: 0, realizedValue: 0, currency: 'INR' };

export default function AdminPortfolioFinance() {
  const [portfolios, setPortfolios] = useState([]);
  const [pfId, setPfId]             = useState('');
  const [tab, setTab]               = useState('summary');

  const [summary, setSummary]       = useState(null);
  const [budget, setBudget]         = useState(null);
  const [budgetForm, setBudgetForm] = useState({ totalBudget: 0, capexBudget: 0, opexBudget: 0, approvedBudget: 0, actualSpend: 0, currency: 'INR' });
  const [forecasts, setForecasts]   = useState([]);
  const [benefits, setBenefits]     = useState([]);

  const [fcModal, setFcModal]       = useState(false);
  const [fcForm, setFcForm]         = useState(BLANK_FC);
  const [fcEditId, setFcEditId]     = useState(null);

  const [benModal, setBenModal]     = useState(false);
  const [benForm, setBenForm]       = useState(BLANK_BEN);
  const [benEditId, setBenEditId]   = useState(null);

  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    fetchPortfolios().then(r => {
      const list = r.data.data || r.data || [];
      setPortfolios(list);
      if (list.length > 0 && !pfId) setPfId(String(list[0]._id));
    }).catch(() => {});
  }, []);

  const loadAll = () => {
    if (!pfId) return;
    setLoading(true);
    Promise.all([
      fetchFinancialSummary(pfId),
      fetchPortfolioBudget(pfId),
      fetchForecasts(pfId),
      fetchBenefits(pfId),
    ]).then(([s, b, fc, ben]) => {
      setSummary(s.data.data || s.data);
      const bd = b.data.data || b.data;
      setBudget(bd);
      if (bd) setBudgetForm({ totalBudget: bd.totalBudget || 0, capexBudget: bd.capexBudget || 0, opexBudget: bd.opexBudget || 0, approvedBudget: bd.approvedBudget || 0, actualSpend: bd.actualSpend || 0, currency: bd.currency || 'INR' });
      setForecasts(fc.data.data || fc.data || []);
      setBenefits(ben.data.data || ben.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, [pfId]);

  const saveBudget = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(budgetForm).map(([k, v]) => [k, typeof v === 'string' && k !== 'currency' ? Number(v) : v]));
      await upsertPortfolioBudget(pfId, payload);
      loadAll();
    } catch (_) {} finally { setSaving(false); }
  };

  const openFcCreate = () => { setFcForm(BLANK_FC); setFcEditId(null); setFcModal(true); };
  const openFcEdit   = (fc) => { setFcForm({ ...BLANK_FC, ...fc }); setFcEditId(fc._id); setFcModal(true); };
  const saveFc = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const p = { ...fcForm, plannedCost: Number(fcForm.plannedCost), forecastCost: Number(fcForm.forecastCost), forecastBenefit: Number(fcForm.forecastBenefit) };
      if (fcEditId) await updateForecast(fcEditId, p); else await createForecast(pfId, p);
      setFcModal(false); loadAll();
    } catch (_) {} finally { setSaving(false); }
  };

  const openBenCreate = () => { setBenForm(BLANK_BEN); setBenEditId(null); setBenModal(true); };
  const openBenEdit   = (b) => { setBenForm({ ...BLANK_BEN, ...b }); setBenEditId(b._id); setBenModal(true); };
  const saveBen = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const p = { ...benForm, targetValue: Number(benForm.targetValue), realizedValue: Number(benForm.realizedValue) };
      if (benEditId) await updateBenefit(benEditId, p); else await createBenefit(pfId, p);
      setBenModal(false); loadAll();
    } catch (_) {} finally { setSaving(false); }
  };

  const TABS = ['summary', 'budget', 'forecast', 'benefits'];

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolio Finance</h1>
            <p className="text-sm text-gray-500 mt-1">Budget, forecast, benefits realization, ROI, NPV</p>
          </div>
          <select value={pfId} onChange={e => setPfId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[200px]">
            <option value="">Select portfolio…</option>
            {portfolios.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>

        {!pfId ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center text-gray-400">Select a portfolio to view financial data.</div>
        ) : (
          <>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-white shadow text-indigo-600' : 'text-gray-600'}`}>{t}</button>
              ))}
            </div>

            {loading ? <p className="text-gray-400 text-center py-10">Loading…</p> : (
              <>
                {tab === 'summary' && summary && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        ['Total Budget', fmtC(summary.totalBudget)],
                        ['Actual Cost', fmtC(summary.actualCost)],
                        ['Budget Burn', `${summary.budgetBurn}%`],
                        ['Cost Variance', fmtC(summary.costVariance)],
                        ['Planned Cost', fmtC(summary.plannedCost)],
                        ['Forecast Cost', fmtC(summary.forecastCost)],
                        ['ROI', `${summary.roi}%`],
                        ['NPV', fmtC(summary.npv)],
                        ['Target Benefits', fmtC(summary.targetBenefit)],
                        ['Realized Benefits', fmtC(summary.realizedBenefit)],
                        ['Benefits Realization', `${summary.benefitsRealizationPercent}%`],
                        ['Financial Health', (summary.health || '').replace(/_/g, ' ')],
                      ].map(([k, v]) => (
                        <div key={k} className="bg-white border border-gray-200 rounded-xl p-4">
                          <p className="text-lg font-bold text-gray-900">{v}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{k}</p>
                        </div>
                      ))}
                    </div>
                    {forecasts.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Planned vs Forecast Cost by Period</h2>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={forecasts}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v) => fmtC(v)} />
                            <Legend />
                            <Line type="monotone" dataKey="plannedCost" name="Planned Cost" stroke="#6366f1" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="forecastCost" name="Forecast Cost" stroke="#f97316" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="forecastBenefit" name="Forecast Benefit" stroke="#22c55e" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'budget' && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">Portfolio Budget</h2>
                    <form onSubmit={saveBudget} className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                          ['totalBudget', 'Total Budget'],
                          ['capexBudget', 'CAPEX Budget'],
                          ['opexBudget', 'OPEX Budget'],
                          ['approvedBudget', 'Approved Budget'],
                          ['actualSpend', 'Actual Spend'],
                        ].map(([k, label]) => (
                          <div key={k}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                            <input type="number" value={budgetForm[k]} onChange={e => setBudgetForm(f => ({ ...f, [k]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                          </div>
                        ))}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                          <input value={budgetForm.currency} onChange={e => setBudgetForm(f => ({ ...f, currency: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                      </div>
                      <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-60">{saving ? 'Saving…' : 'Save Budget'}</button>
                    </form>
                  </div>
                )}

                {tab === 'forecast' && (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-sm font-semibold text-gray-900">Forecast Periods</h2>
                      <button onClick={openFcCreate} className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm">
                        <FiPlus size={14} /> Add Period
                      </button>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr>{['Period', 'Type', 'Planned Cost', 'Forecast Cost', 'Forecast Benefit', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>))}</tr></thead>
                      <tbody>
                        {forecasts.length === 0 ? (
                          <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No forecast periods yet.</td></tr>
                        ) : forecasts.map(fc => (
                          <tr key={fc._id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{fc.period}</td>
                            <td className="px-4 py-3 text-gray-500 capitalize">{fc.periodType}</td>
                            <td className="px-4 py-3 text-gray-600">{fmtC(fc.plannedCost)}</td>
                            <td className="px-4 py-3 text-orange-600 font-medium">{fmtC(fc.forecastCost)}</td>
                            <td className="px-4 py-3 text-green-600 font-medium">{fmtC(fc.forecastBenefit)}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button onClick={() => openFcEdit(fc)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><FiEdit2 size={13} /></button>
                                <button onClick={async () => { if (window.confirm('Delete?')) { await deleteForecast(fc._id); loadAll(); } }} className="p-1 text-red-400 hover:bg-red-50 rounded"><FiTrash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {tab === 'benefits' && (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-sm font-semibold text-gray-900">Benefits Register</h2>
                      <button onClick={openBenCreate} className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm">
                        <FiPlus size={14} /> Add Benefit
                      </button>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr>{['Code', 'Name', 'Type', 'Target', 'Realized', 'Progress', 'Status', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>))}</tr></thead>
                      <tbody>
                        {benefits.length === 0 ? (
                          <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No benefits recorded yet.</td></tr>
                        ) : benefits.map(b => (
                          <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-xs text-gray-400">{b.benefitCode}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{b.name}</td>
                            <td className="px-4 py-3 text-gray-500 capitalize">{b.type}</td>
                            <td className="px-4 py-3 text-gray-600">{fmtC(b.targetValue)}</td>
                            <td className="px-4 py-3 text-green-600 font-medium">{fmtC(b.realizedValue)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-14 h-2 bg-gray-100 rounded-full">
                                  <div className="h-2 bg-green-500 rounded-full" style={{ width: `${b.progress || 0}%` }} />
                                </div>
                                <span className="text-xs text-gray-500">{b.progress || 0}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 capitalize">{b.status}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button onClick={() => openBenEdit(b)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><FiEdit2 size={13} /></button>
                                <button onClick={async () => { if (window.confirm('Delete?')) { await deleteBenefit(b._id); loadAll(); } }} className="p-1 text-red-400 hover:bg-red-50 rounded"><FiTrash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {fcModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{fcEditId ? 'Edit' : 'Add'} Forecast Period</h2>
              <form onSubmit={saveFc} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Period *</label>
                    <input value={fcForm.period} onChange={e => setFcForm(f => ({ ...f, period: e.target.value }))} required placeholder="e.g. 2026-Q1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select value={fcForm.periodType} onChange={e => setFcForm(f => ({ ...f, periodType: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {['month', 'quarter', 'year'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                {[['plannedCost', 'Planned Cost'], ['forecastCost', 'Forecast Cost'], ['forecastBenefit', 'Forecast Benefit']].map(([k, l]) => (
                  <div key={k}><label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                    <input type="number" value={fcForm[k]} onChange={e => setFcForm(f => ({ ...f, [k]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setFcModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {benModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{benEditId ? 'Edit' : 'Add'} Benefit</h2>
              <form onSubmit={saveBen} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={benForm.name} onChange={e => setBenForm(f => ({ ...f, name: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select value={benForm.type} onChange={e => setBenForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {['financial', 'operational', 'strategic', 'customer', 'employee', 'risk'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={benForm.status} onChange={e => setBenForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {['planned', 'on_track', 'at_risk', 'realized', 'cancelled'].map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                    <input type="number" value={benForm.targetValue} onChange={e => setBenForm(f => ({ ...f, targetValue: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Realized Value</label>
                    <input type="number" value={benForm.realizedValue} onChange={e => setBenForm(f => ({ ...f, realizedValue: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setBenModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

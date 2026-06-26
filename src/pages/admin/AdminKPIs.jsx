import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchKPIs, createKPI, deleteKPI, fetchKPIReviews, createKPIReview } from '../../services/performanceAPI';
import { FiPlus, FiX, FiTrash, FiList } from 'react-icons/fi';

const BLANK_KPI = { name: '', unit: '', targetValue: '', frequency: 'monthly', description: '' };
const BLANK_REVIEW = { kpi: '', actualValue: '', notes: '' };
const FREQ = ['daily', 'weekly', 'monthly', 'quarterly', 'annually'];

export default function AdminKPIs() {
  const [kpis, setKpis]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ ...BLANK_KPI });
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState('kpis');
  const [reviews, setReviews]   = useState([]);
  const [rvLoading, setRvLoading] = useState(false);
  const [rvModal, setRvModal]   = useState(false);
  const [rvForm, setRvForm]     = useState({ ...BLANK_REVIEW });
  const [rvSaving, setRvSaving] = useState(false);

  const loadKPIs = useCallback(() => {
    setLoading(true);
    fetchKPIs({ limit: 100 })
      .then(r => setKpis(r.data.data || r.data.kpis || []))
      .catch(e => setError(e.response?.data?.message || 'Failed to load KPIs'))
      .finally(() => setLoading(false));
  }, []);

  const loadReviews = useCallback(() => {
    setRvLoading(true);
    fetchKPIReviews({ limit: 100 })
      .then(r => setReviews(r.data.data || r.data.reviews || []))
      .catch(() => {})
      .finally(() => setRvLoading(false));
  }, []);

  useEffect(() => { loadKPIs(); }, [loadKPIs]);
  useEffect(() => { if (tab === 'reviews') loadReviews(); }, [tab, loadReviews]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setRv = k => e => setRvForm(p => ({ ...p, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await createKPI(form);
      setModal(false);
      loadKPIs();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this KPI?')) return;
    try { await deleteKPI(id); loadKPIs(); } catch { alert('Failed to delete'); }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    try {
      setRvSaving(true);
      await createKPIReview(rvForm);
      setRvModal(false);
      loadReviews();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setRvSaving(false); }
  };

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KPI Management</h1>
            <p className="text-sm text-gray-500 mt-1">Key Performance Indicators &amp; Reviews</p>
          </div>
          <button
            onClick={() => tab === 'kpis' ? (setForm({ ...BLANK_KPI }), setModal(true)) : (setRvForm({ ...BLANK_REVIEW }), setRvModal(true))}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <FiPlus size={15} /> {tab === 'kpis' ? 'Add KPI' : 'Add Review'}
          </button>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {[['kpis', 'KPIs'], ['reviews', 'KPI Reviews']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'kpis' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Code', 'Name', 'Unit', 'Target Value', 'Frequency', 'Description', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kpis.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No KPIs defined</td></tr>
                ) : kpis.map(k => (
                  <tr key={k._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{k.kpiCode || k.code || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{k.name}</td>
                    <td className="px-4 py-3 text-gray-600">{k.unit || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{k.targetValue ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{k.frequency || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{k.description || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(k._id)} className="p-1.5 text-gray-400 hover:text-red-500" title="Delete"><FiTrash size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {rvLoading ? (
              <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['KPI', 'Employee', 'Period', 'Target', 'Actual', 'Achievement %', 'Notes'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reviews.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No KPI reviews yet</td></tr>
                  ) : reviews.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{r.kpi?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{r.employee?.name || r.employee?.firstName || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.period || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{r.targetValue ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{r.actualValue ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden w-20">
                            <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${Math.min(r.achievementPercent || 0, 100)}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{r.achievementPercent ?? 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[150px]">{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add KPI</h2>
              <button onClick={() => setModal(false)}><FiX size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Name *</label>
                <input value={form.name} onChange={set('name')} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="KPI name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Unit</label>
                  <input value={form.unit} onChange={set('unit')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="%, count, ₹…" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Target Value</label>
                  <input type="number" value={form.targetValue} onChange={set('targetValue')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Frequency</label>
                <select value={form.frequency} onChange={set('frequency')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                  {FREQ.map(f => <option key={f} value={f} className="capitalize">{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Create KPI'}
                </button>
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rvModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add KPI Review</h2>
              <button onClick={() => setRvModal(false)}><FiX size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">KPI *</label>
                <select value={rvForm.kpi} onChange={setRv('kpi')} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select KPI</option>
                  {kpis.map(k => <option key={k._id} value={k._id}>{k.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Actual Value *</label>
                <input type="number" value={rvForm.actualValue} onChange={setRv('actualValue')} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Notes</label>
                <textarea value={rvForm.notes} onChange={setRv('notes')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={rvSaving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {rvSaving ? 'Saving…' : 'Submit Review'}
                </button>
                <button type="button" onClick={() => setRvModal(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

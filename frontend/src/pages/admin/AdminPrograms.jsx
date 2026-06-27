import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { FiPlus, FiEdit2, FiTrash2, FiLink } from 'react-icons/fi';
import {
  fetchPrograms, createProgram, updateProgram, deleteProgram,
  fetchProgramProjects, mapProject, unmapProject, fetchPortfolios,
} from '../../services/portfolioAPI';

const STATUS_COLORS = {
  planning: 'bg-gray-100 text-gray-600', active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700', completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

const BLANK = { name: '', description: '', portfolio: '', status: 'planning', totalBudget: 0, completionPercent: 0 };
const STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

export default function AdminPrograms() {
  const [programs, setPrograms]   = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [mappings, setMappings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('programs');
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(BLANK);
  const [editId, setEditId]       = useState(null);
  const [saving, setSaving]       = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetchPrograms(),
      fetchPortfolios(),
      fetchProgramProjects(),
    ]).then(([p, pf, m]) => {
      setPrograms(p.data.data || p.data || []);
      setPortfolios(pf.data.data || pf.data || []);
      setMappings(m.data.data || m.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const openCreate = () => { setForm(BLANK); setEditId(null); setModal(true); };
  const openEdit   = (p) => { setForm({ ...BLANK, ...p, portfolio: p.portfolio?._id || p.portfolio || '' }); setEditId(p._id); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, totalBudget: Number(form.totalBudget) || 0, completionPercent: Number(form.completionPercent) || 0 };
      if (editId) await updateProgram(editId, payload); else await createProgram(payload);
      setModal(false); loadAll();
    } catch (_) {} finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this program?')) return;
    try { await deleteProgram(id); loadAll(); } catch (_) {}
  };

  const handleUnmap = async (id) => {
    if (!window.confirm('Remove project mapping?')) return;
    try { await unmapProject(id); loadAll(); } catch (_) {}
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
            <p className="text-sm text-gray-500 mt-1">Portfolio programs and project mappings</p>
          </div>
          {tab === 'programs' && (
            <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <FiPlus size={16} /> New Program
            </button>
          )}
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {['programs', 'mappings'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-white shadow text-indigo-600' : 'text-gray-600'}`}>{t.replace('_', ' ')}</button>
          ))}
        </div>

        {loading ? <p className="text-gray-400 text-center py-10">Loading...</p> : (
          <>
            {tab === 'programs' && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['Code', 'Name', 'Portfolio', 'Status', 'Progress', 'Budget', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {programs.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No programs found.</td></tr>
                    ) : programs.map(p => (
                      <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.programCode}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                        <td className="px-4 py-3 text-gray-500">{p.portfolio?.name || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] || 'bg-gray-100'}`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-100 rounded-full">
                              <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${p.completionPercent || 0}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{p.completionPercent || 0}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">₹{Number(p.totalBudget || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(p)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><FiEdit2 size={14} /></button>
                            <button onClick={() => handleDelete(p._id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><FiTrash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'mappings' && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['Portfolio', 'Program', 'Project', 'Weight', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No project mappings yet.</td></tr>
                    ) : mappings.map(m => (
                      <tr key={m._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{m.program?.portfolio?.name || m.portfolio?.name || '—'}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{m.program?.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="flex items-center gap-1"><FiLink size={12} className="text-indigo-400" />{m.project?.name || '—'}</div>
                          <p className="text-xs text-gray-400 mt-0.5">{m.project?.projectCode}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{m.weight || 100}%</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleUnmap(m._id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Remove mapping"><FiTrash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {modal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{editId ? 'Edit' : 'New'} Program</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio *</label>
                  <select value={form.portfolio} onChange={e => setForm(f => ({ ...f, portfolio: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select portfolio…</option>
                    {portfolios.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {STATUSES.map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                    <input type="number" value={form.totalBudget} onChange={e => setForm(f => ({ ...f, totalBudget: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Completion %</label>
                    <input type="number" min="0" max="100" value={form.completionPercent} onChange={e => setForm(f => ({ ...f, completionPercent: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

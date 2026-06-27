import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { FiPlus, FiEdit2, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { fetchPortfolios, createPortfolio, updatePortfolio, deletePortfolio } from '../../services/portfolioAPI';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600', active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700', closed: 'bg-blue-100 text-blue-700', archived: 'bg-gray-100 text-gray-500',
};
const HEALTH_COLORS = {
  on_track: 'bg-green-100 text-green-700', at_risk: 'bg-yellow-100 text-yellow-700',
  off_track: 'bg-red-100 text-red-700', not_started: 'bg-gray-100 text-gray-500',
};
const BLANK = { name: '', description: '', category: 'strategic', priority: 'medium', status: 'draft', totalBudget: 0, strategicAlignment: 0, healthScore: 0, health: 'not_started' };
const STATUSES = ['all', 'draft', 'active', 'on_hold', 'closed', 'archived'];

export default function AdminPortfolios() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchPortfolios(filter !== 'all' ? { status: filter } : {})
      .then(r => setItems(r.data.data || r.data || [])).catch(() => setItems([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);

  const openCreate = () => { setForm(BLANK); setEditId(null); setModal(true); };
  const openEdit = (p) => { setForm({ ...BLANK, ...p }); setEditId(p._id); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, totalBudget: Number(form.totalBudget) || 0, strategicAlignment: Number(form.strategicAlignment) || 0, healthScore: Number(form.healthScore) || 0 };
      if (editId) await updatePortfolio(editId, payload); else await createPortfolio(payload);
      setModal(false); load();
    } catch (_) {} finally { setSaving(false); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this portfolio?')) return;
    try { await deletePortfolio(id); load(); } catch (_) {}
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolios</h1>
            <p className="text-sm text-gray-500 mt-1">Strategic project portfolios</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <FiPlus size={16} /> New Portfolio
          </button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {loading ? <p className="text-gray-400 text-center py-10">Loading...</p> : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Code', 'Name', 'Category', 'Status', 'Health', 'Alignment', 'Budget', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>))}</tr>
              </thead>
              <tbody>
                {items.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No portfolios found.</td></tr>
                  : items.map(p => (
                    <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.portfolioCode}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{p.category}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] || 'bg-gray-100'}`}>{p.status}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${HEALTH_COLORS[p.health] || 'bg-gray-100'}`}>{(p.health || '').replace(/_/g, ' ')}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-2 bg-gray-100 rounded-full"><div className="h-2 bg-purple-500 rounded-full" style={{ width: `${p.strategicAlignment || 0}%` }} /></div>
                          <span className="text-xs text-gray-500">{p.strategicAlignment || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">₹{Number(p.totalBudget || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Link to={`/admin/portfolio/${p._id}`} className="p-1 text-indigo-500 hover:bg-indigo-50 rounded" title="Open"><FiExternalLink size={15} /></Link>
                          <button onClick={() => openEdit(p)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><FiEdit2 size={14} /></button>
                          <button onClick={() => handleDelete(p._id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><FiTrash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>))}
              </tbody>
            </table>
          </div>
        )}

        {modal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{editId ? 'Edit' : 'New'} Portfolio</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {['strategic', 'operational', 'transformation', 'compliance', 'innovation'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {['low', 'medium', 'high', 'critical'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {['draft', 'active', 'on_hold', 'closed', 'archived'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Budget</label>
                    <input type="number" value={form.totalBudget} onChange={e => setForm(f => ({ ...f, totalBudget: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Alignment %</label>
                    <input type="number" min="0" max="100" value={form.strategicAlignment} onChange={e => setForm(f => ({ ...f, strategicAlignment: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Health</label>
                    <select value={form.health} onChange={e => setForm(f => ({ ...f, health: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {['not_started', 'on_track', 'at_risk', 'off_track'].map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}</select></div>
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

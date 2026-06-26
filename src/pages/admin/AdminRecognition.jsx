import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchRecognitions, createRecognition } from '../../services/performanceAPI';
import { fetchEmployees } from '../../services/hrmsAPI';
import { FiPlus, FiX, FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const TYPE_COLORS = {
  spot_award:          'bg-yellow-100 text-yellow-700',
  employee_of_month:   'bg-purple-100 text-purple-700',
  peer_recognition:    'bg-blue-100 text-blue-700',
  milestone:           'bg-green-100 text-green-700',
  innovation:          'bg-indigo-100 text-indigo-700',
  customer_excellence: 'bg-pink-100 text-pink-700',
  other:               'bg-gray-100 text-gray-600',
};

const BLANK = {
  toEmployee: '', fromEmployee: '', type: 'spot_award', message: '', points: 10, isPublic: true,
};

export default function AdminRecognition() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ ...BLANK });
  const [saving, setSaving]     = useState(false);
  const [employees, setEmployees] = useState([]);
  const limit = 15;

  const load = useCallback(() => {
    setLoading(true);
    fetchRecognitions({ page, limit })
      .then(r => { setItems(r.data.data || r.data.recognitions || []); setTotal(r.data.total || 0); })
      .catch(e => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openModal = () => {
    setForm({ ...BLANK });
    setModal(true);
    if (!employees.length) fetchEmployees({ limit: 200 }).then(r => setEmployees(r.data.data || r.data.employees || []));
  };

  const set = k => e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [k]: val }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await createRecognition(form);
      setModal(false);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recognitions</h1>
            <p className="text-sm text-gray-500 mt-1">{total} recognition entries</p>
          </div>
          <button onClick={openModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <FiPlus size={15} /> Give Recognition
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Code', 'From', 'To', 'Type', 'Points', 'Public', 'Message', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400">No recognitions yet</td></tr>
              ) : items.map(item => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.rcgCode || item.code || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{item.fromEmployee?.name || item.from?.name || item.givenBy?.name || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{item.toEmployee?.name || item.to?.name || item.recipient?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-600'}`}>
                      {(item.type || '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-yellow-600 font-semibold">
                      <FiStar size={13} />
                      {item.points ?? 0}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.isPublic ? 'Public' : 'Private'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">{item.message || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><FiChevronLeft size={14} /></button>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><FiChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Give Recognition</h2>
              <button onClick={() => setModal(false)}><FiX size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Recipient (To) *</label>
                <select value={form.toEmployee} onChange={set('toEmployee')} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.name || `${e.firstName} ${e.lastName}`}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">From (Given By)</label>
                <select value={form.fromEmployee} onChange={set('fromEmployee')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">Admin / HR</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.name || `${e.firstName} ${e.lastName}`}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
                  <select value={form.type} onChange={set('type')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    {Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Points</label>
                  <input type="number" value={form.points} onChange={set('points')} min={1} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Message</label>
                <textarea value={form.message} onChange={set('message')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Recognition message…" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.isPublic} onChange={set('isPublic')} className="accent-indigo-600" />
                Make public (visible to all employees)
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Give Recognition'}
                </button>
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

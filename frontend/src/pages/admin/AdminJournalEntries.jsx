import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge  from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchJournals, createJournal, deleteJournal, postJournal } from '../../services/financeAPI';

const STATUS_OPTS = ['','draft','posted','reversed','void'].map(v => ({ value: v, label: v || 'All Statuses' }));
const TYPE_OPTS   = ['','manual','automatic','recurring','reverse','adjustment','closing','opening'].map(v => ({ value: v, label: v || 'All Types' }));

const BLANK_JOURNAL = { journalType: 'manual', entryDate: new Date().toISOString().slice(0,10), narration: '', currency: 'INR' };
const BLANK_LINE    = { account: '', debit: 0, credit: 0, narration: '' };

export default function AdminJournalEntries() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [jType,    setJType]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(BLANK_JOURNAL);
  const [lines,    setLines]    = useState([{ ...BLANK_LINE }, { ...BLANK_LINE }]);
  const [delId,    setDelId]    = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchJournals({ page, limit: LIMIT, search, status, journalType: jType });
      setItems(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, search, status, jType]);

  useEffect(() => { load(); }, [load]);

  const totalDebit  = lines.reduce((s, l) => s + (Number(l.debit)  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.001;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!isBalanced) return alert(`Journal not balanced: Debit ₹${totalDebit.toFixed(2)} ≠ Credit ₹${totalCredit.toFixed(2)}`);
    try {
      await createJournal({ ...form, lines });
      setShowForm(false); setForm(BLANK_JOURNAL); setLines([{ ...BLANK_LINE }, { ...BLANK_LINE }]); load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handlePost = async (id) => {
    try { await postJournal(id); load(); } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleDelete = async () => {
    try { await deleteJournal(delId); setDelId(null); load(); } catch {}
  };

  const updateLine = (i, field, val) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  const addLine    = () => setLines(ls => [...ls, { ...BLANK_LINE }]);
  const removeLine = i  => setLines(ls => ls.filter((_, idx) => idx !== i));

  const columns = [
    { key: 'journalNumber', label: 'Journal No.', render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'journalType',  label: 'Type',   render: v => <span className="capitalize text-xs">{v}</span> },
    { key: 'entryDate',    label: 'Date',   render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'narration',    label: 'Narration', render: v => <span className="truncate max-w-xs block">{v}</span> },
    { key: 'status',       label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'totalDebit',   label: 'Debit',  render: v => `₹${Number(v||0).toLocaleString('en-IN')}` },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-1 flex-wrap">
          <Link to={`/admin/finance/journals/${v}`} className="text-xs text-blue-600 hover:underline">View</Link>
          {row.status === 'draft' && <button onClick={() => handlePost(v)} className="text-xs text-green-600 hover:underline">Post</button>}
          {row.status === 'draft' && <button onClick={() => setDelId(v)} className="text-xs text-red-500 hover:underline">Del</button>}
        </div>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Journal Entries" subtitle={`${total} journals`}>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Journal</button>
      </SectionHeader>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search journals..." />
        <FilterToolbar filters={[
          { label: 'Status', value: status, onChange: v => { setStatus(v); setPage(1); }, options: STATUS_OPTS },
          { label: 'Type',   value: jType,  onChange: v => { setJType(v);  setPage(1); }, options: TYPE_OPTS  },
        ]} />
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No journal entries found" /> :
        <><DataTable columns={columns} data={items} /><Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} /></>
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-2xl space-y-4">
            <h3 className="text-lg font-semibold">New Journal Entry</h3>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.journalType} onChange={e => setForm(f=>({...f,journalType:e.target.value}))} className="border rounded-lg px-3 py-2 text-sm">
                {['manual','adjustment','closing','opening'].map(t=><option key={t}>{t}</option>)}
              </select>
              <input required type="date" value={form.entryDate} onChange={e => setForm(f=>({...f,entryDate:e.target.value}))} className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <input required placeholder="Narration" value={form.narration} onChange={e => setForm(f=>({...f,narration:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50"><th className="px-2 py-2 text-left">Account ID</th><th className="px-2 py-2">Debit</th><th className="px-2 py-2">Credit</th><th className="px-2 py-2">Narration</th><th></th></tr></thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1"><input required placeholder="Account ID" value={l.account} onChange={e => updateLine(i,'account',e.target.value)} className="border rounded px-2 py-1 text-xs w-36" /></td>
                      <td className="px-2 py-1"><input type="number" min="0" step="0.01" value={l.debit} onChange={e => updateLine(i,'debit',e.target.value)} className="border rounded px-2 py-1 text-xs w-24" /></td>
                      <td className="px-2 py-1"><input type="number" min="0" step="0.01" value={l.credit} onChange={e => updateLine(i,'credit',e.target.value)} className="border rounded px-2 py-1 text-xs w-24" /></td>
                      <td className="px-2 py-1"><input placeholder="Narration" value={l.narration} onChange={e => updateLine(i,'narration',e.target.value)} className="border rounded px-2 py-1 text-xs w-28" /></td>
                      <td className="px-2 py-1">{lines.length > 2 && <button type="button" onClick={() => removeLine(i)} className="text-red-500 text-xs">×</button>}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td className="px-2 py-2 text-xs font-semibold">TOTAL</td>
                    <td className={`px-2 py-2 text-xs font-semibold ${isBalanced ? 'text-green-600' : 'text-red-500'}`}>₹{totalDebit.toFixed(2)}</td>
                    <td className={`px-2 py-2 text-xs font-semibold ${isBalanced ? 'text-green-600' : 'text-red-500'}`}>₹{totalCredit.toFixed(2)}</td>
                    <td colSpan={2} className="px-2 py-2 text-xs">{isBalanced ? <span className="text-green-600 font-medium">✓ Balanced</span> : <span className="text-red-500 font-medium">✗ Not balanced</span>}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <button type="button" onClick={addLine} className="text-sm text-orange-500 hover:underline">+ Add Line</button>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={!isBalanced} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm disabled:opacity-50">Create Journal</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!delId} title="Delete Journal" message="Delete this draft journal?" onConfirm={handleDelete} onCancel={() => setDelId(null)} />
    </div>
  );
}

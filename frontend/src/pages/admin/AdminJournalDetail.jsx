import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SectionHeader from '../../components/shared/SectionHeader';
import StatusBadge  from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchJournal, postJournal, reverseJournal, deleteJournal } from '../../services/financeAPI';

export default function AdminJournalDetail() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [confirm,  setConfirm]  = useState(null);

  const load = async () => {
    setLoading(true);
    try { const r = await fetchJournal(id); setData(r.data.data); }
    catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handlePost = async () => {
    try { await postJournal(id); load(); } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleReverse = async () => {
    try { await reverseJournal(id, { reversalDate: new Date().toISOString().slice(0,10) }); nav('/admin/finance/journals'); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleDelete = async () => {
    try { await deleteJournal(id); nav('/admin/finance/journals'); } catch {}
  };

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;
  if (!data)   return null;

  const lines  = data.lines || [];
  const totalD = lines.reduce((s, l) => s + l.debit, 0);
  const totalC = lines.reduce((s, l) => s + l.credit, 0);

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title={`Journal: ${data.journalNumber}`} subtitle={`${data.journalType} • ${new Date(data.entryDate).toLocaleDateString()}`}>
        <div className="flex gap-2">
          {data.status === 'draft'  && <button onClick={() => setConfirm('post')}    className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm">Post</button>}
          {data.status === 'posted' && <button onClick={() => setConfirm('reverse')} className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm">Reverse</button>}
          {data.status === 'draft'  && <button onClick={() => setConfirm('delete')}  className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm">Delete</button>}
        </div>
      </SectionHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-xl shadow-sm p-5">
        <div><p className="text-xs text-gray-500">Journal Number</p><p className="font-mono font-semibold">{data.journalNumber}</p></div>
        <div><p className="text-xs text-gray-500">Type</p><p className="capitalize">{data.journalType}</p></div>
        <div><p className="text-xs text-gray-500">Status</p><StatusBadge status={data.status} /></div>
        <div><p className="text-xs text-gray-500">Date</p><p>{new Date(data.entryDate).toLocaleDateString()}</p></div>
        <div className="col-span-2"><p className="text-xs text-gray-500">Narration</p><p>{data.narration}</p></div>
        <div><p className="text-xs text-gray-500">Total Debit</p><p className="font-semibold text-blue-600">₹{Number(data.totalDebit||0).toLocaleString('en-IN')}</p></div>
        <div><p className="text-xs text-gray-500">Total Credit</p><p className="font-semibold text-green-600">₹{Number(data.totalCredit||0).toLocaleString('en-IN')}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-3">Journal Lines</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500">
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Account</th>
              <th className="px-3 py-2 text-right">Debit</th>
              <th className="px-3 py-2 text-right">Credit</th>
              <th className="px-3 py-2 text-left">Narration</th>
            </tr></thead>
            <tbody>
              {lines.map(l => (
                <tr key={l._id} className="border-t">
                  <td className="px-3 py-2 text-gray-400 text-xs">{l.lineNumber}</td>
                  <td className="px-3 py-2">
                    {l.account ? <span><span className="font-mono text-xs text-gray-500">{l.account.accountCode}</span> {l.account.accountName}</span> : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-blue-600">{l.debit > 0 ? `₹${Number(l.debit).toLocaleString('en-IN')}` : '—'}</td>
                  <td className="px-3 py-2 text-right font-medium text-green-600">{l.credit > 0 ? `₹${Number(l.credit).toLocaleString('en-IN')}` : '—'}</td>
                  <td className="px-3 py-2 text-gray-500">{l.narration || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-3 py-2" colSpan={2}>TOTAL</td>
                <td className="px-3 py-2 text-right text-blue-600">₹{totalD.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-right text-green-600">₹{totalC.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2">{Math.abs(totalD - totalC) < 0.01 ? <span className="text-green-600 text-xs">✓ Balanced</span> : <span className="text-red-500 text-xs">✗ Imbalanced</span>}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm === 'post' ? 'Post Journal' : confirm === 'reverse' ? 'Reverse Journal' : 'Delete Journal'}
        message={confirm === 'post' ? 'Post this journal entry to the General Ledger? This cannot be undone.' : confirm === 'reverse' ? 'Create a reversal journal entry?' : 'Delete this draft journal?'}
        onConfirm={() => { const a = confirm; setConfirm(null); if (a==='post') handlePost(); else if (a==='reverse') handleReverse(); else handleDelete(); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

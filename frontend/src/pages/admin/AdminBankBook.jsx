import React, { useState } from 'react';
import SectionHeader from '../../components/shared/SectionHeader';
import Pagination   from '../../components/shared/Pagination';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import { fetchBankBook } from '../../services/financeAPI';

export default function AdminBankBook() {
  const [accountId, setAccId]   = useState('');
  const [startDate, setStart]   = useState('');
  const [endDate,   setEnd]     = useState('');
  const [data,      setData]    = useState(null);
  const [page,      setPage]    = useState(1);
  const [loading,   setLoading] = useState(false);
  const [error,     setError]   = useState('');
  const LIMIT = 50;

  const load = async (p = 1) => {
    if (!accountId) return alert('Enter a Bank Account ID');
    setLoading(true); setError(''); setData(null);
    try {
      const res = await fetchBankBook({ accountId, startDate, endDate, page: p, limit: LIMIT });
      setData(res.data.data); setPage(p);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  };

  const rows = data?.rows || [];

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Bank Book" subtitle="Bank account transactions" />

      <div className="bg-white rounded-xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div><label className="text-xs text-gray-500 block mb-1">Bank Account ID *</label><input required value={accountId} onChange={e=>setAccId(e.target.value)} placeholder="Account ID" className="border rounded-lg px-3 py-2 text-sm" /></div>
        <div><label className="text-xs text-gray-500 block mb-1">From</label><input type="date" value={startDate} onChange={e=>setStart(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" /></div>
        <div><label className="text-xs text-gray-500 block mb-1">To</label><input type="date" value={endDate} onChange={e=>setEnd(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" /></div>
        <button onClick={() => load(1)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">Generate</button>
      </div>

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center"><p className="text-xs text-blue-500">Total Debits</p><p className="font-bold text-blue-700 text-lg">₹{Number(data.totalDebit||0).toLocaleString('en-IN')}</p></div>
            <div className="bg-green-50 rounded-xl p-4 text-center"><p className="text-xs text-green-500">Total Credits</p><p className="font-bold text-green-700 text-lg">₹{Number(data.totalCredit||0).toLocaleString('en-IN')}</p></div>
            <div className="bg-orange-50 rounded-xl p-4 text-center"><p className="text-xs text-orange-500">Closing Balance</p><p className="font-bold text-orange-700 text-lg">₹{Number(data.closingBalance||0).toLocaleString('en-IN')}</p></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {rows.length === 0 ? <EmptyState title="No transactions" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-gray-500"><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Journal</th><th className="px-3 py-2 text-left">Narration</th><th className="px-3 py-2 text-right">Debit</th><th className="px-3 py-2 text-right">Credit</th><th className="px-3 py-2 text-right">Balance</th></tr></thead>
                  <tbody>{rows.map((r, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{r.entryDate ? new Date(r.entryDate).toLocaleDateString() : '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.journalEntry?.journalNumber || '—'}</td>
                      <td className="px-3 py-2 truncate max-w-xs">{r.narration || r.journalEntry?.narration || '—'}</td>
                      <td className="px-3 py-2 text-right text-blue-600">{r.debit > 0 ? `₹${r.debit.toLocaleString('en-IN')}` : '—'}</td>
                      <td className="px-3 py-2 text-right text-green-600">{r.credit > 0 ? `₹${r.credit.toLocaleString('en-IN')}` : '—'}</td>
                      <td className="px-3 py-2 text-right font-medium">₹{Number(r.runningBalance||0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
          <Pagination page={page} total={data.total || 0} limit={LIMIT} onPageChange={p => load(p)} />
        </>
      )}
    </div>
  );
}

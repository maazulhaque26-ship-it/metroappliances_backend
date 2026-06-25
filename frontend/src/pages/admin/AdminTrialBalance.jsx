import React, { useState } from 'react';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import { fetchTrialBalance, saveTrialBalanceSnapshot } from '../../services/financeAPI';

export default function AdminTrialBalance() {
  const [asOfDate,   setAsOfDate]  = useState(new Date().toISOString().slice(0,10));
  const [fiscalYear, setFY]        = useState('');
  const [data,       setData]      = useState(null);
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState('');
  const [saving,     setSaving]    = useState(false);

  const load = async () => {
    setLoading(true); setError(''); setData(null);
    try {
      const res = await fetchTrialBalance({ asOfDate, fiscalYear: fiscalYear || undefined });
      setData(res.data.data);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!fiscalYear) return alert('Please enter a fiscal year ID to save snapshot');
    setSaving(true);
    try { await saveTrialBalanceSnapshot({ fiscalYear, asOfDate }); alert('Trial balance snapshot saved!'); }
    catch (e) { alert(e.response?.data?.message || e.message); }
    finally { setSaving(false); }
  };

  const totalDebit  = data?.totalDebit  || 0;
  const totalCredit = data?.totalCredit || 0;
  const rows = data?.rows || [];

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Trial Balance" subtitle="Point-in-time debit/credit summary" />

      <div className="bg-white rounded-xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">As of Date</label>
          <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Fiscal Year ID (optional)</label>
          <input value={fiscalYear} onChange={e => setFY(e.target.value)} placeholder="Fiscal Year ID" className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={load} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">Generate</button>
        {data && <button onClick={handleSave} disabled={saving} className="px-4 py-2 border border-orange-500 text-orange-500 rounded-lg text-sm hover:bg-orange-50 disabled:opacity-50">Save Snapshot</button>}
      </div>

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}

      {data && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Trial Balance — {new Date(asOfDate).toLocaleDateString()}</h3>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${data.isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {data.isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
            </span>
          </div>
          {rows.length === 0 ? <EmptyState title="No data for selected period" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-gray-500">
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-left">Account Name</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-right">Debit</th>
                  <th className="px-4 py-2 text-right">Credit</th>
                </tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{r.account?.accountCode || '—'}</td>
                      <td className="px-4 py-2">{r.account?.accountName || '—'}</td>
                      <td className="px-4 py-2 capitalize text-xs text-gray-500">{r.account?.accountType}</td>
                      <td className="px-4 py-2 text-right font-medium text-blue-600">{r.debit > 0 ? `₹${r.debit.toLocaleString('en-IN')}` : '—'}</td>
                      <td className="px-4 py-2 text-right font-medium text-green-600">{r.credit > 0 ? `₹${r.credit.toLocaleString('en-IN')}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-semibold text-gray-700">
                    <td className="px-4 py-3" colSpan={3}>TOTAL</td>
                    <td className="px-4 py-3 text-right text-blue-700">₹{totalDebit.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-green-700">₹{totalCredit.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

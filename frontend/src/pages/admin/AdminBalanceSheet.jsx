import React, { useState } from 'react';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import { fetchBalanceSheet } from '../../services/financeAPI';

function Section({ title, rows, total, color }) {
  return (
    <div className="mb-4">
      <h4 className={`font-semibold text-sm mb-2 ${color}`}>{title}</h4>
      {rows.map((r, i) => (
        <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100">
          <span className="text-gray-700">{r.accountName}</span>
          <span className="font-medium">₹{Number(r.balance || 0).toLocaleString('en-IN')}</span>
        </div>
      ))}
      <div className="flex justify-between font-semibold text-sm mt-2 pt-2 border-t-2 border-gray-300">
        <span>Total {title}</span>
        <span>₹{Number(total || 0).toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}

export default function AdminBalanceSheet() {
  const [asOfDate,   setAsOfDate] = useState(new Date().toISOString().slice(0,10));
  const [fiscalYear, setFY]       = useState('');
  const [data,       setData]     = useState(null);
  const [loading,    setLoading]  = useState(false);
  const [error,      setError]    = useState('');

  const load = async () => {
    setLoading(true); setError(''); setData(null);
    try {
      const res = await fetchBalanceSheet({ asOfDate, fiscalYear: fiscalYear || undefined });
      setData(res.data.data);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Balance Sheet" subtitle="Assets = Liabilities + Equity" />

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
      </div>

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Assets</h3>
            {data.assets?.length === 0 ? <EmptyState title="No assets" /> : <Section title="Assets" rows={data.assets||[]} total={data.totalAssets} color="text-blue-600" />}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Liabilities & Equity</h3>
            <Section title="Liabilities" rows={data.liabilities||[]} total={data.totalLiabilities} color="text-red-600" />
            <Section title="Equity"      rows={data.equity||[]}      total={data.totalEquity}      color="text-purple-600" />
          </div>
          <div className={`lg:col-span-2 text-center p-3 rounded-lg text-sm font-semibold ${data.isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {data.isBalanced ? `✓ Balanced — Total Assets: ₹${Number(data.totalAssets||0).toLocaleString('en-IN')}` : `✗ Not Balanced — Assets: ₹${Number(data.totalAssets||0).toLocaleString('en-IN')} vs L+E: ₹${Number((data.totalLiabilities||0)+(data.totalEquity||0)).toLocaleString('en-IN')}`}
          </div>
        </div>
      )}
    </div>
  );
}

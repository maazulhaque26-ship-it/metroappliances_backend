import React, { useState } from 'react';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import { fetchProfitAndLoss } from '../../services/financeAPI';

export default function AdminProfitAndLoss() {
  const [startDate, setStart]   = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().slice(0,10));
  const [endDate,   setEnd]     = useState(new Date().toISOString().slice(0,10));
  const [fiscalYear, setFY]     = useState('');
  const [data,       setData]   = useState(null);
  const [loading,    setLoading]= useState(false);
  const [error,      setError]  = useState('');

  const load = async () => {
    setLoading(true); setError(''); setData(null);
    try {
      const res = await fetchProfitAndLoss({ startDate, endDate, fiscalYear: fiscalYear || undefined });
      setData(res.data.data);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Profit & Loss Statement" subtitle="Revenue vs Expenses" />

      <div className="bg-white rounded-xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div><label className="text-xs text-gray-500 block mb-1">From</label><input type="date" value={startDate} onChange={e=>setStart(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" /></div>
        <div><label className="text-xs text-gray-500 block mb-1">To</label><input type="date" value={endDate} onChange={e=>setEnd(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" /></div>
        <div><label className="text-xs text-gray-500 block mb-1">Fiscal Year ID (opt)</label><input value={fiscalYear} onChange={e=>setFY(e.target.value)} placeholder="FY ID" className="border rounded-lg px-3 py-2 text-sm" /></div>
        <button onClick={load} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">Generate</button>
      </div>

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}

      {data && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-6">
          <div>
            <h4 className="font-semibold text-green-600 mb-3">Revenue</h4>
            {(data.revenues||[]).map((r, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100">
                <span>{r.accountName}</span>
                <span className="text-green-600 font-medium">₹{Number(r.balance||0).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-sm mt-2 pt-2 border-t-2"><span>Total Revenue</span><span className="text-green-700">₹{Number(data.totalRevenue||0).toLocaleString('en-IN')}</span></div>
          </div>

          <div>
            <h4 className="font-semibold text-red-600 mb-3">Expenses</h4>
            {(data.expenses||[]).map((r, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100">
                <span>{r.accountName}</span>
                <span className="text-red-500 font-medium">₹{Number(r.balance||0).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-sm mt-2 pt-2 border-t-2"><span>Total Expenses</span><span className="text-red-700">₹{Number(data.totalExpense||0).toLocaleString('en-IN')}</span></div>
          </div>

          <div className={`flex justify-between font-bold text-lg p-4 rounded-lg ${(data.netProfit||0) >= 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <span>Net {(data.netProfit||0) >= 0 ? 'Profit' : 'Loss'}</span>
            <span>₹{Math.abs(data.netProfit||0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

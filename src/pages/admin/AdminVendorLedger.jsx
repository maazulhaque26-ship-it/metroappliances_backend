import React, { useState } from 'react';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import { fetchLedgerStatement } from '../../services/accountsPayableAPI';

const fmt = v => `₹${(v||0).toLocaleString('en-IN')}`;

export default function AdminVendorLedger() {
  const [vendor,   setVendor]  = useState('');
  const [fromDate, setFrom]    = useState('');
  const [toDate,   setTo]      = useState('');
  const [data,     setData]    = useState(null);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');

  const load = async () => {
    if (!vendor || !fromDate || !toDate) return alert('Vendor ID, from date, and to date are required');
    setLoading(true); setError(''); setData(null);
    try {
      const r = await fetchLedgerStatement({ vendor, fromDate, toDate });
      setData(r.data.data);
    } catch(e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Vendor Ledger" subtitle="AP account statement per vendor" />

      <div className="bg-white rounded-xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Vendor ID</label>
          <input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="Vendor MongoDB ID" className="border rounded-lg px-3 py-2 text-sm w-72" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">From</label>
          <input type="date" value={fromDate} onChange={e => setFrom(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">To</label>
          <input type="date" value={toDate} onChange={e => setTo(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={load} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">Generate</button>
      </div>

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}

      {data && (
        <>
          <div className="grid grid-cols-4 gap-4">
            {[
              ['Opening Balance', fmt(data.openingBalance)],
              ['Total Debits',    fmt(data.totalDebits)],
              ['Total Credits',   fmt(data.totalCredits)],
              ['Closing Balance', fmt(data.closingBalance)],
            ].map(([l, v]) => (
              <div key={l} className="bg-white rounded-xl shadow-sm p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{l}</p>
                <p className="text-lg font-bold text-gray-800">{v}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b"><h3 className="font-semibold text-gray-700">Ledger Entries</h3></div>
            {(!data.lines || data.lines.length === 0) ? <EmptyState title="No entries in this period" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Reference</th>
                    <th className="px-4 py-2 text-left">Narration</th>
                    <th className="px-4 py-2 text-right">Debit</th>
                    <th className="px-4 py-2 text-right">Credit</th>
                    <th className="px-4 py-2 text-right">Balance</th>
                  </tr></thead>
                  <tbody>
                    {data.lines.map((e, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2">{e.entryDate ? new Date(e.entryDate).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-2 capitalize text-xs text-gray-500">{e.entryType?.replace(/_/g,' ')}</td>
                        <td className="px-4 py-2 font-mono text-xs">{e.reference || '—'}</td>
                        <td className="px-4 py-2 text-gray-600">{e.narration || '—'}</td>
                        <td className="px-4 py-2 text-right text-red-600">{e.debit > 0 ? fmt(e.debit) : '—'}</td>
                        <td className="px-4 py-2 text-right text-green-600">{e.credit > 0 ? fmt(e.credit) : '—'}</td>
                        <td className="px-4 py-2 text-right font-semibold">{fmt(e.runningBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

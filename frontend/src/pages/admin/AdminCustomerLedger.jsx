import React, { useState } from 'react';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import EmptyState from '../../components/shared/EmptyState';
import { fetchAccountStatement } from '../../services/accountsReceivableAPI';

export default function AdminCustomerLedger() {
  const [customerId, setCustomerId] = useState('');
  const [fromDate,   setFromDate]   = useState('');
  const [toDate,     setToDate]     = useState('');
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const handleFetch = async (e) => {
    e.preventDefault();
    if (!customerId || !fromDate || !toDate) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetchAccountStatement({ customer: customerId, fromDate, toDate });
      setResult(r.data.data);
    } catch { setError('Failed to load ledger'); }
    finally { setLoading(false); }
  };

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Customer Ledger</h1>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-4)' }}>Account statement with running balance</p>
      </div>

      <div className="p-5 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <form onSubmit={handleFetch} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>Customer ID</label>
            <input value={customerId} onChange={e => setCustomerId(e.target.value)} required placeholder="MongoDB ObjectId"
              className="px-3 py-2 text-[12.5px] rounded-lg outline-none w-56"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} required
              className="px-3 py-2 text-[12.5px] rounded-lg outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} required
              className="px-3 py-2 text-[12.5px] rounded-lg outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <button type="submit" disabled={loading} className="px-5 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>
            {loading ? 'Loading…' : 'Generate Statement'}
          </button>
        </form>
      </div>

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}
      {result  && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[['Opening Balance', fmt(result.openingBalance)], ['Closing Balance', fmt(result.closingBalance)], ['Entries', result.entries?.length || 0]].map(([l,v]) => (
              <div key={l} className="p-4 rounded-xl text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <p className="text-[11px]" style={{ color: 'var(--text-4)' }}>{l}</p>
                <p className="text-[18px] font-bold mt-1" style={{ color: 'var(--text)' }}>{v}</p>
              </div>
            ))}
          </div>
          {result.entries?.length === 0 ? <EmptyState message="No transactions in this period" /> : (
            <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-[12px]">
                <thead style={{ background: 'var(--bg)' }}>
                  <tr>{['Date','Type','Reference','Narration','Debit','Credit','Balance'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-3)' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {result.entries.map((e, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-2)' }}>{e.entryDate ? new Date(e.entryDate).toLocaleDateString('en-IN') : '-'}</td>
                      <td className="px-4 py-2.5 capitalize" style={{ color: 'var(--text-2)' }}>{e.entryType?.replace(/_/g,' ')}</td>
                      <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--accent)' }}>{e.reference}</td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-3)' }}>{e.narration}</td>
                      <td className="px-4 py-2.5 text-right" style={{ color: '#22c55e' }}>{e.debit > 0 ? fmt(e.debit) : '-'}</td>
                      <td className="px-4 py-2.5 text-right" style={{ color: '#ef4444' }}>{e.credit > 0 ? fmt(e.credit) : '-'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--text)' }}>{fmt(e.runningBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

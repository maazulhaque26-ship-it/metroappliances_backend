import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import FilterToolbar from '../../components/shared/FilterToolbar';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import { fetchLedgerEntries } from '../../services/financeAPI';

export default function AdminGeneralLedger() {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [account, setAccount] = useState('');
  const [startDate, setStart] = useState('');
  const [endDate,   setEnd]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchLedgerEntries({ page, limit: LIMIT, account, startDate, endDate });
      setItems(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, account, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'entryDate',    label: 'Date',    render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'account',      label: 'Account', render: v => v ? <span><span className="font-mono text-xs text-gray-500">{v.accountCode}</span> {v.accountName}</span> : '—' },
    { key: 'journalEntry', label: 'Journal', render: v => v ? <span className="font-mono text-xs">{v.journalNumber}</span> : '—' },
    { key: 'narration',    label: 'Narration', render: v => <span className="text-sm truncate max-w-xs block">{v || '—'}</span> },
    { key: 'debit',        label: 'Debit',   render: v => v > 0 ? <span className="text-blue-600 font-medium">₹{Number(v).toLocaleString('en-IN')}</span> : '—' },
    { key: 'credit',       label: 'Credit',  render: v => v > 0 ? <span className="text-green-600 font-medium">₹{Number(v).toLocaleString('en-IN')}</span> : '—' },
  ];

  return (
    <div className="p-6">
      <SectionHeader title="General Ledger" subtitle={`${total} entries`} />

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Account ID</label>
          <input value={account} onChange={e => { setAccount(e.target.value); setPage(1); }} placeholder="Filter by account ID" className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">From</label>
          <input type="date" value={startDate} onChange={e => { setStart(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">To</label>
          <input type="date" value={endDate} onChange={e => { setEnd(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={() => { setAccount(''); setStart(''); setEnd(''); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm text-gray-600">Clear</button>
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No ledger entries found" /> :
        <><DataTable columns={columns} data={items} /><Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} /></>
      }
    </div>
  );
}

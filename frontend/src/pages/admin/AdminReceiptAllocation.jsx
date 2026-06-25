import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import Pagination from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import EmptyState from '../../components/shared/EmptyState';
import { fetchReceiptAllocations } from '../../services/accountsReceivableAPI';

export default function AdminReceiptAllocation() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    fetchReceiptAllocations({ page, limit: LIMIT })
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(() => setError('Failed to load allocations'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const columns = [
    { key: 'allocationNumber', label: 'Allocation #', render: r => <span className="font-semibold" style={{ color: 'var(--accent)' }}>{r.allocationNumber}</span> },
    { key: 'customerName',     label: 'Customer' },
    { key: 'allocationDate',   label: 'Date', render: r => r.allocationDate ? new Date(r.allocationDate).toLocaleDateString('en-IN') : '-' },
    { key: 'totalAllocated',   label: 'Total Allocated', render: r => fmt(r.totalAllocated) },
    { key: 'lines',            label: 'Invoices', render: r => (r.lines || []).length },
    { key: 'status',           label: 'Status', render: r => <span className="text-[11px] capitalize" style={{ color: 'var(--text-2)' }}>{r.status}</span> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Receipt Allocations</h1>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-4)' }}>Receipts allocated to customer invoices</p>
      </div>
      <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search allocations…" />
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : data.length === 0 ? <EmptyState message="No allocations yet" /> : (
        <>
          <DataTable columns={columns} data={data} />
          <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
        </>
      )}
    </div>
  );
}

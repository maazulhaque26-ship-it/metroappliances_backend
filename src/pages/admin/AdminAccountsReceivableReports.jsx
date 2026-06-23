import React, { useCallback, useEffect, useState } from 'react';
import ChartCard from '../../components/shared/ChartCard';
import DataTable from '../../components/shared/DataTable';
import Pagination from '../../components/shared/Pagination';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import EmptyState from '../../components/shared/EmptyState';
import { fetchAgingSnapshots, fetchSalesRegister, fetchReceiptRegister } from '../../services/accountsReceivableAPI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#FF7A00','#D4AF37','#22c55e','#3b82f6','#a855f7','#ef4444'];

export default function AdminAccountsReceivableReports() {
  const [tab,     setTab]     = useState('aging');
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true); setError('');
    const fn = tab === 'aging' ? fetchAgingSnapshots : tab === 'sales' ? fetchSalesRegister : fetchReceiptRegister;
    fn({ page, limit: LIMIT })
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(() => setError('Failed to load report'))
      .finally(() => setLoading(false));
  }, [page, tab]);

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { load(); }, [load]);

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '-';

  const agingCols = [
    { key: 'asOfDate',    label: 'As Of', render: r => fmtDate(r.asOfDate) },
    { key: 'current',     label: 'Current',  render: r => fmt(r.current) },
    { key: 'days1_30',    label: '1-30d',    render: r => fmt(r.days1_30) },
    { key: 'days31_60',   label: '31-60d',   render: r => fmt(r.days31_60) },
    { key: 'days61_90',   label: '61-90d',   render: r => fmt(r.days61_90) },
    { key: 'days91_120',  label: '91-120d',  render: r => fmt(r.days91_120) },
    { key: 'days180Plus', label: '180+d',    render: r => fmt(r.days180Plus) },
    { key: 'total',       label: 'Total', render: r => <span className="font-semibold">{fmt(r.total)}</span> },
  ];

  const salesCols = [
    { key: 'registerNumber', label: '#', render: r => <span className="font-semibold" style={{ color: 'var(--accent)' }}>{r.registerNumber}</span> },
    { key: 'invoiceDate',    label: 'Date', render: r => fmtDate(r.invoiceDate) },
    { key: 'customerName',   label: 'Customer' },
    { key: 'invoiceNumber',  label: 'Invoice #' },
    { key: 'taxableAmount',  label: 'Taxable', render: r => fmt(r.taxableAmount) },
    { key: 'gstAmount',      label: 'GST', render: r => fmt(r.gstAmount) },
    { key: 'totalAmount',    label: 'Total', render: r => <span className="font-semibold">{fmt(r.totalAmount)}</span> },
    { key: 'gstCategory',    label: 'Category' },
  ];

  const receiptCols = [
    { key: 'registerNumber', label: '#', render: r => <span className="font-semibold" style={{ color: 'var(--accent)' }}>{r.registerNumber}</span> },
    { key: 'receiptDate',    label: 'Date', render: r => fmtDate(r.receiptDate) },
    { key: 'customerName',   label: 'Customer' },
    { key: 'receiptNumber',  label: 'Receipt #' },
    { key: 'receiptMode',    label: 'Mode' },
    { key: 'amount',         label: 'Amount', render: r => <span className="font-semibold">{fmt(r.amount)}</span> },
    { key: 'bankName',       label: 'Bank', render: r => r.bankName || '-' },
  ];

  const agingChartData = data.slice(0, 6).map(d => ({ name: fmtDate(d.asOfDate), total: d.total || 0 }));

  const bucketPieData = data.length > 0 ? [
    { name: 'Current',  value: data[0]?.current    || 0 },
    { name: '1-30d',    value: data[0]?.days1_30   || 0 },
    { name: '31-60d',   value: data[0]?.days31_60  || 0 },
    { name: '61-90d',   value: data[0]?.days61_90  || 0 },
    { name: '91-120d',  value: data[0]?.days91_120 || 0 },
    { name: '180+d',    value: data[0]?.days180Plus|| 0 },
  ].filter(d => d.value > 0) : [];

  const colMap = { aging: agingCols, sales: salesCols, receipt: receiptCols };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>AR Reports</h1>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-4)' }}>Aging snapshots, sales register, receipt register</p>
      </div>

      <div className="flex gap-2">
        {[['aging','Aging History'],['sales','Sales Register'],['receipt','Receipt Register']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 text-[12.5px] font-medium rounded-lg"
            style={{ background: tab === t ? 'var(--accent)' : 'var(--bg)', color: tab === t ? '#fff' : 'var(--text-3)', border: '1px solid var(--border)' }}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'aging' && !loading && !error && data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Total Receivables Over Time">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={agingChartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-4)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-4)' }} />
                <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
                <Bar dataKey="total" fill="var(--accent)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          {bucketPieData.length > 0 && (
            <ChartCard title="Latest Aging Distribution">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={bucketPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {bucketPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : data.length === 0 ? <EmptyState message="No data available" /> : (
        <>
          <DataTable columns={colMap[tab]} data={data} />
          <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
        </>
      )}
    </div>
  );
}

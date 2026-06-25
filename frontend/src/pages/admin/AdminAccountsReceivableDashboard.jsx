import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MetricCard from '../../components/shared/MetricCard';
import ChartCard from '../../components/shared/ChartCard';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchARDashboard, fetchARAgingSummary, fetchTopCustomers } from '../../services/accountsReceivableAPI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminAccountsReceivableDashboard() {
  const navigate = useNavigate();
  const [dash,    setDash]    = useState(null);
  const [aging,   setAging]   = useState(null);
  const [topCust, setTopCust] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    Promise.all([fetchARDashboard(), fetchARAgingSummary(), fetchTopCustomers(8)])
      .then(([d, a, t]) => {
        setDash(d.data.data);
        setAging(a.data.data);
        setTopCust(t.data.data || []);
      })
      .catch(() => setError('Failed to load AR dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const kpis = dash?.kpis || {};
  const agingChartData = aging ? [
    { name: 'Current',  amount: aging.current    || 0 },
    { name: '1-30d',    amount: aging.days1_30   || 0 },
    { name: '31-60d',   amount: aging.days31_60  || 0 },
    { name: '61-90d',   amount: aging.days61_90  || 0 },
    { name: '91-120d',  amount: aging.days91_120 || 0 },
    { name: '180+d',    amount: aging.days180Plus|| 0 },
  ] : [];

  const collectionChartData = (dash?.monthlyReceipts || []).map(r => ({
    name: `${r._id?.day}/${r._id?.month}`,
    amount: r.amount || 0,
  }));

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
          Accounts Receivable
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-4)' }}>
          Enterprise AR — Invoices · Receipts · Collections · Credit
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Outstanding"   value={fmt(kpis.totalOutstanding)}    onClick={() => navigate('/admin/accounts-receivable/invoices?status=approved')} />
        <MetricCard label="Collected This Month" value={fmt(kpis.collectedThisMonth)} onClick={() => navigate('/admin/accounts-receivable/receipts')} />
        <MetricCard label="Overdue Invoices"     value={kpis.overdueCount || 0}        onClick={() => navigate('/admin/accounts-receivable/invoices?status=overdue')} />
        <MetricCard label="DSO (Days)"           value={kpis.dso || 0} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Blocked Customers"  value={kpis.blockedCustomers || 0}  onClick={() => navigate('/admin/accounts-receivable/credit')} />
        <MetricCard label="Bad Debt Provision" value={fmt(kpis.badDebt)}           onClick={() => navigate('/admin/accounts-receivable/bad-debt')} />
        <MetricCard label="Draft Invoices"     value={kpis.draftInvoices || 0}     onClick={() => navigate('/admin/accounts-receivable/invoices?status=draft')} />
        <MetricCard label="Pending Approval"   value={kpis.pendingApproval || 0}   onClick={() => navigate('/admin/accounts-receivable/invoices')} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Receivable Aging">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agingChartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-4)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-4)' }} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
              <Bar dataKey="amount" fill="var(--accent)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Daily Collections (30 Days)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={collectionChartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-4)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-4)' }} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
              <Bar dataKey="amount" fill="#22c55e" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top customers + Recent */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Top Customers by Outstanding</p>
          {topCust.length === 0 ? (
            <p className="text-[12px]" style={{ color: 'var(--text-4)' }}>No outstanding receivables</p>
          ) : (
            <div className="space-y-2">
              {topCust.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-[12.5px]">
                  <span style={{ color: 'var(--text-2)' }}>{c.customerName || 'Unknown'}</span>
                  <span className="font-semibold" style={{ color: 'var(--accent)' }}>{fmt(c.totalOutstanding)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Recent Invoices</p>
          {(dash?.recentInvoices || []).length === 0 ? (
            <p className="text-[12px]" style={{ color: 'var(--text-4)' }}>No invoices yet</p>
          ) : (
            <div className="space-y-2">
              {(dash?.recentInvoices || []).slice(0, 5).map((inv) => (
                <div key={inv._id} className="flex items-center justify-between text-[12.5px]">
                  <div>
                    <span className="font-medium" style={{ color: 'var(--text)' }}>{inv.invoiceNumber}</span>
                    <span className="ml-2" style={{ color: 'var(--text-4)' }}>{inv.customerName}</span>
                  </div>
                  <span style={{ color: 'var(--text-2)' }}>{fmt(inv.totalAmount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

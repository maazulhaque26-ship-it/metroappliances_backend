import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import SectionHeader from '../../components/shared/SectionHeader';
import MetricCard    from '../../components/shared/MetricCard';
import ChartCard     from '../../components/shared/ChartCard';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import { fetchAPDashboard, fetchAPAgingSummary, fetchAPTopVendors } from '../../services/accountsPayableAPI';

const COLORS = ['#FF7A00','#D4AF37','#34d399','#60a5fa','#f472b6','#a78bfa'];
const fmt = v => `₹${(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})}`;

export default function AdminAccountsPayableDashboard() {
  const [dash,    setDash]   = useState(null);
  const [aging,   setAging]  = useState(null);
  const [topV,    setTopV]   = useState([]);
  const [loading, setLoad]   = useState(true);
  const [error,   setError]  = useState('');

  useEffect(() => {
    Promise.all([fetchAPDashboard(), fetchAPAgingSummary(), fetchAPTopVendors({ limit: 8 })])
      .then(([d, a, t]) => { setDash(d.data.data); setAging(a.data.data); setTopV(t.data.data || []); })
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoad(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const kpis = dash?.kpis || {};
  const agingData = aging ? [
    { name: 'Current',   value: aging.current    || 0 },
    { name: '1–30 days', value: aging.days1_30   || 0 },
    { name: '31–60',     value: aging.days31_60  || 0 },
    { name: '61–90',     value: aging.days61_90  || 0 },
    { name: '91–120',    value: aging.days91_120 || 0 },
    { name: '120+',      value: aging.days120Plus|| 0 },
  ] : [];
  const monthlyData = (dash?.monthlyPayments || []).map(m => ({ name: `${m._id.day}/${m._id.month}`, amount: m.amount }));

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Accounts Payable" subtitle="AP overview: bills, payments, aging & GST credit" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Bills"        value={kpis.totalBills       || 0} />
        <MetricCard label="Pending Approval"   value={kpis.pendingApproval  || 0} color="orange" />
        <MetricCard label="Overdue Bills"      value={kpis.overdueCount     || 0} color="red" />
        <MetricCard label="Total Outstanding"  value={fmt(kpis.totalOutstanding)} />
        <MetricCard label="Paid This Month"    value={fmt(kpis.paidThisMonth)} color="green" />
        <MetricCard label="Payments This Month"value={kpis.paymentsThisMonth|| 0} />
        <MetricCard label="Open Payment Runs"  value={kpis.openPaymentRuns  || 0} />
        <MetricCard label="Draft Bills"        value={kpis.draftBills       || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="AP Aging Summary">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agingData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {agingData.map((_, i) => <Cell key={i} fill={i === 0 ? '#34d399' : i < 3 ? '#FF7A00' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment Activity (30 Days)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="amount" fill="#FF7A00" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Top Vendors by Outstanding</h3>
          {topV.length === 0 ? <p className="text-sm text-gray-400">No outstanding payables</p> : (
            <div className="space-y-2">
              {topV.map((v, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b pb-2">
                  <span className="text-gray-600">{v.vendorName || '—'}</span>
                  <span className="font-semibold text-gray-800">{fmt(v.totalOutstanding)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Recent Bills</h3>
          {(dash?.recentBills || []).slice(0, 6).map((b, i) => (
            <div key={i} className="flex items-center justify-between text-sm border-b pb-2 mb-2">
              <div>
                <p className="font-medium text-gray-700">{b.billNumber}</p>
                <p className="text-xs text-gray-400">{b.vendorName}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status === 'overdue' ? 'bg-red-100 text-red-600' : b.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>{b.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

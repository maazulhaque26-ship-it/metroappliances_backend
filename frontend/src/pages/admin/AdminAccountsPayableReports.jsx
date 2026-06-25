import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import SectionHeader from '../../components/shared/SectionHeader';
import ChartCard     from '../../components/shared/ChartCard';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import { fetchAPAgingSummary, fetchGSTCreditSummary, fetchGSTInputCredits, fetchAgingSnapshots } from '../../services/accountsPayableAPI';

const fmt = v => `₹${(v||0).toLocaleString('en-IN')}`;
const COLORS = ['#FF7A00','#D4AF37','#34d399','#60a5fa','#f472b6','#a78bfa'];

export default function AdminAccountsPayableReports() {
  const [tab,       setTab]    = useState('aging');
  const [aging,     setAging]  = useState(null);
  const [gstSum,    setGSTSum] = useState([]);
  const [gstItems,  setGSTItems] = useState([]);
  const [snapshots, setSnaps]  = useState([]);
  const [loading,   setLoad]   = useState(true);
  const [error,     setError]  = useState('');

  useEffect(() => {
    Promise.all([fetchAPAgingSummary(), fetchGSTCreditSummary(), fetchGSTInputCredits({ limit: 50 }), fetchAgingSnapshots({ limit: 10 })])
      .then(([a, g, gi, sn]) => {
        setAging(a.data.data);
        setGSTSum(g.data.data || []);
        setGSTItems(gi.data.data || []);
        setSnaps(sn.data.data || []);
      })
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoad(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const agingBuckets = aging ? [
    { name: 'Current',   value: aging.current    || 0 },
    { name: '1-30',      value: aging.days1_30   || 0 },
    { name: '31-60',     value: aging.days31_60  || 0 },
    { name: '61-90',     value: aging.days61_90  || 0 },
    { name: '91-120',    value: aging.days91_120 || 0 },
    { name: '120+',      value: aging.days120Plus|| 0 },
  ] : [];

  const TABS = ['aging', 'gst', 'snapshots'];

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="AP Reports" subtitle="Aging analysis, GST input credit, and snapshots" />

      <div className="flex gap-2 border-b pb-2">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-t-lg text-sm font-medium capitalize ${tab === t ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{t === 'gst' ? 'GST Input Credit' : t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'aging' && (
        <>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {agingBuckets.map((b, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-3 text-center">
                <p className="text-xs text-gray-500">{b.name}</p>
                <p className="text-base font-bold text-gray-800 mt-1">{fmt(b.value)}</p>
              </div>
            ))}
          </div>
          <ChartCard title="AP Aging Distribution">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={agingBuckets}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {agingBuckets.map((_, i) => <Cell key={i} fill={['#34d399','#FF7A00','#f59e0b','#ef4444','#b91c1c','#7f1d1d'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}

      {tab === 'gst' && (
        <>
          <div className="grid grid-cols-2 gap-6">
            <ChartCard title="GST Credit by Category">
              {gstSum.length === 0 ? <EmptyState title="No GST credit data" /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={gstSum} dataKey="eligibleCredit" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                      {gstSum.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => fmt(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 mb-3">GST Category Summary</h3>
              {gstSum.length === 0 ? <EmptyState title="No data" /> : (
                <table className="w-full text-sm">
                  <thead><tr className="text-gray-500 text-xs border-b"><th className="py-2 text-left">Category</th><th className="py-2 text-right">Total Tax</th><th className="py-2 text-right">Eligible</th><th className="py-2 text-right">Claimed</th></tr></thead>
                  <tbody>
                    {gstSum.map((g, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2 capitalize">{g._id?.replace(/_/g,' ')}</td>
                        <td className="py-2 text-right">{fmt(g.totalTax)}</td>
                        <td className="py-2 text-right text-green-600">{fmt(g.eligibleCredit)}</td>
                        <td className="py-2 text-right">{fmt(g.claimedCredit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b"><h3 className="font-semibold text-gray-700">GST Input Credit Register</h3></div>
            {gstItems.length === 0 ? <EmptyState title="No GST input credits" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="px-4 py-2 text-left">Credit #</th>
                    <th className="px-4 py-2 text-left">Vendor</th>
                    <th className="px-4 py-2 text-left">Bill Date</th>
                    <th className="px-4 py-2 text-right">IGST</th>
                    <th className="px-4 py-2 text-right">CGST</th>
                    <th className="px-4 py-2 text-right">SGST</th>
                    <th className="px-4 py-2 text-right">Eligible</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr></thead>
                  <tbody>
                    {gstItems.map((g, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs">{g.creditNumber}</td>
                        <td className="px-4 py-2">{g.vendorName}</td>
                        <td className="px-4 py-2">{g.billDate ? new Date(g.billDate).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-2 text-right">{fmt(g.igstAmount)}</td>
                        <td className="px-4 py-2 text-right">{fmt(g.cgstAmount)}</td>
                        <td className="px-4 py-2 text-right">{fmt(g.sgstAmount)}</td>
                        <td className="px-4 py-2 text-right font-semibold text-green-700">{fmt(g.eligibleCredit)}</td>
                        <td className="px-4 py-2 text-xs capitalize">{g.reconciliationStatus?.replace(/_/g,' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'snapshots' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b"><h3 className="font-semibold text-gray-700">Aging Snapshots</h3></div>
          {snapshots.length === 0 ? <EmptyState title="No snapshots saved yet" subtitle="Use the Aging Report page to save snapshots" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-gray-500 text-xs">
                  <th className="px-4 py-2 text-left">Vendor</th>
                  <th className="px-4 py-2 text-left">As of Date</th>
                  <th className="px-4 py-2 text-right">Current</th>
                  <th className="px-4 py-2 text-right">1-30</th>
                  <th className="px-4 py-2 text-right">31-60</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr></thead>
                <tbody>
                  {snapshots.map((s, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{s.vendorName}</td>
                      <td className="px-4 py-2">{s.asOfDate ? new Date(s.asOfDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-2 text-right">{fmt(s.aging?.current)}</td>
                      <td className="px-4 py-2 text-right text-orange-600">{fmt(s.aging?.days1_30)}</td>
                      <td className="px-4 py-2 text-right text-red-500">{fmt(s.aging?.days31_60)}</td>
                      <td className="px-4 py-2 text-right font-semibold">{fmt(s.aging?.total)}</td>
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

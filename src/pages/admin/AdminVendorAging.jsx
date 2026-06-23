import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import SectionHeader from '../../components/shared/SectionHeader';
import ChartCard     from '../../components/shared/ChartCard';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import { fetchAgingReport, saveAgingSnapshot } from '../../services/accountsPayableAPI';

const fmt = v => `₹${(v||0).toLocaleString('en-IN')}`;
const COLORS = ['#34d399','#FF7A00','#f59e0b','#ef4444','#b91c1c','#7f1d1d'];

export default function AdminVendorAging() {
  const [asOfDate, setAsOf]    = useState(new Date().toISOString().slice(0,10));
  const [data,     setData]    = useState(null);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');
  const [saving,   setSaving]  = useState(false);

  const load = async () => {
    setLoading(true); setError(''); setData(null);
    try { const r = await fetchAgingReport({ asOfDate }); setData(r.data.data); }
    catch(e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  };

  const handleSnapshot = async () => {
    setSaving(true);
    try { await saveAgingSnapshot({ asOfDate }); alert('Aging snapshot saved!'); }
    catch(e) { alert(e.response?.data?.message || e.message); }
    finally { setSaving(false); }
  };

  const summary = data?.summary || {};
  const buckets = [
    { name: 'Current',   value: summary.current    || 0 },
    { name: '1-30',      value: summary.days1_30   || 0 },
    { name: '31-60',     value: summary.days31_60  || 0 },
    { name: '61-90',     value: summary.days61_90  || 0 },
    { name: '91-120',    value: summary.days91_120 || 0 },
    { name: '120+',      value: summary.days120Plus|| 0 },
  ];

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="AP Aging Report" subtitle="Outstanding payables by age" />

      <div className="bg-white rounded-xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">As of Date</label>
          <input type="date" value={asOfDate} onChange={e => setAsOf(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={load} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">Generate</button>
        {data && <button onClick={handleSnapshot} disabled={saving} className="px-4 py-2 border border-orange-500 text-orange-500 rounded-lg text-sm hover:bg-orange-50 disabled:opacity-50">Save Snapshot</button>}
      </div>

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}

      {data && (
        <>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {buckets.map((b, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-3 text-center">
                <p className="text-xs text-gray-500">{b.name}</p>
                <p className="text-base font-bold text-gray-800 mt-1">{fmt(b.value)}</p>
              </div>
            ))}
          </div>

          <ChartCard title="Aging by Bucket">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={buckets}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {buckets.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Vendor Breakdown</h3>
              <span className="text-sm text-gray-500">Total: {fmt(summary.total)}</span>
            </div>
            {(!data.vendors || data.vendors.length === 0) ? <EmptyState title="No outstanding payables" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="px-4 py-2 text-left">Vendor</th>
                    <th className="px-4 py-2 text-right">Current</th>
                    <th className="px-4 py-2 text-right">1-30</th>
                    <th className="px-4 py-2 text-right">31-60</th>
                    <th className="px-4 py-2 text-right">61-90</th>
                    <th className="px-4 py-2 text-right">91-120</th>
                    <th className="px-4 py-2 text-right">120+</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr></thead>
                  <tbody>
                    {data.vendors.map((v, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{v.vendorName}</td>
                        <td className="px-4 py-2 text-right">{fmt(v.aging.current)}</td>
                        <td className="px-4 py-2 text-right text-orange-600">{fmt(v.aging.days1_30)}</td>
                        <td className="px-4 py-2 text-right text-orange-700">{fmt(v.aging.days31_60)}</td>
                        <td className="px-4 py-2 text-right text-red-500">{fmt(v.aging.days61_90)}</td>
                        <td className="px-4 py-2 text-right text-red-600">{fmt(v.aging.days91_120)}</td>
                        <td className="px-4 py-2 text-right text-red-700">{fmt(v.aging.days120Plus)}</td>
                        <td className="px-4 py-2 text-right font-semibold">{fmt(v.aging.total)}</td>
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

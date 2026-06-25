import React, { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MetricCard   from '../../components/shared/MetricCard';
import ChartCard    from '../../components/shared/ChartCard';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import { fetchFinanceDashboard, fetchAccountTypeBreakdown } from '../../services/financeAPI';

const COLORS = ['#FF7A00','#D4AF37','#3B82F6','#10B981','#8B5CF6','#EF4444'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminFinanceDashboard() {
  const [data,      setData]      = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [d, b] = await Promise.all([fetchFinanceDashboard(), fetchAccountTypeBreakdown()]);
        setData(d.data.data);
        setBreakdown(b.data.data || []);
      } catch (e) { setError(e.response?.data?.message || e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { kpis, recentJournals = [], monthlyActivity = [] } = data || {};

  const monthlyChart = monthlyActivity.map(m => ({
    name:  MONTHS[(m._id?.month || 1) - 1],
    count: m.count,
    debit: Math.round(m.totalDebit / 1000),
  }));

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Finance Dashboard" subtitle="General Ledger overview" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Journals"  value={kpis?.totalJournals  || 0} />
        <MetricCard label="Posted Journals" value={kpis?.postedJournals || 0} color="text-green-600" />
        <MetricCard label="Draft Journals"  value={kpis?.draftJournals  || 0} color="text-yellow-600" />
        <MetricCard label="GL Accounts"     value={kpis?.activeAccounts || 0} color="text-blue-600" />
        <MetricCard label="Open Fiscal Yrs" value={kpis?.openFiscalYears || 0} />
        <MetricCard label="Total Vouchers"  value={kpis?.totalVouchers  || 0} />
        <MetricCard label="Total Accounts"  value={kpis?.totalAccounts  || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly Journal Activity">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyChart}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Journals" fill="#FF7A00" radius={[4,4,0,0]} />
              <Bar dataKey="debit"  name="Debit (K)" fill="#D4AF37" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Accounts by Type">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={breakdown} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label={({ _id, count }) => `${_id}: ${count}`}>
                {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-3">Recent Journal Entries</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-left">
              <th className="px-3 py-2">Journal No.</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Narration</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Debit</th>
            </tr></thead>
            <tbody>{recentJournals.map(j => (
              <tr key={j._id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs">{j.journalNumber}</td>
                <td className="px-3 py-2 capitalize">{j.journalType}</td>
                <td className="px-3 py-2 max-w-xs truncate">{j.narration}</td>
                <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${j.status === 'posted' ? 'bg-green-100 text-green-700' : j.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{j.status}</span></td>
                <td className="px-3 py-2 text-right font-medium">₹{Number(j.totalDebit || 0).toLocaleString('en-IN')}</td>
              </tr>
            ))}</tbody>
          </table>
          {!recentJournals.length && <p className="text-center text-gray-400 py-6">No journal entries yet</p>}
        </div>
      </div>
    </div>
  );
}

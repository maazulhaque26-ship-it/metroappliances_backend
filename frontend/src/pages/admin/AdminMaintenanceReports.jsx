import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import ChartCard    from '../../components/shared/ChartCard';
import MetricCard   from '../../components/shared/MetricCard';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import SectionHeader from '../../components/shared/SectionHeader';
import ExportButton from '../../components/shared/ExportButton';
import { fetchAssetReliability, fetchBreakdownAnalysis, fetchCostAnalysis } from '../../services/eamAPI';

const COLORS = ['#FF7A00','#D4AF37','#4CAF50','#2196F3','#9C27B0','#F44336'];
const PERIOD_OPTS = [30, 60, 90, 180, 365];

export default function AdminMaintenanceReports() {
  const [period,      setPeriod]      = useState(90);
  const [reliability, setReliability] = useState([]);
  const [brkdn,       setBrkdn]       = useState({ byMode:[], bySeverity:[], trend:[] });
  const [costs,       setCosts]       = useState({ byType:[], topAssets:[], trend:[] });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAssetReliability(period),
      fetchBreakdownAnalysis(period),
      fetchCostAnalysis(period),
    ]).then(([r, b, c]) => {
      setReliability(r.data.data || []);
      setBrkdn(b.data.data || { byMode:[], bySeverity:[], trend:[] });
      setCosts(c.data.data || { byType:[], topAssets:[], trend:[] });
    }).catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const totalCost = costs.byType.reduce((a,b)=>a+(b.totalCost||0),0);
  const totalBreakdowns = brkdn.byMode.reduce((a,b)=>a+(b.count||0),0);

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Maintenance Reports">
        <div className="flex items-center gap-3">
          <select value={period} onChange={e => setPeriod(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
            {PERIOD_OPTS.map(d => <option key={d} value={d}>Last {d} days</option>)}
          </select>
          <ExportButton data={reliability} filename="asset_reliability" />
        </div>
      </SectionHeader>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Breakdowns"   value={totalBreakdowns} color="red"    />
        <MetricCard label="Maintenance Cost"   value={`₹${totalCost.toLocaleString('en-IN')}`} />
        <MetricCard label="Most Costly Asset"  value={costs.topAssets?.[0]?.assetName || '—'} />
        <MetricCard label="Top Failure Mode"   value={brkdn.byMode?.[0]?._id?.replace(/_/g,' ') || '—'} />
      </div>

      {/* Breakdown trend */}
      <ChartCard title="Breakdown Trend">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={brkdn.trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" tickFormatter={v => `${v?.year}-${String(v?.month).padStart(2,'0')}`} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#F44336" name="Breakdowns" />
            <Line type="monotone" dataKey="totalDowntime" stroke="#FF7A00" name="Downtime (hrs)" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Cost + Mode breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Maintenance Cost by Type">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={costs.byType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
              <Bar dataKey="totalCost" fill="#FF7A00" name="Cost" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Breakdowns by Failure Mode">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={brkdn.byMode} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={85} label={({ _id, count }) => `${_id}: ${count}`}>
                {brkdn.byMode.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top failing assets */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-3">Top Assets by Breakdown Frequency</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-gray-500">Asset</th>
                <th className="text-right py-2 px-3 text-gray-500">Breakdowns</th>
                <th className="text-right py-2 px-3 text-gray-500">Downtime (hrs)</th>
                <th className="text-right py-2 px-3 text-gray-500">Avg MTTR (hrs)</th>
                <th className="text-right py-2 px-3 text-gray-500">Repair Cost</th>
              </tr>
            </thead>
            <tbody>
              {reliability.map(r => (
                <tr key={r._id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{r.assetName} <span className="text-gray-400 text-xs">({r.assetNumber})</span></td>
                  <td className="py-2 px-3 text-right text-red-600 font-semibold">{r.breakdownCount}</td>
                  <td className="py-2 px-3 text-right">{r.totalDowntime?.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right">{r.avgMttr?.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right">₹{(r.totalRepairCost||0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {reliability.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No breakdown data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

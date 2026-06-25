import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartCard    from '../../components/shared/ChartCard';
import MetricCard   from '../../components/shared/MetricCard';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import SectionHeader from '../../components/shared/SectionHeader';
import { fetchMaintenanceTrend, fetchEAMDashboard, fetchCostAnalysis } from '../../services/eamAPI';

const PERIOD_OPTS = [30, 60, 90, 180];

export default function AdminMaintenanceAnalytics() {
  const [period,  setPeriod]  = useState(90);
  const [dash,    setDash]    = useState(null);
  const [trend,   setTrend]   = useState([]);
  const [costs,   setCosts]   = useState({ trend: [] });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchEAMDashboard(),
      fetchMaintenanceTrend(period),
      fetchCostAnalysis(period),
    ]).then(([d, t, c]) => {
      setDash(d.data.data);
      const raw = t.data.data || [];
      const grouped = {};
      raw.forEach(r => {
        const key = `${r._id.year}-${String(r._id.month).padStart(2,'0')}`;
        if (!grouped[key]) grouped[key] = { month: key, preventive:0, corrective:0, predictive:0, emergency:0 };
        grouped[key][r._id.maintenanceType] = r.count;
      });
      setTrend(Object.values(grouped));
      setCosts(c.data.data || { trend: [] });
    }).catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { summary, pmComplianceRate, mttr } = dash;

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Maintenance Analytics">
        <select value={period} onChange={e => setPeriod(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
          {PERIOD_OPTS.map(d => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      </SectionHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="PM Compliance"      value={`${pmComplianceRate}%`}           color={pmComplianceRate >= 80 ? 'green' : 'orange'} />
        <MetricCard label="Avg MTTR"           value={`${mttr.avgMttrHours}h`}          />
        <MetricCard label="Total Downtime"     value={`${mttr.totalDowntimeHours}h`}    color="orange" />
        <MetricCard label="Upcoming (7d)"      value={summary.upcomingSchedules}         />
      </div>

      {/* Work order type trend */}
      <ChartCard title="Work Orders by Type (Monthly)">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="preventive"  fill="#4CAF50" name="Preventive" stackId="a" />
            <Bar dataKey="corrective"  fill="#F44336" name="Corrective" stackId="a" />
            <Bar dataKey="predictive"  fill="#2196F3" name="Predictive" stackId="a" />
            <Bar dataKey="emergency"   fill="#FF1744" name="Emergency"  stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Cost trend */}
      <ChartCard title="Maintenance Cost Trend">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={costs.trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" tickFormatter={v => `${v?.year}-${String(v?.month).padStart(2,'0')}`} />
            <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
            <Line type="monotone" dataKey="laborCost"    stroke="#2196F3" name="Labor"    strokeWidth={2} />
            <Line type="monotone" dataKey="materialCost" stroke="#FF9800" name="Material" strokeWidth={2} />
            <Line type="monotone" dataKey="totalCost"    stroke="#FF7A00" name="Total"    strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Work order status summary */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Work Order Status Summary</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {(dash.workOrdersByStatus || []).map(w => (
            <div key={w._id} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{w.count}</p>
              <p className="text-xs text-gray-500 capitalize mt-1">{w._id?.replace(/_/g,' ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

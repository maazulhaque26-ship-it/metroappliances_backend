import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import MetricCard   from '../../components/shared/MetricCard';
import ChartCard    from '../../components/shared/ChartCard';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import StatusBadge  from '../../components/shared/StatusBadge';
import { fetchEAMDashboard, fetchMaintenanceTrend, fetchBreakdownAnalysis } from '../../services/eamAPI';

const COLORS = ['#FF7A00','#D4AF37','#4CAF50','#2196F3','#9C27B0','#F44336'];

export default function AdminEAMDashboard() {
  const [data,  setData]  = useState(null);
  const [trend, setTrend] = useState([]);
  const [brkdn, setBrkdn] = useState({ byMode: [], trend: [] });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [d, t, b] = await Promise.all([
          fetchEAMDashboard(),
          fetchMaintenanceTrend(90),
          fetchBreakdownAnalysis(90),
        ]);
        setData(d.data.data);
        const raw = t.data.data || [];
        const grouped = {};
        raw.forEach(r => {
          const key = `${r._id.year}-${String(r._id.month).padStart(2,'0')}`;
          if (!grouped[key]) grouped[key] = { month: key };
          grouped[key][r._id.maintenanceType] = r.count;
        });
        setTrend(Object.values(grouped).slice(-6));
        setBrkdn(b.data.data || { byMode: [], trend: [] });
      } catch (e) {
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { summary, assetsByStatus, workOrdersByStatus, pmComplianceRate, mttr, maintenanceCost30d, recentWorkOrders } = data;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">EAM / CMMS Dashboard</h1>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard label="Total Assets"       value={summary.totalAssets}        />
        <MetricCard label="Operational"        value={summary.activeAssets}       color="green" />
        <MetricCard label="In Breakdown"       value={summary.assetsInBreakdown}  color="red"   />
        <MetricCard label="Open Work Orders"   value={summary.openWorkOrders}     color="orange"/>
        <MetricCard label="Overdue Schedules"  value={summary.overdueSchedules}   color="red"   />
        <MetricCard label="Critical Alerts"    value={summary.criticalAlerts}     color="red"   />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="PM Compliance"      value={`${pmComplianceRate}%`}     color="green" />
        <MetricCard label="Avg MTTR (hrs)"     value={mttr.avgMttrHours}          />
        <MetricCard label="Downtime (hrs/30d)" value={mttr.totalDowntimeHours}    color="orange"/>
        <MetricCard label="Maint. Cost (30d)"  value={`₹${(maintenanceCost30d||0).toLocaleString('en-IN')}`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Assets by Status" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={assetsByStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, count }) => `${_id}: ${count}`}>
                {assetsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Maintenance Trend (90 days)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="preventive"  fill="#4CAF50" name="Preventive" />
              <Bar dataKey="corrective"  fill="#F44336" name="Corrective" />
              <Bar dataKey="predictive"  fill="#2196F3" name="Predictive" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Breakdown by failure mode */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Breakdowns by Failure Mode">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={brkdn.byMode} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="_id" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#FF7A00" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Recent Work Orders</h3>
          <div className="space-y-2">
            {(recentWorkOrders || []).map(wo => (
              <div key={wo._id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{wo.title}</p>
                  <p className="text-xs text-gray-500">{wo.workOrderNumber} · {wo.asset?.name}</p>
                </div>
                <StatusBadge status={wo.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

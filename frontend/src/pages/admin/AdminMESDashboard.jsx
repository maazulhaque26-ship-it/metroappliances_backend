import React, { useEffect, useState } from 'react';
import { FiActivity, FiAlertTriangle, FiCheckCircle, FiClock, FiTool, FiUsers } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import MetricCard   from '../../components/shared/MetricCard';
import ChartCard    from '../../components/shared/ChartCard';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import StatusBadge  from '../../components/shared/StatusBadge';
import { getMESDashboard, getProductionTrend, getOEETrend } from '../../services/mesAPI';

export default function AdminMESDashboard() {
  const [data,  setData]  = useState(null);
  const [trend, setTrend] = useState([]);
  const [oee,   setOee]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([getMESDashboard(), getProductionTrend({ days: 14 }), getOEETrend({ days: 14 })])
      .then(([d, t, o]) => { setData(d.data.data); setTrend(t.data.data || []); setOee(o.data.data || []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const { workOrders = {}, oee: oeeKpi = {}, quality = {}, downtime = {}, maintenance = {}, tools = {} } = data || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>MES Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Active Work Orders" value={workOrders.active ?? 0} icon={<FiActivity />} color="#FF7A00" />
        <MetricCard title="Completed Today"    value={workOrders.completedToday ?? 0} icon={<FiCheckCircle />} color="#10B981" />
        <MetricCard title="Overdue"            value={workOrders.overdue ?? 0} icon={<FiAlertTriangle />} color="#EF4444" />
        <MetricCard title="OEE (7-day avg)"    value={`${oeeKpi.avgOEE ?? 0}%`} icon={<FiActivity />} color="#D4AF37" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Open Downtimes"     value={downtime.openDowntimes ?? 0} icon={<FiAlertTriangle />} color="#EF4444" />
        <MetricCard title="Pending Inspections"value={quality.pendingInspections ?? 0} icon={<FiCheckCircle />} color="#6366F1" />
        <MetricCard title="Critical Defects"   value={quality.criticalDefects ?? 0} icon={<FiAlertTriangle />} color="#EF4444" />
        <MetricCard title="Available Tools"    value={tools.available ?? 0} icon={<FiTool />} color="#10B981" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Production (14 days)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="created" name="Created" fill="#FF7A00" />
              <Bar dataKey="completed" name="Completed" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="OEE Trend (14 days)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={oee} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="avgOEE" name="OEE%" stroke="#D4AF37" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="avgAvailability" name="Avail%" stroke="#10B981" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="avgPerformance"  name="Perf%"  stroke="#FF7A00" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

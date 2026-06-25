import React, { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MetricCard   from '../../components/shared/MetricCard';
import ChartCard    from '../../components/shared/ChartCard';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import { getQualityTrend, getMESDashboard } from '../../services/mesAPI';

const COLORS = ['#10B981','#EF4444','#F59E0B','#6366F1','#FF7A00'];

export default function AdminQualityDashboard() {
  const [trend, setTrend]   = useState({});
  const [kpi,   setKpi]     = useState({});
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([getQualityTrend({ days: 30 }), getMESDashboard()])
      .then(([t, d]) => { setTrend(t.data.data || {}); setKpi(d.data.data?.quality || {}); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const inspectionPasses = (trend.inspectionTrend || []).reduce((s, r) => s + (r.pass || 0), 0);
  const inspectionFails  = (trend.inspectionTrend || []).reduce((s, r) => s + (r.fail  || 0), 0);
  const passRate = inspectionPasses + inspectionFails > 0
    ? Math.round((inspectionPasses / (inspectionPasses + inspectionFails)) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Quality Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Pass Rate (30d)"        value={`${passRate}%`}               color="#10B981" />
        <MetricCard title="Total Inspections"      value={inspectionPasses + inspectionFails} color="#6366F1" />
        <MetricCard title="Pending Inspections"    value={kpi.pendingInspections ?? 0}  color="#F59E0B" />
        <MetricCard title="Critical Defects (open)"value={kpi.criticalDefects ?? 0}     color="#EF4444" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Inspection Trend (30 days)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trend.inspectionTrend || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="pass" name="Pass" fill="#10B981" stackId="a" />
              <Bar dataKey="fail" name="Fail" fill="#EF4444" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Defects by Category">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={trend.defectsByCategory || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label={e => e._id}>
                {(trend.defectsByCategory || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import MetricCard from '../../components/shared/MetricCard';
import ChartCard from '../../components/shared/ChartCard';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { getQMSDashboard, getQMSInspectionTrend, getQMSNCRAnalysis } from '../../services/qmsAPI';

const COLORS = ['#FF7A00', '#D4AF37', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function AdminQMSDashboard() {
  const [dash, setDash] = useState(null);
  const [trend, setTrend] = useState([]);
  const [ncrData, setNcrData] = useState({ byCategory: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    Promise.all([getQMSDashboard(), getQMSInspectionTrend({ days: 30 }), getQMSNCRAnalysis({ days: 30 })])
      .then(([d, t, n]) => {
        setDash(d.data.data);
        setTrend(t.data.data);
        setNcrData(n.data.data);
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (err) return <ErrorState message={err} />;

  const { inspection, capa, nonConformance, audits, calibration, alerts, documents } = dash;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">QMS Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Inspection Pass Rate" value={`${inspection.passRate}%`} sub={`${inspection.totalLots} lots`} color="green" />
        <MetricCard label="Open CAPAs" value={capa.openCAPAs} sub={`${capa.overdueCAPAs} overdue`} color="orange" />
        <MetricCard label="Open NCRs" value={nonConformance.openNCRs} sub={`${nonConformance.criticalNCRs} critical`} color="red" />
        <MetricCard label="Active Alerts" value={alerts.openAlerts} sub={`${alerts.criticalAlerts} critical`} color="yellow" />
        <MetricCard label="Scheduled Audits" value={audits.scheduledAudits} sub={`${audits.openAudits} in progress`} color="blue" />
        <MetricCard label="Calibrated Gauges" value={calibration.calibratedGauges} sub={`${calibration.overdueGauges} overdue`} color="purple" />
        <MetricCard label="Active Documents" value={documents.activeDocs} color="teal" />
        <MetricCard label="In-Progress Lots" value={inspection.inProgressLots} color="gray" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Inspection Trend (30 days)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="passed" fill="#10b981" name="Passed" />
              <Bar dataKey="failed" fill="#ef4444" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="NCR by Category">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={ncrData.byCategory || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label>
                {(ncrData.byCategory || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

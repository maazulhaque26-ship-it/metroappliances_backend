import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import MetricCard from '../../components/shared/MetricCard';
import ChartCard from '../../components/shared/ChartCard';
import DataTable from '../../components/shared/DataTable';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import StatusBadge from '../../components/shared/StatusBadge';
import { getQMSCalibrationSummary } from '../../services/qmsAPI';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
const STATUS_COLORS = { calibrated: 'green', due: 'yellow', overdue: 'red', not_required: 'gray' };

export default function AdminCalibrationDashboard() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]     = useState(null);

  useEffect(() => {
    getQMSCalibrationSummary()
      .then(r => setData(r.data.data))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (err) return <ErrorState message={err} />;

  const { byStatus, byType, dueThisMonth, recentCalibrations } = data;
  const totalGauges = byStatus.reduce((s, x) => s + x.count, 0);
  const calibrated  = byStatus.find(x => x._id === 'calibrated')?.count || 0;
  const overdue     = byStatus.find(x => x._id === 'overdue')?.count || 0;

  const columns = [
    { header: 'Record #', accessor: 'recordNumber' },
    { header: 'Gauge', render: r => r.gauge?.name || r.gaugeName },
    { header: 'Date', render: r => new Date(r.calibrationDate).toLocaleDateString() },
    { header: 'Next Due', render: r => r.nextCalibrationDate ? new Date(r.nextCalibrationDate).toLocaleDateString() : '—' },
    { header: 'Method', accessor: 'calibrationMethod' },
    { header: 'Result', render: r => <StatusBadge status={r.overallResult} color={{ pass: 'green', fail: 'red', conditional: 'yellow' }[r.overallResult]} /> },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Calibration Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Gauges" value={totalGauges} color="blue" />
        <MetricCard label="Calibrated" value={calibrated} color="green" />
        <MetricCard label="Overdue" value={overdue} color="red" />
        <MetricCard label="Due This Month" value={dueThisMonth} color="yellow" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Calibration Status">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label>
                {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Gauges by Type">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="_id" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#FF7A00" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <h2 className="text-lg font-semibold text-gray-700">Recent Calibrations</h2>
      <DataTable columns={columns} data={recentCalibrations} />
    </div>
  );
}

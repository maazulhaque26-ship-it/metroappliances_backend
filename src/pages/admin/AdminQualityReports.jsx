import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import ChartCard from '../../components/shared/ChartCard';
import MetricCard from '../../components/shared/MetricCard';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { getQMSCAPATrend, getQMSNCRAnalysis, getQMSAuditSummary } from '../../services/qmsAPI';

const COLORS = ['#FF7A00', '#D4AF37', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];
const PERIODS = [{ label: '30 Days', value: 30 }, { label: '90 Days', value: 90 }, { label: '180 Days', value: 180 }];

export default function AdminQualityReports() {
  const [period, setPeriod] = useState(90);
  const [capa, setCapa]   = useState(null);
  const [ncr, setNcr]     = useState(null);
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]     = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getQMSCAPATrend({ days: period }),
      getQMSNCRAnalysis({ days: period }),
      getQMSAuditSummary(),
    ])
      .then(([c, n, a]) => { setCapa(c.data.data); setNcr(n.data.data); setAudit(a.data.data); })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <LoadingState />;
  if (err) return <ErrorState message={err} />;

  const totalCapas = capa.byType.reduce((s, x) => s + x.count, 0);
  const totalNCRs  = ncr.byType.reduce((s, x) => s + x.count, 0);
  const totalFindings = audit.findingsByType.reduce((s, x) => s + x.count, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Quality Reports</h1>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border ${period === p.value ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-300'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total CAPAs" value={totalCapas} color="orange" />
        <MetricCard label="Total NCRs" value={totalNCRs} color="red" />
        <MetricCard label="Audit Findings" value={totalFindings} color="blue" />
        <MetricCard label="Audits Conducted" value={audit.byType.reduce((s, x) => s + x.count, 0)} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="CAPA Trend">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={capa.openTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Line dataKey="count" stroke="#FF7A00" strokeWidth={2} dot={false} name="CAPAs" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="NCR by Type">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ncr.byType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="CAPA by Severity">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={capa.bySeverity} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label>
                {capa.bySeverity.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Audit Findings by Type">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={audit.findingsByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" name="Findings" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

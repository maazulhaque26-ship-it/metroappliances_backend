import React, { useEffect, useState } from 'react';
import MetricCard from '../../components/shared/MetricCard';
import ChartCard from '../../components/shared/ChartCard';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import EmptyState from '../../components/shared/EmptyState';
import { fetchAgingReport, saveAgingSnapshot } from '../../services/accountsReceivableAPI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminCustomerAging() {
  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');

  const load = () => {
    setLoading(true); setError('');
    fetchAgingReport().then(r => setReport(r.data.data)).catch(() => setError('Failed to load aging report')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSnapshot = async () => {
    setSaving(true); setMsg('');
    try { await saveAgingSnapshot({}); setMsg('Snapshot saved'); }
    catch { setMsg('Snapshot failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const summary = report?.summary || {};
  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const buckets = [
    { label: 'Current',   key: 'current',     value: summary.current    || 0 },
    { label: '1-30 Days', key: 'days1_30',     value: summary.days1_30   || 0 },
    { label: '31-60',     key: 'days31_60',    value: summary.days31_60  || 0 },
    { label: '61-90',     key: 'days61_90',    value: summary.days61_90  || 0 },
    { label: '91-120',    key: 'days91_120',   value: summary.days91_120 || 0 },
    { label: '180+',      key: 'days180Plus',  value: summary.days180Plus|| 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Customer Aging</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-4)' }}>As of {report?.asOfDate ? new Date(report.asOfDate).toLocaleDateString('en-IN') : 'Today'}</p>
        </div>
        <div className="flex gap-3 items-center">
          {msg && <span className="text-[12px]" style={{ color: 'var(--accent)' }}>{msg}</span>}
          <button onClick={handleSnapshot} disabled={saving} className="px-4 py-2 text-[12.5px] font-semibold rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}>
            {saving ? 'Saving…' : 'Save Snapshot'}
          </button>
        </div>
      </div>

      {/* Bucket cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        {buckets.map(b => (
          <MetricCard key={b.key} label={b.label} value={fmt(b.value)} />
        ))}
      </div>

      {/* Aging bar chart */}
      <ChartCard title="Aging Distribution">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={buckets} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-4)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-4)' }} />
            <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
            <Bar dataKey="value" fill="var(--accent)" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Customer breakdown */}
      {(report?.customers || []).length === 0 ? (
        <EmptyState message="No outstanding receivables" />
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-[12px]">
            <thead style={{ background: 'var(--bg)' }}>
              <tr>{['Customer','Current','1-30d','31-60d','61-90d','91-120d','180+d','Total Overdue'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-3)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {(report?.customers || []).map((c, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text)' }}>{c.customerName}</td>
                  {['current','days1_30','days31_60','days61_90','days91_120','days180Plus'].map(k => (
                    <td key={k} className="px-4 py-2.5 text-right" style={{ color: c.aging[k] > 0 ? 'var(--accent)' : 'var(--text-4)' }}>{fmt(c.aging[k])}</td>
                  ))}
                  <td className="px-4 py-2.5 text-right font-semibold" style={{ color: '#ef4444' }}>{fmt(c.totalOverdue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

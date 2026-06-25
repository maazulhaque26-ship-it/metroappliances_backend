import React, { useEffect, useState } from 'react';
import { FiTrendingUp, FiStar, FiClock, FiCheckCircle, FiAlertTriangle, FiPackage } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import MetricCard from '../../components/shared/MetricCard';
import api from '../../services/api';

const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6'];

export default function AdminServiceReports() {
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = `from=${from}&to=${to}`;
    Promise.all([
      api.get(`/admin/service/reports/summary?${params}`),
      api.get(`/admin/service/reports/ftfr?${params}`),
      api.get(`/admin/service/reports/csat?${params}`),
      api.get(`/admin/service/reports/warranty-claims?${params}`),
      api.get(`/admin/service/reports/sla?${params}`),
      api.get(`/admin/service/reports/technician-performance?${params}`),
      api.get(`/admin/service/reports/parts-consumption?${params}`),
      api.get(`/admin/service/reports/amc-revenue?${params}`),
    ]).then(([summary, ftfr, csat, warranty, sla, techPerf, parts, amc]) => {
      setData({ summary: summary.data, ftfr: ftfr.data, csat: csat.data, warranty: warranty.data, sla: sla.data, techPerf: techPerf.data, parts: parts.data, amc: amc.data });
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Service Reports</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
          <span style={{ color: '#6B7280' }}>to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
          <button onClick={load} style={{ padding: '6px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Apply</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>Loading reports...</div>
      ) : (
        <>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
            <MetricCard title="Total Tickets" value={data.summary?.total || 0} icon={<FiTrendingUp />} accent="#3B82F6" />
            <MetricCard title="FTFR Rate" value={`${data.ftfr?.ftfrRate || 0}%`} icon={<FiCheckCircle />} accent="#10B981" />
            <MetricCard title="Avg Resolution" value={`${data.summary?.avgResolutionHours || 0}h`} icon={<FiClock />} accent="#8B5CF6" />
            <MetricCard title="CSAT" value={`${data.csat?.avgRating || 0}/5`} icon={<FiStar />} accent="#F59E0B" />
            <MetricCard title="SLA Compliance" value={`${data.sla?.complianceRate || 0}%`} icon={<FiCheckCircle />} accent="#10B981" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* By Priority */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Tickets by Priority</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.summary?.byPriority?.map(d => ({ name: d._id, count: d.count })) || []}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Warranty vs AMC vs Paid */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Service Type Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[
                    { name: 'Under Warranty', value: data.warranty?.warrantyJobs || 0 },
                    { name: 'Under AMC', value: data.warranty?.amcJobs || 0 },
                    { name: 'Paid Service', value: data.warranty?.paidJobs || 0 },
                  ]} dataKey="value" nameKey="name" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {[0,1,2].map(i => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Technician Performance */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB', marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Technician Performance</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    {['Name','Employee ID','Total','Completed','Completion %','Avg Rating','Avg Resolution'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.techPerf?.technicians || []).map(t => (
                    <tr key={t._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{t.name}</td>
                      <td style={{ padding: '10px 12px', color: '#6B7280' }}>{t.employeeId}</td>
                      <td style={{ padding: '10px 12px' }}>{t.total}</td>
                      <td style={{ padding: '10px 12px' }}>{t.completed}</td>
                      <td style={{ padding: '10px 12px', color: '#10B981', fontWeight: 600 }}>{t.completionRate?.toFixed(1)}%</td>
                      <td style={{ padding: '10px 12px' }}>{t.avgRating || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{t.avgResHours ? `${t.avgResHours}h` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.techPerf?.technicians?.length && <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>No data for selected period</div>}
            </div>
          </div>

          {/* Parts Consumption */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Top Spare Parts Consumed</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(data.parts?.topParts || []).slice(0, 10).map(p => ({ name: p.name, used: p.totalUsed, value: p.totalValue }))}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val, name) => name === 'value' ? `₹${val.toLocaleString('en-IN')}` : val} />
                <Bar dataKey="used" fill="#8B5CF6" name="Units Used" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

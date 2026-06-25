import React, { useEffect, useState } from 'react';
import { FiTrendingUp, FiDownload } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import api from '../../services/api';

export default function AdminInstallationReports() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo)   params.set('dateTo', dateTo);
    api.get(`/admin/installation/reports?${params}`)
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiTrendingUp size={22} color="#FF7A00" />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Installation Reports</h1>
        </div>
        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#F3F4F6', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>
          <FiDownload size={14} /> Export / Print
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif' }} />
        <span style={{ color: '#6B7280', fontSize: 13 }}>to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif' }} />
        <button onClick={load} style={{ padding: '9px 18px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>Apply</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading...</div>
      ) : !data ? null : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Status Breakdown */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Status Breakdown</h3>
            {(data.statusBreakdown || []).sort((a, b) => b.count - a.count).map(({ _id, count }) => (
              <div key={_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <StatusBadge status={_id} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{count}</span>
              </div>
            ))}
            {!data.statusBreakdown?.length && <div style={{ color: '#6B7280', fontSize: 13 }}>No data</div>}
          </div>

          {/* Category Breakdown */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Category Breakdown</h3>
            {(data.categoryBreakdown || []).sort((a, b) => b.count - a.count).map(({ _id, count }) => (
              <div key={_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: '#374151' }}>{_id || 'Unknown'}</span>
                <span style={{ fontWeight: 700, color: '#FF7A00' }}>{count}</span>
              </div>
            ))}
            {!data.categoryBreakdown?.length && <div style={{ color: '#6B7280', fontSize: 13 }}>No data</div>}
          </div>

          {/* Engineer Performance */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB', gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Engineer Performance</h3>
            {data.engineerPerformance?.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['Engineer', 'Completed', 'Avg Rating', 'Avg Duration (min)'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.engineerPerformance.map((e, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{e.name || 'Unknown'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#10B981', fontWeight: 700 }}>{e.completed}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#F59E0B', fontWeight: 700 }}>{e.avgRating || '—'}/5</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{e.avgDuration || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div style={{ color: '#6B7280', fontSize: 13 }}>No completed installations yet</div>}
          </div>
        </div>
      )}
    </div>
  );
}

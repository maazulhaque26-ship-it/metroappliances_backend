import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../services/api';
import { FiZap, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const RESULT_COLORS = {
  success:       '#10B981',
  not_found:     '#EF4444',
  wrong_bin:     '#F59E0B',
  wrong_sku:     '#F59E0B',
  duplicate:     '#6B7280',
  expired_batch: '#EF4444',
  wrong_batch:   '#F59E0B',
  wrong_serial:  '#F59E0B',
  over_pick:     '#EF4444',
  short_pick:    '#F59E0B',
  invalid_format:'#EF4444',
  error:         '#EF4444',
};

const ACTION_LABELS = {
  receive:'Receive', putaway:'Putaway', pick:'Pick', pack:'Pack',
  dispatch:'Dispatch', transfer:'Transfer', cycle_count:'Cycle Count',
  return:'Return', lookup:'Lookup', validate:'Validate',
};

function ResultBadge({ result }) {
  const color = RESULT_COLORS[result] || '#6B7280';
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
      padding: '2px 8px', borderRadius: '99px', background: color + '20', color }}>
      {result?.replace(/_/g, ' ')}
    </span>
  );
}

function MetricTile({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px 24px' }}>
      <p style={{ fontSize: '28px', fontWeight: 800, color: color || 'var(--text)' }}>{value}</p>
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{label}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>{sub}</p>}
    </div>
  );
}

export default function AdminScannerActivity() {
  const [logs, setLogs]       = useState([]);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', result: '', from: '', to: '' });
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 50 });
    if (filters.action) params.set('action', filters.action);
    if (filters.result) params.set('result', filters.result);
    if (filters.from)   params.set('from', filters.from);
    if (filters.to)     params.set('to', filters.to);
    try {
      const [logsRes, actRes] = await Promise.all([
        api.get(`/admin/scan-logs?${params}`),
        api.get('/admin/scan-logs/activity'),
      ]);
      setLogs(logsRes.data.data || []);
      setTotal(logsRes.data.total || logsRes.data.pagination?.total || 0);
      setActivity(actRes.data.data);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, filters]);

  const successCount = activity?.summary?.find(s => s._id === 'success')?.count ?? 0;
  const totalCount   = activity?.summary?.reduce((a, s) => a + s.count, 0) ?? 0;
  const accuracy     = totalCount ? ((successCount / totalCount) * 100).toFixed(1) : '—';

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1200px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Poppins', fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>Scanner Activity</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>Real-time scan logs — accuracy metrics, failure analysis, device breakdown</p>
          </div>
          <button onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontSize: '13px' }}>
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricTile label="Total Scans"    value={totalCount.toLocaleString()}   color="var(--text)" />
          <MetricTile label="Successful"     value={successCount.toLocaleString()} color="#10B981" sub={`${accuracy}% accuracy`} />
          <MetricTile label="Failures"       value={(totalCount - successCount).toLocaleString()} color="#EF4444" />
          <MetricTile label="Actions Logged" value={activity?.summary?.length ?? 0} color="#6366F1" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* By Result */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', marginBottom: '16px' }}>By Result</h3>
            {(activity?.summary || []).sort((a,b) => b.count - a.count).map(s => (
              <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: RESULT_COLORS[s._id] || '#6B7280', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-2)', textTransform: 'capitalize' }}>{s._id?.replace(/_/g, ' ')}</span>
                <div style={{ width: '60px', height: '4px', borderRadius: '99px', background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${(s.count / (totalCount || 1)) * 100}%`, height: '100%', background: RESULT_COLORS[s._id] || '#6B7280', borderRadius: '99px' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', width: '36px', textAlign: 'right' }}>{s.count}</span>
              </div>
            ))}
          </div>

          {/* By Action */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', marginBottom: '16px' }}>By Action</h3>
            {(activity?.byAction || []).sort((a,b) => b.count - a.count).map(a => (
              <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-2)' }}>{ACTION_LABELS[a._id] || a._id}</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{a.count}</span>
              </div>
            ))}
          </div>

          {/* Recent Failures */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', marginBottom: '16px' }}>Recent Failures</h3>
            {(activity?.recentFailures || logs.filter(l => l.result !== 'success').slice(0, 6)).map((l, i) => (
              <div key={l._id || i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text)', fontWeight: 600 }}>{l.rawValue?.slice(0,20)}</span>
                  <ResultBadge result={l.result} />
                </div>
                {l.errorMessage && <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '3px' }}>{l.errorMessage}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Filters + Log Table */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select value={filters.action} onChange={e => { setFilters(p => ({ ...p, action: e.target.value })); setPage(1); }}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '12px' }}>
              <option value="">All Actions</option>
              {Object.entries(ACTION_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={filters.result} onChange={e => { setFilters(p => ({ ...p, result: e.target.value })); setPage(1); }}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '12px' }}>
              <option value="">All Results</option>
              {Object.keys(RESULT_COLORS).map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
            </select>
            <input type="date" value={filters.from} onChange={e => { setFilters(p => ({ ...p, from: e.target.value })); setPage(1); }}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '12px' }} />
            <input type="date" value={filters.to} onChange={e => { setFilters(p => ({ ...p, to: e.target.value })); setPage(1); }}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '12px' }} />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Scanned At', 'Value', 'Action', 'Result', 'Operator', 'Device', 'Error'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)' }}>Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)' }}>No scan logs found</td></tr>
              ) : logs.map((log, i) => (
                <tr key={log._id || i} style={{ borderTop: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 14px', color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{log.scannedAt ? new Date(log.scannedAt).toLocaleString() : '—'}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text)' }}>{log.rawValue?.slice(0,22) || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-2)', textTransform: 'capitalize' }}>{ACTION_LABELS[log.action] || log.action || '—'}</td>
                  <td style={{ padding: '10px 14px' }}><ResultBadge result={log.result} /></td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-4)' }}>{log.operatorName || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-4)' }}>{log.deviceId?.slice(0,10) || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#EF4444', fontSize: '11px' }}>{log.errorMessage?.slice(0,40) || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {total > 50 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-4)' }}>
              <span>Page {page} · {total} total logs</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text)', fontSize: '12px' }}>←</button>
                <button onClick={() => setPage(p => p+1)} disabled={page * 50 >= total}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text)', fontSize: '12px' }}>→</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

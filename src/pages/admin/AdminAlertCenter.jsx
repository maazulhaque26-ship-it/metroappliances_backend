import { useState, useEffect, useCallback } from 'react';
import { FiAlertTriangle, FiCheck, FiX, FiEye } from 'react-icons/fi';
import api from '../../services/api';

const SEV_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6', info: '#6b7280' };
const STATUS_LABELS = { active: 'Active', acknowledged: 'Acknowledged', resolved: 'Resolved', dismissed: 'Dismissed' };

function AlertRow({ alert, onAck, onResolve, onDismiss }) {
  const sevC = SEV_COLOR[alert.severity] || '#999';
  return (
    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: sevC, display: 'inline-block', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{alert.title}</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{alert.message}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11,
          background: `${sevC}18`, color: sevC, fontWeight: 600, textTransform: 'capitalize' }}>{alert.severity}</span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: '#666', textTransform: 'capitalize' }}>
        {alert.type?.replace(/_/g, ' ')}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11,
          background: alert.status === 'active' ? '#fef2f2' : alert.status === 'acknowledged' ? '#fff7ed' : '#f0fdf4',
          color: alert.status === 'active' ? '#ef4444' : alert.status === 'acknowledged' ? '#f97316' : '#22c55e',
          fontWeight: 600, textTransform: 'capitalize' }}>{alert.status}</span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: '#999' }}>
        {new Date(alert.createdAt).toLocaleString()}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {alert.status === 'active' && (
            <button onClick={() => onAck(alert._id)} title="Acknowledge"
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>
              <FiEye size={13} color="#f97316" />
            </button>
          )}
          {(alert.status === 'active' || alert.status === 'acknowledged') && (
            <button onClick={() => onResolve(alert._id)} title="Resolve"
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>
              <FiCheck size={13} color="#22c55e" />
            </button>
          )}
          {alert.status !== 'dismissed' && alert.status !== 'resolved' && (
            <button onClick={() => onDismiss(alert._id)} title="Dismiss"
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>
              <FiX size={13} color="#6b7280" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function AdminAlertCenter() {
  const [alerts, setAlerts]     = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');
  const [sevFilter, setSevFilter]       = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');

  useEffect(() => {
    api.get('/admin/warehouses').then(r => {
      const whs = r.data.data || [];
      setWarehouses(whs);
      if (whs.length > 0) setSelectedWH(whs[0]._id);
    });
  }, []);

  const fetchAlerts = useCallback(async () => {
    if (!selectedWH) return;
    setLoading(true);
    const q = `warehouseId=${selectedWH}&page=${page}&limit=50${statusFilter ? `&status=${statusFilter}` : ''}${sevFilter ? `&severity=${sevFilter}` : ''}${typeFilter ? `&type=${typeFilter}` : ''}`;
    const [al, st] = await Promise.allSettled([
      api.get(`/admin/alerts?${q}`),
      api.get(`/admin/alerts/stats?warehouseId=${selectedWH}`),
    ]);
    if (al.status === 'fulfilled') { setAlerts(al.value.data.data || []); setTotal(al.value.data.total || 0); }
    if (st.status === 'fulfilled') setStats(st.value.data.data);
    setLoading(false);
  }, [selectedWH, page, statusFilter, sevFilter, typeFilter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const doAction = async (id, action) => {
    await api.put(`/admin/alerts/${id}/${action}`);
    fetchAlerts();
  };

  const ALERT_TYPES = ['temp_high','temp_low','humidity_high','humidity_low','battery_low',
    'device_offline','rfid_conflict','rfid_unknown','rfid_missing','bin_overflow',
    'low_stock','stock_mismatch','sensor_fault','door_open','motion_detected','power_failure','manual'];

  return (
    <div style={{ padding: '28px 32px', background: '#f8f9fc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiAlertTriangle color="#FF7A00" /> Alert Center
        </h1>
        <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13 }}>
          {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Active', value: stats.active, color: '#ef4444' },
            { label: 'Acknowledged', value: stats.acknowledged, color: '#f97316' },
            { label: 'Resolved', value: stats.resolved, color: '#22c55e' },
            { label: 'Today', value: stats.today, color: '#3b82f6' },
            { label: 'Total', value: stats.total, color: '#1a1a2e' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value ?? '—'}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {['', 'active', 'acknowledged', 'resolved', 'dismissed'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid #e0e0e0', cursor: 'pointer', fontSize: 13, fontWeight: statusFilter === s ? 600 : 400,
              background: statusFilter === s ? '#FF7A00' : '#fff', color: statusFilter === s ? '#fff' : '#333' }}>
            {s || 'All'}
          </button>
        ))}
        <select value={sevFilter} onChange={e => setSevFilter(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13, marginLeft: 'auto' }}>
          <option value="">All Severities</option>
          {Object.keys(SEV_COLOR).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13 }}>
          <option value="">All Types</option>
          {ALERT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>Loading alerts…</div> : (
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Alert', 'Severity', 'Type', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#999' }}>No alerts found</td></tr>
              ) : alerts.map(a => (
                <AlertRow key={a._id} alert={a}
                  onAck={id => doAction(id, 'acknowledge')}
                  onResolve={id => doAction(id, 'resolve')}
                  onDismiss={id => doAction(id, 'dismiss')} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 50 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>Prev</button>
          <span style={{ padding: '6px 12px', fontSize: 13, color: '#666' }}>Page {page} · {total} total</span>
          <button disabled={alerts.length < 50} onClick={() => setPage(p => p + 1)}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>Next</button>
        </div>
      )}
    </div>
  );
}

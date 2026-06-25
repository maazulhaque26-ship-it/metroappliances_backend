import { useState, useEffect } from 'react';
import { FiZap, FiRefreshCw } from 'react-icons/fi';
import api from '../../services/api';

const RULE_CONFIG = [
  {
    id: 'auto_low_stock_replen',
    name: 'Auto Replenishment on Low Stock',
    description: 'Automatically generate replenishment tasks when item stock falls below reorder point.',
    trigger: 'Stock ≤ Reorder Point',
    action: 'Create ReplenishmentTask (priority: high)',
    status: 'active',
    color: '#22c55e',
  },
  {
    id: 'auto_sensor_alert',
    name: 'Sensor Threshold Alerting',
    description: 'Raise alerts automatically when sensor readings exceed configured min/max thresholds.',
    trigger: 'SensorReading.value > threshold.max OR < threshold.min',
    action: 'Create Alert (temp_high / temp_low / humidity_high / humidity_low)',
    status: 'active',
    color: '#22c55e',
  },
  {
    id: 'auto_device_battery',
    name: 'Low Battery Alert',
    description: 'Alert when a warehouse device battery drops below 15%.',
    trigger: 'DeviceHealth.batteryLevel < 15',
    action: 'Create Alert (battery_low, severity: medium)',
    status: 'active',
    color: '#22c55e',
  },
  {
    id: 'auto_rfid_unknown',
    name: 'Unknown RFID Tag Detection',
    description: 'Alert when a bulk RFID scan detects tags not registered in the system.',
    trigger: 'RFIDScan.isUnknown = true',
    action: 'Create Alert (rfid_unknown, severity: medium)',
    status: 'active',
    color: '#22c55e',
  },
  {
    id: 'auto_voice_complete',
    name: 'Voice Picking Completion Tracking',
    description: 'Emit real-time socket events on voice picking session completion for live dashboard.',
    trigger: 'VoicePickingSession.status = completed',
    action: 'Emit voice:session_completed via Socket.IO',
    status: 'active',
    color: '#22c55e',
  },
  {
    id: 'auto_rfid_bulk_realtime',
    name: 'Real-Time RFID Scan Events',
    description: 'Broadcast all bulk RFID scan results to connected clients via Socket.IO.',
    trigger: 'POST /rfid/bulk-scan',
    action: 'Emit rfid:bulk_scan via Socket.IO',
    status: 'active',
    color: '#22c55e',
  },
];

function RuleCard({ rule }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: rule.color, flexShrink: 0, marginTop: 6 }} />
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{rule.name}</div>
        </div>
        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11,
          background: '#f0fdf4', color: '#22c55e', fontWeight: 600 }}>{rule.status}</span>
      </div>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 14px 18px', lineHeight: 1.6 }}>{rule.description}</p>
      <div style={{ marginLeft: 18 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
          <span style={{ fontSize: 11, background: '#fff7ed', color: '#f97316', padding: '2px 8px', borderRadius: 4, fontWeight: 600, flexShrink: 0 }}>TRIGGER</span>
          <span style={{ fontSize: 12, color: '#555', fontFamily: 'monospace' }}>{rule.trigger}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 11, background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: 4, fontWeight: 600, flexShrink: 0 }}>ACTION</span>
          <span style={{ fontSize: 12, color: '#555', fontFamily: 'monospace' }}>{rule.action}</span>
        </div>
      </div>
    </div>
  );
}

function LogRow({ log }) {
  return (
    <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
      <td style={{ padding: '10px 16px', fontSize: 12, color: '#999' }}>{new Date(log.createdAt).toLocaleString()}</td>
      <td style={{ padding: '10px 16px', fontSize: 12, textTransform: 'capitalize' }}>{log.action?.replace(/_/g, ' ')}</td>
      <td style={{ padding: '10px 16px', fontSize: 12 }}>{log.resourceType}</td>
      <td style={{ padding: '10px 16px', fontSize: 12, color: '#666' }}>{log.details?.description || log.userId || '—'}</td>
    </tr>
  );
}

export default function AdminAutomationRules() {
  const [logs, setLogs]         = useState([]);
  const [scanStats, setScanStats] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');

  useEffect(() => {
    api.get('/admin/warehouses').then(r => {
      const whs = r.data.data || [];
      setWarehouses(whs);
      if (whs.length > 0) setSelectedWH(whs[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedWH) return;
    setLoading(true);
    Promise.allSettled([
      api.get('/admin/audit-logs?limit=30&resourceType=inventory'),
      api.get('/admin/scan-logs/activity'),
    ]).then(([lg, sc]) => {
      if (lg.status === 'fulfilled') setLogs(lg.value.data.data || []);
      if (sc.status === 'fulfilled') setScanStats(sc.value.data.data);
    }).finally(() => setLoading(false));
  }, [selectedWH]);

  return (
    <div style={{ padding: '28px 32px', background: '#f8f9fc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiZap color="#FF7A00" /> Automation Rules
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13 }}>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <button onClick={() => setLoading(true)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>
            <FiRefreshCw size={14} />
          </button>
        </div>
      </div>

      <p style={{ fontSize: 14, color: '#666', margin: '0 0 28px', lineHeight: 1.6 }}>
        Automation rules run automatically as part of the IoT & Warehouse engine. All rules below are active
        and trigger in real-time on relevant events. Rule logic lives in the controller layer.
      </p>

      {/* Rules */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>Active Automation Rules ({RULE_CONFIG.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(440px,1fr))', gap: 16, marginBottom: 36 }}>
        {RULE_CONFIG.map(rule => <RuleCard key={rule.id} rule={rule} />)}
      </div>

      {/* Stats */}
      {scanStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Scans', value: scanStats.total },
            { label: 'Successful', value: scanStats.successful, color: '#22c55e' },
            { label: 'Failures', value: scanStats.failed, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color || '#1a1a2e' }}>{s.value ?? '—'}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Log */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>Recent Automation Events</h2>
      {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Loading…</div> : (
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Timestamp', 'Action', 'Resource Type', 'Details'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#999' }}>No events recorded</td></tr>
              ) : logs.map((l, i) => <LogRow key={l._id || i} log={l} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

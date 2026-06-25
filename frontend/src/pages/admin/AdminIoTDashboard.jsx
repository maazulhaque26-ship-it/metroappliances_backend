import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  FiWifi, FiAlertTriangle, FiCpu, FiThermometer,
  FiRefreshCw, FiBattery, FiRadio, FiPackage,
} from 'react-icons/fi';
import api from '../../services/api';

const SEV_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6', info: '#6b7280' };

function StatCard({ icon: Icon, label, value, sub, color = '#FF7A00' }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>{value ?? '—'}</div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function AlertRow({ alert }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: SEV_COLOR[alert.severity] || '#999', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{alert.title}</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 1 }}>{alert.message}</div>
      </div>
      <div style={{ fontSize: 11, color: '#999' }}>{new Date(alert.createdAt).toLocaleTimeString()}</div>
    </div>
  );
}

function DeviceDot({ d }) {
  const color = d.status === 'online' ? '#22c55e' : d.status === 'offline' ? '#ef4444' : '#f59e0b';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 12, color: '#333' }}>{d.name}</div>
      <div style={{ fontSize: 11, color: '#999' }}>{d.type?.replace(/_/g, ' ')}</div>
      {d.batteryLevel != null && <div style={{ fontSize: 11, color: d.batteryLevel < 20 ? '#ef4444' : '#999' }}>{d.batteryLevel}%</div>}
    </div>
  );
}

export default function AdminIoTDashboard() {
  const { userInfo } = useSelector(s => s.auth);
  const [data, setData]         = useState(null);
  const [devices, setDevices]   = useState([]);
  const [alerts, setAlerts]     = useState([]);
  const [rfidActivity, setRfidActivity] = useState([]);
  const [warehouses, setWarehouses]     = useState([]);
  const [selectedWH, setSelectedWH]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async (wId) => {
    if (!wId) return;
    setLoading(true);
    try {
      const [dash, dev, al, rfid] = await Promise.allSettled([
        api.get(`/admin/iot/dashboard?warehouseId=${wId}`),
        api.get(`/admin/iot/device-health?warehouseId=${wId}`),
        api.get(`/admin/iot/active-alerts?warehouseId=${wId}&limit=10`),
        api.get(`/admin/iot/rfid-activity?warehouseId=${wId}&limit=20`),
      ]);
      if (dash.status === 'fulfilled')  setData(dash.value.data.data);
      if (dev.status  === 'fulfilled')  setDevices(dev.value.data.data || []);
      if (al.status   === 'fulfilled')  setAlerts(al.value.data.data || []);
      if (rfid.status === 'fulfilled')  setRfidActivity(rfid.value.data.data || []);
      setLastUpdated(new Date());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    api.get('/admin/warehouses').then(r => {
      const whs = r.data.data || [];
      setWarehouses(whs);
      if (whs.length > 0) { setSelectedWH(whs[0]._id); fetchAll(whs[0]._id); }
    }).catch(() => setLoading(false));
  }, [fetchAll]);

  useEffect(() => {
    if (!selectedWH) return;
    fetchAll(selectedWH);
    const t = setInterval(() => fetchAll(selectedWH), 30_000);
    return () => clearInterval(t);
  }, [selectedWH, fetchAll]);

  const containerStyle = { padding: '28px 32px', background: '#f8f9fc', minHeight: '100vh' };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>IoT & Live Dashboard</h1>
          {lastUpdated && <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Last updated: {lastUpdated.toLocaleTimeString()}</div>}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }}>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <button onClick={() => fetchAll(selectedWH)} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              background: '#FF7A00', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>
            <FiRefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>Loading IoT data…</div>
      ) : (
        <>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard icon={FiRadio}       label="Active RFID Tags"    value={data?.rfid?.activeTags}       sub={`${data?.rfid?.scansLastHour ?? 0} scans/hr`} />
            <StatCard icon={FiCpu}         label="Devices Online"       value={`${data?.devices?.online ?? 0}/${data?.devices?.total ?? 0}`} sub={`${data?.devices?.lowBattery ?? 0} low battery`} color="#8b5cf6" />
            <StatCard icon={FiAlertTriangle} label="Active Alerts"     value={data?.alerts?.active}          sub={`${data?.alerts?.critical ?? 0} critical`} color="#ef4444" />
            <StatCard icon={FiThermometer} label="Sensor Faults"        value={data?.sensors?.fault ?? 0}    sub={`of ${data?.sensors?.total ?? 0} sensors`} color="#06b6d4" />
            <StatCard icon={FiPackage}     label="Replenishment Needed" value={data?.replenishment?.pending} sub="pending tasks" color="#10b981" />
            <StatCard icon={FiWifi}        label="Voice Sessions"        value={data?.voice?.activeSessions} sub="currently active" color="#f59e0b" />
          </div>

          {/* 3-column detail */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            {/* Alerts */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Active Alerts</h3>
              {alerts.length === 0 ? <div style={{ color: '#999', fontSize: 13 }}>No active alerts</div>
                : alerts.map((a, i) => <AlertRow key={a._id || i} alert={a} />)}
            </div>

            {/* Devices */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Device Health</h3>
              {devices.length === 0 ? <div style={{ color: '#999', fontSize: 13 }}>No devices registered</div>
                : devices.slice(0, 12).map((d, i) => <DeviceDot key={d._id || i} d={d} />)}
            </div>

            {/* RFID Activity */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>RFID Activity</h3>
              {rfidActivity.length === 0 ? <div style={{ color: '#999', fontSize: 13 }}>No recent scans</div>
                : rfidActivity.slice(0, 12).map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', color: '#1a1a2e' }}>{s.epc}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{s.eventType} · {new Date(s.scannedAt).toLocaleTimeString()}</div>
                    </div>
                    {s.isUnknown && <span style={{ fontSize: 10, background: '#fef3c7', color: '#d97706', borderRadius: 4, padding: '2px 6px' }}>UNKNOWN</span>}
                    {s.isDuplicate && <span style={{ fontSize: 10, background: '#f3f4f6', color: '#6b7280', borderRadius: 4, padding: '2px 6px' }}>DUP</span>}
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

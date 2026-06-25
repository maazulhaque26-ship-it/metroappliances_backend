import { useState, useEffect } from 'react';
import { FiCpu, FiPlus, FiBattery, FiWifi } from 'react-icons/fi';
import api from '../../services/api';

const STATUS_COLORS = {
  online: '#22c55e', offline: '#ef4444', charging: '#3b82f6',
  maintenance: '#f59e0b', decommissioned: '#6b7280', lost: '#dc2626',
};
const TYPES = ['barcode_scanner','rfid_reader','label_printer','mobile_computer',
  'forklift_terminal','sensor_hub','camera','voice_unit','tablet','desktop'];

function DeviceCard({ device, onHealth }) {
  const c = STATUS_COLORS[device.status] || '#999';
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{device.name}</div>
        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11,
          background: `${c}18`, color: c, fontWeight: 600 }}>{device.status}</span>
      </div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>ID: <span style={{ fontFamily: 'monospace' }}>{device.deviceId}</span></div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>{device.type?.replace(/_/g, ' ')} · {device.manufacturer || 'N/A'}</div>
      {device.batteryLevel != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <FiBattery size={13} color={device.batteryLevel < 20 ? '#ef4444' : '#22c55e'} />
          <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3 }}>
            <div style={{ height: '100%', borderRadius: 3, background: device.batteryLevel < 20 ? '#ef4444' : '#22c55e',
              width: `${device.batteryLevel}%` }} />
          </div>
          <span style={{ fontSize: 11, color: '#666' }}>{device.batteryLevel}%</span>
        </div>
      )}
      {device.signalStrength != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiWifi size={13} color="#3b82f6" />
          <span style={{ fontSize: 12, color: '#666' }}>{device.signalStrength}%</span>
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 11, color: '#999' }}>
        Last seen: {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
      </div>
    </div>
  );
}

export default function AdminWarehouseDevices() {
  const [devices, setDevices]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ deviceId: '', name: '', type: 'barcode_scanner', serialNumber: '', manufacturer: '' });

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
    const q = `warehouseId=${selectedWH}${typeFilter ? `&type=${typeFilter}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}`;
    Promise.allSettled([
      api.get(`/admin/devices?${q}&limit=100`),
      api.get(`/admin/devices/stats?warehouseId=${selectedWH}`),
    ]).then(([d, s]) => {
      if (d.status === 'fulfilled') setDevices(d.value.data.data || []);
      if (s.status === 'fulfilled') setStats(s.value.data.data);
    }).finally(() => setLoading(false));
  }, [selectedWH, typeFilter, statusFilter]);

  const handleAdd = async () => {
    await api.post('/admin/devices', { ...form, warehouseId: selectedWH });
    setShowAdd(false);
    setForm({ deviceId: '', name: '', type: 'barcode_scanner', serialNumber: '', manufacturer: '' });
    setLoading(true);
    const r = await api.get(`/admin/devices?warehouseId=${selectedWH}&limit=100`);
    setDevices(r.data.data || []);
    setLoading(false);
  };

  const cardStat = (label, value, color = '#1a1a2e') => (
    <div style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value ?? '—'}</div>
      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ padding: '28px 32px', background: '#f8f9fc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiCpu color="#FF7A00" /> Warehouse Devices
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13 }}>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              background: '#FF7A00', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            <FiPlus size={14} /> Add Device
          </button>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {cardStat('Total', stats.total)}
          {cardStat('Online', stats.online, '#22c55e')}
          {cardStat('Offline', stats.offline, '#ef4444')}
          {cardStat('Maintenance', stats.maintenance, '#f59e0b')}
          {cardStat('Low Battery', stats.lowBattery, '#dc2626')}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13 }}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13 }}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>Loading devices…</div> : (
        devices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>No devices registered for this warehouse.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {devices.map(d => <DeviceCard key={d._id} device={d} />)}
          </div>
        )
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Register Device</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            {[
              { label: 'Device ID', key: 'deviceId', placeholder: 'e.g. DEV-001' },
              { label: 'Name', key: 'name', placeholder: 'e.g. Handheld Scanner 1' },
              { label: 'Serial Number', key: 'serialNumber', placeholder: 'Optional' },
              { label: 'Manufacturer', key: 'manufacturer', placeholder: 'Optional' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 4 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 4 }}>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13 }}>
                {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAdd(false)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={!form.deviceId || !form.name}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: '#FF7A00', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

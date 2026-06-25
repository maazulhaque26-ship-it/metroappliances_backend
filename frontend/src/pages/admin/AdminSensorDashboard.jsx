import { useState, useEffect, useCallback } from 'react';
import { FiThermometer, FiRefreshCw, FiPlus } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../services/api';

const TYPE_ICONS = {
  temperature: '🌡️', humidity: '💧', weight: '⚖️', door: '🚪',
  motion: '🏃', power: '⚡', battery: '🔋', co2: '☁️', light: '💡', vibration: '📳',
};
const SEV_COLOR = { normal: '#22c55e', warning: '#f59e0b', critical: '#ef4444' };

function SensorCard({ sensor, onSelect, selected }) {
  const isSelected = selected?._id === sensor._id;
  const sevColor = sensor.lastReading?.isAnomaly ? SEV_COLOR.warning : SEV_COLOR.normal;
  return (
    <div onClick={() => onSelect(sensor)}
      style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: isSelected ? '0 0 0 2px #FF7A00' : '0 1px 4px rgba(0,0,0,0.08)',
        cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{TYPE_ICONS[sensor.type] || '📡'}</span>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10,
          background: `${sevColor}18`, color: sevColor, fontWeight: 600 }}>{sensor.status}</span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e', marginBottom: 4 }}>{sensor.name}</div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>{sensor.type} · {sensor.locationDesc || 'No location'}</div>
      {sensor.lastReading ? (
        <div style={{ fontSize: 26, fontWeight: 700, color: sensor.lastReading.isAnomaly ? '#ef4444' : '#1a1a2e' }}>
          {sensor.lastReading.value} <span style={{ fontSize: 14, color: '#666' }}>{sensor.unit}</span>
        </div>
      ) : (
        <div style={{ fontSize: 14, color: '#999' }}>No reading</div>
      )}
      {sensor.thresholds?.min !== undefined && (
        <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
          Range: {sensor.thresholds.min}–{sensor.thresholds.max}{sensor.unit}
        </div>
      )}
    </div>
  );
}

export default function AdminSensorDashboard() {
  const [sensors, setSensors]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [historyHours, setHistoryHours] = useState(24);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ sensorId: '', name: '', type: 'temperature', unit: '°C', locationDesc: '' });

  useEffect(() => {
    api.get('/admin/warehouses').then(r => {
      const whs = r.data.data || [];
      setWarehouses(whs);
      if (whs.length > 0) setSelectedWH(whs[0]._id);
    });
  }, []);

  const fetchSensors = useCallback(async () => {
    if (!selectedWH) return;
    setLoading(true);
    const q = `warehouseId=${selectedWH}${typeFilter ? `&type=${typeFilter}` : ''}&limit=100`;
    const [s, st] = await Promise.allSettled([
      api.get(`/admin/sensors?${q}`),
      api.get(`/admin/sensors/stats?warehouseId=${selectedWH}`),
    ]);
    if (s.status === 'fulfilled') setSensors(s.value.data.data || []);
    if (st.status === 'fulfilled') setStats(st.value.data.data);
    setLoading(false);
  }, [selectedWH, typeFilter]);

  useEffect(() => { fetchSensors(); }, [fetchSensors]);

  const loadHistory = useCallback(async (sensor) => {
    setSelected(sensor);
    const r = await api.get(`/admin/sensors/${sensor._id}/history?hours=${historyHours}`);
    const raw = r.data.data || [];
    setHistory(raw.map(rd => ({
      time:  new Date(rd.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: rd.value,
      anomaly: rd.isAnomaly,
    })));
  }, [historyHours]);

  useEffect(() => { if (selected) loadHistory(selected); }, [selected, historyHours, loadHistory]);

  const handleAdd = async () => {
    await api.post('/admin/sensors', { ...form, warehouseId: selectedWH });
    setShowAdd(false);
    setForm({ sensorId: '', name: '', type: 'temperature', unit: '°C', locationDesc: '' });
    fetchSensors();
  };

  const SENSOR_TYPES = Object.keys(TYPE_ICONS);

  return (
    <div style={{ padding: '28px 32px', background: '#f8f9fc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiThermometer color="#FF7A00" /> Sensor Dashboard
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13 }}>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13 }}>
            <option value="">All Types</option>
            {SENSOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={fetchSensors}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>
            <FiRefreshCw size={14} />
          </button>
          <button onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              background: '#FF7A00', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            <FiPlus size={14} /> Add Sensor
          </button>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Sensors', value: stats.total, color: '#1a1a2e' },
            { label: 'Active', value: stats.active, color: '#22c55e' },
            { label: 'Fault', value: stats.fault, color: '#ef4444' },
            { label: 'Anomalies 24h', value: stats.anomalies24h, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value ?? '—'}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 24 }}>
        {/* Sensor Grid */}
        <div>
          {loading ? <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>Loading sensors…</div>
            : sensors.length === 0 ? <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>No sensors registered</div>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
                {sensors.map(s => <SensorCard key={s._id} sensor={s} onSelect={loadHistory} selected={selected} />)}
              </div>
            )}
        </div>

        {/* History Panel */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{selected.name}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#999' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[6, 24, 48, 168].map(h => (
                <button key={h} onClick={() => setHistoryHours(h)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e0e0e0', cursor: 'pointer', fontSize: 12,
                    background: historyHours === h ? '#FF7A00' : '#fff', color: historyHours === h ? '#fff' : '#333', fontWeight: historyHours === h ? 600 : 400 }}>
                  {h < 24 ? `${h}h` : h === 168 ? '7d' : `${h/24}d`}
                </button>
              ))}
            </div>
            {history.length === 0 ? (
              <div style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 40 }}>No readings in this window</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`${v} ${selected.unit}`, 'Reading']} />
                  <Line type="monotone" dataKey="value" stroke="#FF7A00" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
              {history.length} readings · {selected.unit}
              {selected.thresholds?.min !== undefined && ` · Range: ${selected.thresholds.min}–${selected.thresholds.max}`}
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Register Sensor</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            {[
              { label: 'Sensor ID', key: 'sensorId', placeholder: 'e.g. TEMP-001' },
              { label: 'Name', key: 'name', placeholder: 'e.g. Cold Room Temperature' },
              { label: 'Unit', key: 'unit', placeholder: '°C / % / kg' },
              { label: 'Location Description', key: 'locationDesc', placeholder: 'e.g. Zone A - Cold Room' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 4 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 4 }}>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13 }}>
                {SENSOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowAdd(false)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={handleAdd} disabled={!form.sensorId || !form.name}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: '#FF7A00', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Register</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

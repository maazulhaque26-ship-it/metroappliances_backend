import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../services/api';
import { FiEdit2, FiCheckCircle, FiAlertTriangle, FiThermometer, FiBox } from 'react-icons/fi';

const TEMP_ZONES = ['ambient', 'cool', 'cold', 'frozen'];
const TEMP_COLORS = { ambient: '#6B7280', cool: '#3B82F6', cold: '#0EA5E9', frozen: '#6366F1' };
const STATUS_COLORS = { available: '#10B981', occupied: '#FF7A00', reserved: '#6366F1', maintenance: '#EF4444', full: '#F59E0B' };

function StatusBadge({ status }) {
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
      padding: '2px 8px', borderRadius: '99px', background: (STATUS_COLORS[status] || '#6B7280') + '20',
      color: STATUS_COLORS[status] || '#6B7280' }}>
      {status}
    </span>
  );
}

function EditBinModal({ bin, onClose, onSaved }) {
  const [form, setForm] = useState({
    capacity: bin.capacity ?? 100,
    volume: bin.volume ?? '',
    weightCapacity: bin.weightCapacity ?? '',
    temperatureZone: bin.temperatureZone ?? 'ambient',
    isHazmat: bin.isHazmat ?? false,
    isFastMoving: bin.isFastMoving ?? false,
    nearDispatch: bin.nearDispatch ?? false,
    nearReceiving: bin.nearReceiving ?? false,
    status: bin.status ?? 'available',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setSaving(true); setErr('');
    try {
      await api.patch(`/admin/storage-locations/${bin._id}`, form);
      onSaved();
    } catch (e) { setErr(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card)', borderRadius: '16px', padding: '28px', width: '420px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Edit Bin — {bin.code}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '20px', color: 'var(--text-4)' }}>×</button>
        </div>

        {[
          { label: 'Capacity (units)', key: 'capacity', type: 'number' },
          { label: 'Volume (cm³)', key: 'volume', type: 'number' },
          { label: 'Weight Capacity (kg)', key: 'weightCapacity', type: 'number' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '5px' }}>{f.label}</label>
            <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }} />
          </div>
        ))}

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '5px' }}>Temperature Zone</label>
          <select value={form.temperatureZone} onChange={e => setForm(p => ({ ...p, temperatureZone: e.target.value }))}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}>
            {TEMP_ZONES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '5px' }}>Status</label>
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {[
            { key: 'isHazmat',     label: 'Hazmat Zone' },
            { key: 'isFastMoving', label: 'Fast Moving' },
            { key: 'nearDispatch', label: 'Near Dispatch' },
            { key: 'nearReceiving',label: 'Near Receiving' },
          ].map(f => (
            <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#FF7A00' }} />
              {f.label}
            </label>
          ))}
        </div>

        {err && <p style={{ color: '#EF4444', fontSize: '12px', marginBottom: '12px' }}>{err}</p>}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#FF7A00', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBinManagement() {
  const [bins, setBins]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [editBin, setEditBin] = useState(null);
  const [filters, setFilters] = useState({ zone: '', status: '', temp: '', hazmat: '' });
  const [search, setSearch]   = useState('');

  const fetchBins = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 200 });
    if (filters.zone)   params.set('zone', filters.zone);
    if (filters.status) params.set('status', filters.status);
    if (filters.temp)   params.set('temperatureZone', filters.temp);
    if (filters.hazmat) params.set('isHazmat', filters.hazmat);
    api.get(`/admin/storage-locations?${params}`).then(r => setBins(r.data.data || r.data.locations || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBins(); }, [filters]);

  const filtered = bins.filter(b => !search || b.code?.toLowerCase().includes(search.toLowerCase()) || b.rack?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1200px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Poppins', fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>Bin Management</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>Configure storage locations — capacity, temperature, hazmat, proximity flags</p>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-4)', fontWeight: 600 }}>{filtered.length} bins</span>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code or rack…"
            style={{ flex: 1, minWidth: '180px', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }} />
          {[
            { key: 'status', label: 'Status', opts: ['', ...Object.keys(STATUS_COLORS)] },
            { key: 'temp',   label: 'Temp Zone', opts: ['', ...TEMP_ZONES] },
            { key: 'hazmat', label: 'Hazmat', opts: ['', 'true', 'false'] },
          ].map(f => (
            <select key={f.key} value={filters[f.key]} onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))}
              style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}>
              <option value="">{f.label}</option>
              {f.opts.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Bin Code', 'Zone', 'Aisle', 'Rack', 'Shelf', 'Capacity', 'Util%', 'Temp', 'Flags', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)' }}>No bins found</td></tr>
              ) : filtered.map(bin => (
                <tr key={bin._id} style={{ borderTop: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '11px 14px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text)' }}>{bin.code}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--text-4)' }}>{bin.zone || '—'}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--text-4)' }}>{bin.aisle || '—'}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--text-4)' }}>{bin.rack || '—'}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--text-4)' }}>{bin.shelf || '—'}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--text)' }}>{bin.capacity ?? '—'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '40px', height: '5px', borderRadius: '99px', background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ width: `${bin.utilizationPct ?? 0}%`, height: '100%', background: bin.utilizationPct >= 90 ? '#EF4444' : bin.utilizationPct >= 70 ? '#F59E0B' : '#10B981', borderRadius: '99px' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{bin.utilizationPct ?? 0}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: (TEMP_COLORS[bin.temperatureZone] || '#6B7280') + '20', color: TEMP_COLORS[bin.temperatureZone] || '#6B7280' }}>
                      <FiThermometer size={10} style={{ display: 'inline', marginRight: '3px' }} />{bin.temperatureZone || 'ambient'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {bin.isHazmat    && <span title="Hazmat"     style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '4px', background: '#FEE2E2', color: '#991B1B', fontWeight: 700 }}>HZ</span>}
                      {bin.isFastMoving&& <span title="Fast Moving"style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '4px', background: '#D1FAE5', color: '#065F46', fontWeight: 700 }}>FM</span>}
                      {bin.nearDispatch&& <span title="Near Dispatch" style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E', fontWeight: 700 }}>ND</span>}
                      {bin.nearReceiving && <span title="Near Receiving" style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '4px', background: '#EDE9FE', color: '#4C1D95', fontWeight: 700 }}>NR</span>}
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px' }}><StatusBadge status={bin.status || 'available'} /></td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => setEditBin(bin)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FiEdit2 size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editBin && <EditBinModal bin={editBin} onClose={() => setEditBin(null)} onSaved={() => { setEditBin(null); fetchBins(); }} />}
    </AdminLayout>
  );
}

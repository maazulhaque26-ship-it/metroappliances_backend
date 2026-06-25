import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { SectionHeader, LoadingState, ErrorState } from '../../components/shared';
import api from '../../services/api';
import { toast } from 'react-toastify';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminWarehouseSettings() {
  const [warehouses,    setWarehouses]    = useState([]);
  const [selectedWh,    setSelectedWh]    = useState('');
  const [zones,         setZones]         = useState([]);
  const [settings,      setSettings]      = useState(null);
  const [form,          setForm]          = useState({});
  const [loading,       setLoading]       = useState(false);
  const [zonesLoading,  setZonesLoading]  = useState(false);
  const [saving,        setSaving]        = useState(false);

  useEffect(() => {
    api.get('/admin/warehouses', { params: { limit: 100 } }).then(r => {
      const whs = r.data.data || [];
      setWarehouses(whs);
      if (whs.length > 0) setSelectedWh(whs[0]._id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedWh) return;
    setLoading(true); setZonesLoading(true);
    Promise.all([
      api.get(`/admin/warehouse-settings/${selectedWh}`),
      api.get('/admin/warehouse-zones', { params: { warehouseId: selectedWh, limit: 100 } }),
    ])
      .then(([s, z]) => {
        const st = s.data.data;
        setSettings(st);
        setZones(z.data.data || []);
        setForm({
          defaultReceivingZone: st.defaultReceivingZone?._id || st.defaultReceivingZone || '',
          defaultDispatchZone:  st.defaultDispatchZone?._id  || st.defaultDispatchZone  || '',
          autoBinAllocation:    st.autoBinAllocation  ?? false,
          barcodePrefix:        st.barcodePrefix  || 'WH',
          qrPrefix:             st.qrPrefix       || 'QR',
          workingHoursStart:    st.workingHoursStart || '09:00',
          workingHoursEnd:      st.workingHoursEnd   || '18:00',
          workingDays:          st.workingDays || ['Mon','Tue','Wed','Thu','Fri','Sat'],
          capacityWarningPct:   st.capacityWarningPct ?? 80,
          lowStockThreshold:    st.lowStockThreshold  ?? 10,
          autoGRNApproval:      st.autoGRNApproval ?? false,
        });
      })
      .catch(e => toast.error(e.response?.data?.message || 'Failed to load settings'))
      .finally(() => { setLoading(false); setZonesLoading(false); });
  }, [selectedWh]);

  const toggleDay = (day) => {
    setForm(p => ({
      ...p,
      workingDays: p.workingDays.includes(day)
        ? p.workingDays.filter(d => d !== day)
        : [...p.workingDays, day],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/warehouse-settings/${selectedWh}`, form);
      toast.success('Settings saved');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const F = ({ label, children }) => (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-4)' }}>{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none";
  const inputStyle = { borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-3xl">
        <SectionHeader title="Warehouse Settings" subtitle="Per-warehouse configuration" />

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-4)' }}>Select Warehouse</label>
          <select value={selectedWh} onChange={e => setSelectedWh(e.target.value)}
            className="px-4 py-2 rounded-lg border text-sm outline-none w-full max-w-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
            {warehouses.length === 0 && <option value="">No warehouses</option>}
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
          </select>
        </div>

        {loading && <LoadingState rows={6} />}

        {!loading && settings && (
          <form onSubmit={handleSave} className="space-y-6">

            {/* Default Zones */}
            <section className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Default Zones</h3>
              <div className="grid grid-cols-2 gap-4">
                <F label="Default Receiving Zone">
                  <select value={form.defaultReceivingZone || ''} onChange={e => setForm(p => ({ ...p, defaultReceivingZone: e.target.value }))}
                    className={inputCls} style={inputStyle}>
                    <option value="">None</option>
                    {zones.filter(z => z.type === 'receiving').map(z => <option key={z._id} value={z._id}>{z.code} — {z.name}</option>)}
                  </select>
                </F>
                <F label="Default Dispatch Zone">
                  <select value={form.defaultDispatchZone || ''} onChange={e => setForm(p => ({ ...p, defaultDispatchZone: e.target.value }))}
                    className={inputCls} style={inputStyle}>
                    <option value="">None</option>
                    {zones.filter(z => z.type === 'dispatch').map(z => <option key={z._id} value={z._id}>{z.code} — {z.name}</option>)}
                  </select>
                </F>
              </div>
            </section>

            {/* Barcode / QR */}
            <section className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Barcode & QR Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <F label="Barcode Prefix">
                  <input type="text" value={form.barcodePrefix || ''} onChange={e => setForm(p => ({ ...p, barcodePrefix: e.target.value.toUpperCase() }))}
                    placeholder="WH" className={inputCls} style={inputStyle} />
                </F>
                <F label="QR Code Prefix">
                  <input type="text" value={form.qrPrefix || ''} onChange={e => setForm(p => ({ ...p, qrPrefix: e.target.value.toUpperCase() }))}
                    placeholder="QR" className={inputCls} style={inputStyle} />
                </F>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="autoBin" checked={form.autoBinAllocation || false} onChange={e => setForm(p => ({ ...p, autoBinAllocation: e.target.checked }))} className="rounded" />
                <label htmlFor="autoBin" className="text-sm" style={{ color: 'var(--text)' }}>Auto bin allocation (assign available bin automatically on inbound)</label>
              </div>
            </section>

            {/* Working Hours */}
            <section className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Working Hours</h3>
              <div className="grid grid-cols-2 gap-4">
                <F label="Start Time">
                  <input type="time" value={form.workingHoursStart || '09:00'} onChange={e => setForm(p => ({ ...p, workingHoursStart: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </F>
                <F label="End Time">
                  <input type="time" value={form.workingHoursEnd || '18:00'} onChange={e => setForm(p => ({ ...p, workingHoursEnd: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </F>
              </div>
              <F label="Working Days">
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map(d => (
                    <button key={d} type="button" onClick={() => toggleDay(d)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
                      style={{
                        background: form.workingDays?.includes(d) ? '#FF7A00' : 'var(--bg-2)',
                        color:      form.workingDays?.includes(d) ? '#fff' : 'var(--text)',
                        borderColor: form.workingDays?.includes(d) ? '#FF7A00' : 'var(--border)',
                      }}>{d}</button>
                  ))}
                </div>
              </F>
            </section>

            {/* Thresholds */}
            <section className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Thresholds & Automation</h3>
              <div className="grid grid-cols-2 gap-4">
                <F label={`Capacity Warning at ${form.capacityWarningPct ?? 80}%`}>
                  <input type="range" min={10} max={100} value={form.capacityWarningPct ?? 80} onChange={e => setForm(p => ({ ...p, capacityWarningPct: Number(e.target.value) }))}
                    className="w-full" />
                </F>
                <F label="Low Stock Threshold (units)">
                  <input type="number" min={1} value={form.lowStockThreshold ?? 10} onChange={e => setForm(p => ({ ...p, lowStockThreshold: Number(e.target.value) }))}
                    className={inputCls} style={inputStyle} />
                </F>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="autoGRN" checked={form.autoGRNApproval || false} onChange={e => setForm(p => ({ ...p, autoGRNApproval: e.target.checked }))} className="rounded" />
                <label htmlFor="autoGRN" className="text-sm" style={{ color: 'var(--text)' }}>Auto-approve GRN entries without manual verification</label>
              </div>
            </section>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="px-8 py-2.5 rounded-lg font-semibold text-white text-sm disabled:opacity-50" style={{ background: '#FF7A00' }}>
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}

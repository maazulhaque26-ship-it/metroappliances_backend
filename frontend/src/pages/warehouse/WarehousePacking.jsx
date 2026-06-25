import React, { useState, useCallback, useEffect } from 'react';
import warehouseAPI from '../../services/warehouseAPI';
import SectionHeader from '../../components/shared/SectionHeader';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import EmptyState    from '../../components/shared/EmptyState';
import { toast } from 'react-toastify';

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';

export default function WarehousePacking() {
  const [dispatches, setDispatches] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [packingId,  setPackingId]  = useState(null);
  const [form, setForm] = useState({ length: '', width: '', height: '', weight: '', packingMaterial: 'standard_box', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    warehouseAPI.get('/warehouse/dispatches/ready')
      .then(r => setDispatches(r.data.data || []))
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePack = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await warehouseAPI.post('/warehouse/packages', { dispatchId: packingId, ...form });
      toast.success('Package created — dispatch marked as packed');
      setPackingId(null);
      setForm({ length: '', width: '', height: '', weight: '', packingMaterial: 'standard_box', notes: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingState message="Loading dispatches for packing…" />;

  return (
    <div className="p-6 space-y-4">
      <SectionHeader title="Packing" subtitle="Dispatches ready for packing" />

      {dispatches.length === 0 ? (
        <EmptyState message="No dispatches awaiting packing" />
      ) : (
        <div className="space-y-3">
          {dispatches.map(d => (
            <div key={d._id} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: '#FF7A00' }}>{d.dispatchNumber}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>{d.recipientName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>{d.items?.length} items</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={d.status} />
                  {d.status === 'picked' && !d.package && (
                    <button onClick={() => setPackingId(d._id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: '#FF7A00' }}>Pack</button>
                  )}
                  {d.package && <span className="text-xs text-green-500 font-bold">Packed ✓</span>}
                </div>
              </div>

              {packingId === d._id && (
                <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-bold mb-3" style={{ color: 'var(--text-4)' }}>PACKAGE DETAILS</p>
                  <form onSubmit={handlePack} className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[['length','L (cm)'],['width','W (cm)'],['height','H (cm)']].map(([k,l]) => (
                        <div key={k}>
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>{l}</label>
                          <input type="number" step="0.1" min={0} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                            className="w-full px-2 py-1.5 rounded border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Weight (kg)</label>
                        <input type="number" step="0.01" min={0} value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                          className="w-full px-2 py-1.5 rounded border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Packing Material</label>
                        <select value={form.packingMaterial} onChange={e => setForm(f => ({ ...f, packingMaterial: e.target.value }))}
                          className="w-full px-2 py-1.5 rounded border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }}>
                          <option value="standard_box">Standard Box</option>
                          <option value="heavy_duty_box">Heavy Duty Box</option>
                          <option value="bubble_wrap">Bubble Wrap</option>
                          <option value="foam">Foam</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Notes</label>
                      <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        className="w-full px-2 py-1.5 rounded border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPackingId(null)} className="flex-1 py-2 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                      <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>Confirm Pack</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

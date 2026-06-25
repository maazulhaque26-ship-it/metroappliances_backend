import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FiPlay, FiCheckCircle } from 'react-icons/fi';
import warehouseAPI from '../../services/warehouseAPI';
import { toast } from 'react-toastify';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

export default function WarehouseCycleCount() {
  const { warehouseUser } = useSelector(s => s.warehouseAuth);
  const [counts,  setCounts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [active,  setActive]  = useState(null);
  const [acting,  setActing]  = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCounts = useCallback(() => {
    setLoading(true);
    warehouseAPI.get('/warehouse/cycle-counts', { params: { status: statusFilter || undefined } })
      .then(r => setCounts(r.data.data || []))
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const loadDetail = async (cc) => {
    try {
      const r = await warehouseAPI.get(`/admin/inventory/cycle-counts/${cc._id}`);
      setActive(r.data.data);
    } catch { toast.error('Failed to load cycle count'); }
  };

  const updateCount = (idx, field, value) => {
    setActive(prev => {
      const items = [...(prev.items || [])];
      items[idx] = {
        ...items[idx],
        [field]: Number(value),
        variance: field === 'countedQty'
          ? Number(value) - (items[idx].expectedQty || 0)
          : items[idx].variance,
      };
      return { ...prev, items };
    });
  };

  const handleStart = async (cc) => {
    try {
      await warehouseAPI.put(`/admin/inventory/cycle-counts/${cc._id}/start`);
      toast.success('Count started');
      fetchCounts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to start'); }
  };

  const handleSaveItems = async () => {
    if (!active) return;
    setActing(true);
    try {
      await warehouseAPI.put(`/warehouse/cycle-counts/${active._id}/items`, { items: active.items });
      toast.success('Count items saved');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setActing(false); }
  };

  const handleComplete = async () => {
    if (!active) return;
    setActing(true);
    try {
      await warehouseAPI.put(`/admin/inventory/cycle-counts/${active._id}/complete`);
      toast.success('Count completed — pending admin approval');
      setActive(null);
      fetchCounts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to complete'); }
    finally { setActing(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Cycle Count</h2>
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Physical stock verification</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[{ label: 'All', value: '' }, { label: 'Planned', value: 'planned' }, { label: 'In Progress', value: 'started' }].map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: statusFilter === f.value ? '#FF7A00' : 'var(--bg-2)', color: statusFilter === f.value ? '#fff' : 'var(--text-4)' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {!active && (
        loading ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-4)' }}>Loading…</div>
        ) : (
          <div className="space-y-3">
            {counts.length === 0 && <div className="text-center py-12 text-sm" style={{ color: 'var(--text-4)' }}>No counts found</div>}
            {counts.map(cc => (
              <div key={cc._id} className="rounded-2xl p-4 flex items-center justify-between"
                   style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="font-bold text-sm font-mono" style={{ color: '#FF7A00' }}>{cc.countNumber}</p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>Zone: {cc.zone?.name || 'All'} · {fmtDate(cc.scheduledDate)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>{cc.items?.length || 0} items</p>
                </div>
                <div className="flex gap-2">
                  {cc.status === 'planned' && (
                    <button onClick={() => handleStart(cc)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#3B82F6' }}>
                      <FiPlay size={12} /> Start
                    </button>
                  )}
                  {cc.status === 'started' && (
                    <button onClick={() => loadDetail(cc)} className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#FF7A00' }}>
                      Count Items
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Count form */}
      {active && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold" style={{ color: 'var(--text)' }}>{active.countNumber}</p>
              <p className="text-sm" style={{ color: 'var(--text-4)' }}>{active.items?.length || 0} items to count</p>
            </div>
            <button onClick={() => setActive(null)} className="text-xs px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
              Back
            </button>
          </div>

          <div className="space-y-3">
            {(active.items || []).map((item, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{item.productName || `Item ${i + 1}`}</p>
                  {item.variance !== 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: item.variance > 0 ? '#D1FAE5' : '#FEE2E2', color: item.variance > 0 ? '#065F46' : '#991B1B' }}>
                      {item.variance > 0 ? '+' : ''}{item.variance}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Expected</label>
                    <input type="number" value={item.expectedQty || 0} readOnly
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#FF7A00', fontWeight: 700 }}>Counted *</label>
                    <input type="number" min="0" value={item.countedQty || 0}
                      onChange={e => updateCount(i, 'countedQty', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#FF7A00', background: 'var(--card)', color: 'var(--text)' }} />
                  </div>
                </div>
                {item.storageLocation && (
                  <p className="text-xs mt-2 font-mono" style={{ color: 'var(--text-4)' }}>
                    Location: {item.storageLocation.rack}-{item.storageLocation.shelf}-{item.storageLocation.bin}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={handleSaveItems} disabled={acting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border disabled:opacity-50"
              style={{ borderColor: '#FF7A00', color: '#FF7A00' }}>
              {acting ? 'Saving…' : 'Save Progress'}
            </button>
            <button onClick={handleComplete} disabled={acting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: '#10B981' }}>
              <FiCheckCircle size={16} />
              {acting ? 'Processing…' : 'Submit Count'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

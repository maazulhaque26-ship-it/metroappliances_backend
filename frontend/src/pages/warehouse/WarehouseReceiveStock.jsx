import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FiPackage, FiCheck } from 'react-icons/fi';
import warehouseAPI from '../../services/warehouseAPI';
import { toast } from 'react-toastify';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

const STATUS_LABELS = { draft: 'Draft', pending: 'Pending', receiving: 'Receiving', quality_check: 'QC', completed: 'Done', cancelled: 'Cancelled' };
const STATUS_COLORS = { draft: '#6B7280', pending: '#F59E0B', receiving: '#3B82F6', quality_check: '#8B5CF6', completed: '#10B981', cancelled: '#EF4444' };

export default function WarehouseReceiveStock() {
  const { warehouseUser } = useSelector(s => s.warehouseAuth);
  const [grns,    setGrns]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [active,  setActive]  = useState(null); // GRN being processed
  const [acting,  setActing]  = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchGRNs = useCallback(() => {
    setLoading(true);
    warehouseAPI.get('/warehouse/grn', { params: { status: statusFilter || undefined, limit: 50 } })
      .then(r => setGrns(r.data.data || []))
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchGRNs(); }, [fetchGRNs]);

  const loadGRNDetail = async (grn) => {
    try {
      const r = await warehouseAPI.get(`/admin/grn/${grn._id}`);
      setActive(r.data.data);
    } catch { toast.error('Failed to load GRN'); }
  };

  const updateItem = (idx, field, value) => {
    setActive(prev => {
      const items = [...(prev.items || [])];
      items[idx] = { ...items[idx], [field]: Number(value) };
      return { ...prev, items };
    });
  };

  const handleComplete = async () => {
    if (!active) return;
    setActing(true);
    try {
      await warehouseAPI.put(`/warehouse/grn/${active._id}/complete`, { items: active.items });
      toast.success('GRN completed — inventory updated');
      setActive(null);
      fetchGRNs();
    } catch (err) { toast.error(err.response?.data?.message || 'Complete failed'); }
    finally { setActing(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Receive Stock</h2>
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Process incoming goods receipts</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'receiving', 'quality_check'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{
              background: statusFilter === s ? '#FF7A00' : 'var(--bg-2)',
              color:      statusFilter === s ? '#fff' : 'var(--text-4)',
            }}
          >
            {s ? STATUS_LABELS[s] : 'All Active'}
          </button>
        ))}
      </div>

      {/* GRN list */}
      {!active && (
        loading ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-4)' }}>Loading GRNs…</div>
        ) : (
          <div className="space-y-3">
            {grns.length === 0 && <div className="text-center py-12 text-sm" style={{ color: 'var(--text-4)' }}>No GRNs found</div>}
            {grns.map(grn => (
              <button
                key={grn._id}
                onClick={() => loadGRNDetail(grn)}
                className="w-full text-left rounded-2xl p-4 transition-all hover:opacity-80"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm font-mono" style={{ color: '#FF7A00' }}>{grn.grnNumber}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>{grn.supplier || 'No supplier'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-4)' }}>{grn.items?.length || 0} items · {fmtDate(grn.createdAt)}</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{ background: `${STATUS_COLORS[grn.status]}20`, color: STATUS_COLORS[grn.status] }}>
                    {STATUS_LABELS[grn.status]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )
      )}

      {/* GRN detail / receiving form */}
      {active && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold" style={{ color: 'var(--text)' }}>GRN: {active.grnNumber}</p>
              <p className="text-sm" style={{ color: 'var(--text-4)' }}>{active.supplier || '—'} · {active.purchaseOrder || '—'}</p>
            </div>
            <button onClick={() => setActive(null)} className="text-xs px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
              Back to List
            </button>
          </div>

          <div className="space-y-3">
            {(active.items || []).map((item, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <p className="font-semibold text-sm mb-3" style={{ color: 'var(--text)' }}>{item.product?.name || item.productName || `Item ${i + 1}`}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'orderedQty',  label: 'Ordered',  readOnly: true },
                    { key: 'receivedQty', label: 'Received', readOnly: false },
                    { key: 'acceptedQty', label: 'Accepted', readOnly: false },
                    { key: 'damageQty',   label: 'Damaged',  readOnly: false },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>{f.label}</label>
                      <input
                        type="number" min="0"
                        value={item[f.key] || 0}
                        readOnly={f.readOnly}
                        onChange={f.readOnly ? undefined : e => updateItem(i, f.key, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                        style={{
                          borderColor: 'var(--border)',
                          background: f.readOnly ? 'var(--bg-2)' : 'var(--card)',
                          color: 'var(--text)',
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Batch No (optional)</label>
                    <input type="text" value={item.batchNumber || ''} onChange={e => updateItem(i, 'batchNumber', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Unit Cost</label>
                    <input type="number" min="0" value={item.unitCost || 0} onChange={e => updateItem(i, 'unitCost', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!['completed', 'cancelled'].includes(active.status) && (
            <button
              onClick={handleComplete}
              disabled={acting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: '#10B981' }}
            >
              <FiCheck size={16} />
              {acting ? 'Completing…' : 'Complete GRN — Update Inventory'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

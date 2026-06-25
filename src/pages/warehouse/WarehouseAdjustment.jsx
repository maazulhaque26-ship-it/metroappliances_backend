import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import warehouseAPI from '../../services/warehouseAPI';
import { toast } from 'react-toastify';

const REASONS = ['damage', 'lost', 'expired', 'manual', 'correction', 'theft', 'sample', 'write_off'];
const EMPTY_ITEM = { productName: '', product: '', reason: 'manual', currentQty: 0, adjustedQty: 0, notes: '' };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const adjColor = (s) => ({ pending: '#F59E0B', applied: '#10B981', rejected: '#EF4444', approved: '#3B82F6' })[s] || '#6B7280';

export default function WarehouseAdjustment() {
  const { warehouseUser } = useSelector(s => s.warehouseAuth);
  const [tab,     setTab]     = useState('history'); // 'new' | 'history'
  const [items,   setItems]   = useState([{ ...EMPTY_ITEM }]);
  const [notes,   setNotes]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    warehouseAPI.get('/warehouse/inventory', { params: { limit: 200 } })
      .then(r => setInventory(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== 'history') return;
    setLoading(true);
    warehouseAPI.get('/warehouse/adjustments', { params: { limit: 20 } })
      .then(r => setHistory(r.data.data || []))
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [tab]);

  const addItem = () => setItems(p => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems(p => p.filter((_, j) => j !== i));
  const updateItem = (i, field, value) => {
    setItems(p => {
      const next = [...p];
      next[i] = { ...next[i], [field]: value };
      if (field === 'product') {
        const inv = inventory.find(v => v.product?._id === value || v._id === value);
        if (inv) {
          next[i].currentQty  = inv.availableQty;
          next[i].productName = inv.product?.name || '';
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!items.length || !items[0].product) return toast.error('Add at least one item with a product');
    setSaving(true);
    try {
      await warehouseAPI.post('/warehouse/adjustments', { items, notes });
      toast.success('Adjustment submitted for admin approval');
      setItems([{ ...EMPTY_ITEM }]);
      setNotes('');
      setTab('history');
    } catch (err) { toast.error(err.response?.data?.message || 'Submit failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Stock Adjustments</h2>
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Report damage, losses, or corrections</p>
      </div>

      <div className="flex gap-2">
        {[{ label: 'History', value: 'history' }, { label: 'New Adjustment', value: 'new' }].map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: tab === t.value ? '#FF7A00' : 'var(--bg-2)', color: tab === t.value ? '#fff' : 'var(--text-4)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'history' && (
        loading ? <div className="text-center py-12 text-sm" style={{ color: 'var(--text-4)' }}>Loading…</div> : (
          <div className="space-y-3">
            {history.length === 0 && <div className="text-center py-12 text-sm" style={{ color: 'var(--text-4)' }}>No adjustments yet</div>}
            {history.map(adj => (
              <div key={adj._id} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{adj.adjustmentNumber}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${adjColor(adj.status)}20`, color: adjColor(adj.status) }}>
                    {adj.status}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-4)' }}>{adj.items?.length || 0} items · {fmtDate(adj.createdAt)}</p>
                {adj.rejectionReason && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>Rejected: {adj.rejectionReason}</p>}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'new' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Item {i + 1}</p>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-red-500"><FiTrash2 size={14} /></button>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Product</label>
                <select value={item.product} onChange={e => updateItem(i, 'product', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                  <option value="">Select product</option>
                  {inventory.map(inv => (
                    <option key={inv._id} value={inv.product?._id || inv._id}>
                      {inv.product?.name} (Available: {inv.availableQty})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Reason</label>
                  <select value={item.reason} onChange={e => updateItem(i, 'reason', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none capitalize"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                    {REASONS.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Current Qty</label>
                  <input type="number" value={item.currentQty} readOnly
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Adjustment (+/-)</label>
                  <input type="number" value={item.adjustedQty}
                    onChange={e => updateItem(i, 'adjustedQty', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Notes</label>
                  <input type="text" value={item.notes} onChange={e => updateItem(i, 'notes', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                </div>
              </div>
            </div>
          ))}

          <button type="button" onClick={addItem}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-4)' }}>
            <FiPlus size={14} /> Add Another Item
          </button>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>Overall Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Describe the reason for this adjustment…"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
              style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: '#FF7A00' }}>
            {saving ? 'Submitting…' : 'Submit for Approval'}
          </button>
        </form>
      )}
    </div>
  );
}

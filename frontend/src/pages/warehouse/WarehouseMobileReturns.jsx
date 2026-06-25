import React, { useState } from 'react';
import WarehouseLayout from './WarehouseLayout';
import api from '../../services/api';
import { FiRotateCcw, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

const RETURN_REASONS = [
  'Customer changed mind',
  'Damaged in transit',
  'Wrong item shipped',
  'Defective / not working',
  'Item not as described',
  'Duplicate order',
  'Quality issue',
  'Other',
];

const CONDITIONS = [
  { value: 'good',      label: 'Good — resellable as new' },
  { value: 'opened',   label: 'Opened — resellable' },
  { value: 'damaged',  label: 'Damaged — needs repair' },
  { value: 'defective',label: 'Defective — cannot resell' },
];

const DISPOSITIONS = [
  { value: 'restock',   label: 'Restock to inventory' },
  { value: 'quarantine',label: 'Quarantine for inspection' },
  { value: 'scrap',     label: 'Scrap / dispose' },
  { value: 'supplier',  label: 'Return to supplier' },
];

export default function WarehouseMobileReturns() {
  const [form, setForm] = useState({
    orderNumber: '',
    sku: '',
    quantity: 1,
    reason: '',
    condition: 'good',
    disposition: 'restock',
    notes: '',
    binCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [err, setErr]         = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.sku.trim()) { setErr('SKU is required'); return; }
    if (!form.reason)      { setErr('Select a return reason'); return; }
    setLoading(true); setErr('');
    try {
      const r = await api.post('/warehouse/scan', {
        value: form.sku.trim(),
        action: 'return',
        context: { orderNumber: form.orderNumber, quantity: form.quantity, reason: form.reason, condition: form.condition, disposition: form.disposition, notes: form.notes, binCode: form.binCode },
      });
      setSuccess({ ...form, scanResult: r.data.data });
    } catch (e) { setErr(e.response?.data?.message || 'Return processing failed'); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <WarehouseLayout>
        <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '32px', textAlign: 'center' }}>
          <div style={{ padding: '48px 24px', background: 'var(--card)', borderRadius: '16px', border: '1px solid #10B981', marginTop: '20px' }}>
            <FiCheckCircle size={52} style={{ color: '#10B981', marginBottom: '20px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '10px' }}>Return Processed</h2>
            <div style={{ fontSize: '13px', color: 'var(--text-4)', marginBottom: '24px', lineHeight: 1.8 }}>
              <p>SKU: <b style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{success.sku}</b></p>
              <p>Qty: <b style={{ color: 'var(--text)' }}>{success.quantity}</b></p>
              <p>Condition: <b style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{success.condition}</b></p>
              <p>Disposition: <b style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{success.disposition}</b></p>
              {success.binCode && <p>Placed in: <b style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{success.binCode}</b></p>}
            </div>
            <button onClick={() => { setSuccess(null); setForm({ orderNumber:'', sku:'', quantity:1, reason:'', condition:'good', disposition:'restock', notes:'', binCode:'' }); }}
              style={{ padding: '14px 32px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
              Process Another Return
            </button>
          </div>
        </div>
      </WarehouseLayout>
    );
  }

  return (
    <WarehouseLayout>
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '40px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>Process Return</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '2px' }}>Receive, assess, and dispose returned items</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Order + SKU */}
          {[
            { label: 'Order Number (optional)', key: 'orderNumber', placeholder: 'ORD-20240001', type: 'text' },
            { label: 'Product SKU *', key: 'sku', placeholder: 'Scan or type SKU…', type: 'text', mono: true },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '7px' }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} autoComplete="off"
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: f.mono ? '16px' : '14px', fontFamily: f.mono ? 'monospace' : 'inherit', fontWeight: f.mono ? 700 : 400, boxSizing: 'border-box' }} />
            </div>
          ))}

          {/* Quantity */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '7px' }}>Quantity *</label>
            <input type="number" min={1} value={form.quantity} onChange={e => set('quantity', Math.max(1, Number(e.target.value)))}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: '18px', fontWeight: 700, boxSizing: 'border-box' }} />
          </div>

          {/* Return reason */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '10px' }}>Return Reason *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {RETURN_REASONS.map(r => (
                <button key={r} onClick={() => set('reason', r)}
                  style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '10px', border: `2px solid ${form.reason === r ? '#FF7A00' : 'var(--border)'}`,
                    background: form.reason === r ? '#FFF7ED' : 'var(--card)', color: form.reason === r ? '#FF7A00' : 'var(--text)', fontWeight: form.reason === r ? 700 : 400, fontSize: '13px', cursor: 'pointer' }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '10px' }}>Item Condition *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {CONDITIONS.map(c => (
                <button key={c.value} onClick={() => set('condition', c.value)}
                  style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '10px', border: `2px solid ${form.condition === c.value ? '#FF7A00' : 'var(--border)'}`,
                    background: form.condition === c.value ? '#FFF7ED' : 'var(--card)', color: form.condition === c.value ? '#FF7A00' : 'var(--text)', fontWeight: form.condition === c.value ? 700 : 400, fontSize: '13px', cursor: 'pointer' }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Disposition */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '10px' }}>Disposition *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {DISPOSITIONS.map(d => (
                <button key={d.value} onClick={() => set('disposition', d.value)}
                  style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '10px', border: `2px solid ${form.disposition === d.value ? '#FF7A00' : 'var(--border)'}`,
                    background: form.disposition === d.value ? '#FFF7ED' : 'var(--card)', color: form.disposition === d.value ? '#FF7A00' : 'var(--text)', fontWeight: form.disposition === d.value ? 700 : 400, fontSize: '13px', cursor: 'pointer' }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Destination bin (if restocking) */}
          {form.disposition === 'restock' && (
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '7px' }}>Destination Bin (optional)</label>
              <input value={form.binCode} onChange={e => set('binCode', e.target.value)} placeholder="Scan or type bin code…"
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: '16px', fontFamily: 'monospace', fontWeight: 600, boxSizing: 'border-box' }} />
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '7px' }}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Additional details…"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          {err && (
            <div style={{ padding: '13px 16px', background: '#FEE2E2', borderRadius: '10px', color: '#991B1B', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiAlertTriangle size={16} /> {err}
            </div>
          )}

          <button onClick={submit} disabled={loading}
            style={{ padding: '17px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '8px' }}>
            <FiRotateCcw size={20} /> {loading ? 'Processing…' : 'Submit Return'}
          </button>
        </div>
      </div>
    </WarehouseLayout>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPlay, FiPause, FiCheck, FiX, FiPlus } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import { getOrder, startOrder, pauseOrder, completeOrder, cancelOrder, createBatch, updateBatch } from '../../services/manufacturingAPI';

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{value || '—'}</div>
    </div>
  );
}

const BATCH_STATUSES = ['pending','in_progress','completed','failed'];
const EMPTY_BATCH = { batchSize: 1, machine: '', notes: '' };

export default function AdminProductionOrderDetail() {
  const { id }          = useParams();
  const [order,  setOrder] = useState(null);
  const [loading,setLoad]  = useState(true);
  const [acting, setAct]   = useState(false);
  const [addingBatch, setAddingBatch] = useState(false);
  const [batchForm,   setBatchForm]   = useState(EMPTY_BATCH);
  const [completing,  setCompleting]  = useState(false);
  const [completeForm, setCompleteForm] = useState({ completedQuantity: 0, rejectedQuantity: 0, note: '' });

  const load = () => {
    setLoad(true);
    getOrder(id).then(r => setOrder(r.data.data)).catch(console.error).finally(() => setLoad(false));
  };
  useEffect(() => { load(); }, [id]);

  const doAction = async (fn, ...args) => {
    setAct(true);
    try { await fn(id, ...args); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setAct(false); }
  };

  const handleComplete = async (e) => {
    e.preventDefault(); setAct(true);
    try { await completeOrder(id, completeForm); setCompleting(false); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setAct(false); }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault(); setAct(true);
    try { await createBatch(id, batchForm); setBatchForm(EMPTY_BATCH); setAddingBatch(false); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setAct(false); }
  };

  const handleBatchStatus = async (batchId, status) => {
    try { await updateBatch(id, batchId, { status }); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading…</div>;
  if (!order)  return <div style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>Order not found.</div>;

  const pct = order.plannedQuantity > 0 ? Math.min(100, Math.round((order.completedQuantity || 0) / order.plannedQuantity * 100)) : 0;
  const can = (statuses) => statuses.includes(order.status);

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/admin/manufacturing/orders" style={{ color: '#6B7280' }}><FiArrowLeft size={18} /></Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>{order.orderNumber}</h1>
        <StatusBadge status={order.status} size="lg" />
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#374151', background: '#F3F4F6', padding: '4px 10px', borderRadius: 20 }}>
          {order.priority?.toUpperCase()}
        </span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {can(['confirmed','scheduled','paused']) && (
          <button onClick={() => doAction(startOrder, {})} disabled={acting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            <FiPlay size={13} /> Start
          </button>
        )}
        {can(['draft']) && (
          <button onClick={() => doAction(startOrder, {})} disabled={acting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            Confirm & Start
          </button>
        )}
        {can(['in_progress']) && (
          <button onClick={() => doAction(pauseOrder, {})} disabled={acting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            <FiPause size={13} /> Pause
          </button>
        )}
        {can(['in_progress','paused']) && !completing && (
          <button onClick={() => { setCompleteForm({ completedQuantity: order.completedQuantity || order.plannedQuantity, rejectedQuantity: 0, note: '' }); setCompleting(true); }} disabled={acting}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            <FiCheck size={13} /> Complete
          </button>
        )}
        {!['completed','cancelled'].includes(order.status) && (
          <button onClick={() => doAction(cancelOrder, { note: 'Cancelled by admin' })} disabled={acting}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            <FiX size={13} /> Cancel
          </button>
        )}
      </div>

      {/* Complete Form */}
      {completing && (
        <div style={{ background: '#EDE9FE', border: '1px solid #8B5CF6', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#5B21B6', marginBottom: 16 }}>Complete Production Order</h4>
          <form onSubmit={handleComplete} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {[['Completed Qty', 'completedQuantity'], ['Rejected Qty', 'rejectedQuantity']].map(([lbl, k]) => (
              <div key={k}>
                <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>{lbl}</label>
                <input type="number" min="0" value={completeForm[k]} onChange={e => setCompleteForm(f => ({ ...f, [k]: e.target.value }))}
                  style={{ width: 120, padding: '8px 12px', border: '1px solid #C4B5FD', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              </div>
            ))}
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>Completion Note</label>
              <input value={completeForm.note} onChange={e => setCompleteForm(f => ({ ...f, note: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #C4B5FD', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={acting} style={{ padding: '9px 18px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Confirm Complete</button>
            <button type="button" onClick={() => setCompleting(false)} style={{ padding: '9px 18px', border: '1px solid #C4B5FD', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          </form>
        </div>
      )}

      {/* Progress Bar */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Production Progress</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{order.completedQuantity || 0} / {order.plannedQuantity} {order.unit}</span>
        </div>
        <div style={{ height: 12, background: '#E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#10B981' : '#3B82F6', borderRadius: 6, transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 10, fontSize: 12, color: '#6B7280' }}>
          <span>Progress: <b style={{ color: '#111827' }}>{pct}%</b></span>
          <span>Rejected: <b style={{ color: '#EF4444' }}>{order.rejectedQuantity || 0}</b></span>
          <span>Est. Cost: <b style={{ color: '#111827' }}>₹{Number(order.estimatedCost || 0).toLocaleString()}</b></span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Order Details */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Order Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <InfoRow label="Product"     value={order.productName} />
            <InfoRow label="Factory"     value={order.factory?.name} />
            <InfoRow label="Work Center" value={order.workCenter?.name} />
            <InfoRow label="Shift"       value={order.shift?.name} />
            <InfoRow label="Planned Start" value={order.plannedStartDate ? new Date(order.plannedStartDate).toLocaleDateString() : null} />
            <InfoRow label="Planned End"   value={order.plannedEndDate   ? new Date(order.plannedEndDate).toLocaleDateString() : null} />
            <InfoRow label="Actual Start"  value={order.actualStartDate  ? new Date(order.actualStartDate).toLocaleString() : null} />
            <InfoRow label="Actual End"    value={order.actualEndDate    ? new Date(order.actualEndDate).toLocaleString() : null} />
          </div>
          {order.notes && <p style={{ marginTop: 16, fontSize: 13, color: '#6B7280', background: '#F9FAFB', padding: '8px 12px', borderRadius: 8 }}>{order.notes}</p>}
        </div>

        {/* History */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Order History</h3>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {(order.history || []).map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{h.status?.replace(/_/g,' ').toUpperCase()} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>by {h.changedByName || 'System'}</span></div>
                  {h.note && <div style={{ fontSize: 12, color: '#6B7280' }}>{h.note}</div>}
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(h.changedAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {!(order.history?.length) && <p style={{ fontSize: 13, color: '#9CA3AF' }}>No history yet.</p>}
          </div>
        </div>
      </div>

      {/* Batches */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Production Batches ({order.batches?.length || 0})</h3>
          {!addingBatch && (
            <button onClick={() => setAddingBatch(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
              <FiPlus size={13} /> Add Batch
            </button>
          )}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Batch #','Size','Completed','Rejected','Scrap %','Machine','Status','Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(order.batches || []).map(b => (
              <tr key={b._id}>
                <td style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'monospace', fontWeight: 600, borderBottom: '1px solid #F3F4F6' }}>{b.batchNumber}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F3F4F6' }}>{b.batchSize}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#10B981', borderBottom: '1px solid #F3F4F6' }}>{b.completedQty || 0}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#EF4444', borderBottom: '1px solid #F3F4F6' }}>{b.rejectedQty || 0}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F3F4F6' }}>{b.scrapRate || 0}%</td>
                <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F3F4F6' }}>{b.machine?.name || '—'}</td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}><StatusBadge status={b.status} /></td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
                  {b.status === 'pending'     && <button onClick={() => handleBatchStatus(b._id, 'in_progress')} style={{ padding: '3px 8px', background: '#DBEAFE', color: '#1E40AF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Start</button>}
                  {b.status === 'in_progress' && <button onClick={() => handleBatchStatus(b._id, 'completed')}   style={{ padding: '3px 8px', background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Complete</button>}
                </td>
              </tr>
            ))}
            {!(order.batches?.length) && (
              <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No batches yet.</td></tr>
            )}
          </tbody>
        </table>

        {addingBatch && (
          <div style={{ padding: 20, background: '#FFF7ED', borderTop: '2px solid #FF7A00' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>New Batch</h4>
            <form onSubmit={handleAddBatch} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>Batch Size *</label>
                <input type="number" min="1" value={batchForm.batchSize} onChange={e => setBatchForm(f => ({ ...f, batchSize: e.target.value }))} required
                  style={{ width: 120, padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>Notes</label>
                <input value={batchForm.notes} onChange={e => setBatchForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" disabled={acting} style={{ padding: '9px 18px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Create</button>
              <button type="button" onClick={() => setAddingBatch(false)} style={{ padding: '9px 18px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

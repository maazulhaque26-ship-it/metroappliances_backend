import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiClipboard } from 'react-icons/fi';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import SearchToolbar from '../../components/shared/SearchToolbar';
import { getOrders, createOrder, cancelOrder, getFactories } from '../../services/manufacturingAPI';

const EMPTY = { productName: '', plannedQuantity: 1, unit: 'pcs', factory: '', status: 'draft', priority: 'normal', plannedStartDate: '', plannedEndDate: '', notes: '' };

const PRIORITY_COLORS = { low: '#9CA3AF', normal: '#374151', high: '#F59E0B', urgent: '#EF4444' };

export default function AdminProductionOrders() {
  const [orders,    setOrders]   = useState([]);
  const [factories, setFact]     = useState([]);
  const [loading,   setLoad]     = useState(true);
  const [search,    setSearch]   = useState('');
  const [statusF,   setStatusF]  = useState('');
  const [factoryF,  setFactoryF] = useState('');
  const [priorityF, setPriorityF]= useState('');
  const [showForm,  setShowForm] = useState(false);
  const [form,      setForm]     = useState(EMPTY);
  const [saving,    setSaving]   = useState(false);

  const load = useCallback(() => {
    setLoad(true);
    getOrders({ search, status: statusF, factory: factoryF, priority: priorityF, limit: 100 })
      .then(r => setOrders(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [search, statusF, factoryF, priorityF]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getFactories({ limit: 100 }).then(r => setFact(r.data.data || [])).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createOrder(form); setShowForm(false); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this production order?')) return;
    try { await cancelOrder(id, { note: 'Cancelled by admin' }); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const columns = [
    { key: 'orderNumber', header: 'Order #', render: (v, r) => (
      <Link to={`/admin/manufacturing/orders/${r._id}`} style={{ color: '#3B82F6', fontWeight: 700, textDecoration: 'none', fontFamily: 'monospace' }}>{v}</Link>
    )},
    { key: 'productName', header: 'Product', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'factory',     header: 'Factory', render: v => v?.name || '—' },
    { key: 'priority',    header: 'Priority', render: v => (
      <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLORS[v] || '#374151', textTransform: 'uppercase' }}>{v}</span>
    )},
    { key: 'plannedQuantity',   header: 'Planned', align: 'center' },
    { key: 'completedQuantity', header: 'Done',    align: 'center', render: v => <span style={{ fontWeight: 600, color: '#10B981' }}>{v || 0}</span> },
    {
      key: 'completionRate', header: 'Progress', align: 'center', width: 120,
      render: (_, r) => {
        const pct = r.plannedQuantity > 0 ? Math.min(100, Math.round((r.completedQuantity || 0) / r.plannedQuantity * 100)) : 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: '#E5E7EB', borderRadius: 3 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#10B981' : '#3B82F6', borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, minWidth: 30 }}>{pct}%</span>
          </div>
        );
      },
    },
    { key: 'status',          header: 'Status',     render: v => <StatusBadge status={v} /> },
    { key: 'plannedStartDate',header: 'Start Date',  render: v => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: '_id', header: 'Actions', align: 'center', width: 100,
      render: (id, r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Link to={`/admin/manufacturing/orders/${id}`} style={{ padding: '3px 10px', background: '#DBEAFE', color: '#1E40AF', borderRadius: 6, textDecoration: 'none', fontSize: 11, fontWeight: 700 }}>View</Link>
          {!['completed','cancelled'].includes(r.status) && (
            <button onClick={() => handleCancel(id)} style={{ padding: '3px 8px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Cancel</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Production Orders</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{orders.length} orders</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          <FiPlus size={14} /> New Order
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <SearchToolbar value={search} onChange={setSearch} placeholder="Search orders…" />
        <select value={factoryF} onChange={e => setFactoryF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
          <option value="">All Factories</option>
          {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
          <option value="">All Status</option>
          {['draft','confirmed','scheduled','in_progress','paused','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <select value={priorityF} onChange={e => setPriorityF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
          <option value="">All Priority</option>
          {['low','normal','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={orders} loading={loading} emptyIcon={FiClipboard} emptyTitle="No production orders" emptyMessage="Create your first manufacturing order." />

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>New Production Order</h2>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Product Name *</label>
                  <input value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Factory *</label>
                  <select value={form.factory} onChange={e => setForm(f => ({ ...f, factory: e.target.value }))} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
                    <option value="">Select Factory</option>
                    {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
                    {['low','normal','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Planned Quantity *</label>
                  <input type="number" min="1" value={form.plannedQuantity} onChange={e => setForm(f => ({ ...f, plannedQuantity: e.target.value }))} required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Unit</label>
                  <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Planned Start</label>
                  <input type="date" value={form.plannedStartDate} onChange={e => setForm(f => ({ ...f, plannedStartDate: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Planned End</label>
                  <input type="date" value={form.plannedEndDate} onChange={e => setForm(f => ({ ...f, plannedEndDate: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 20px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '9px 20px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>{saving ? 'Creating…' : 'Create Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

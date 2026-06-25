import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus } from 'react-icons/fi';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import { getSafetyStockRules, createSafetyStockRule, updateSafetyStockRule, deleteSafetyStockRule } from '../../services/mrpAPI';

const EMPTY = { materialName: '', materialSKU: '', unit: 'pcs', safetyStockQty: 0, reorderPoint: 0, reorderQty: 0, maxStockQty: 0, averageDailyUsage: 0, leadTimeDays: 0, demandVariability: 0, serviceLevel: 95, method: 'fixed', notes: '' };

export default function AdminSafetyStock() {
  const [data,    setData]   = useState([]);
  const [loading, setLoad]   = useState(true);
  const [page,    setPage]   = useState(1);
  const [total,   setTotal]  = useState(0);
  const [showForm,setShowForm]= useState(false);
  const [form,    setForm]   = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving] = useState(false);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoad(true);
    getSafetyStockRules({ page, limit: LIMIT })
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await updateSafetyStockRule(editing, form);
      else await createSafetyStockRule(form);
      setShowForm(false); setEditing(null); setForm(EMPTY); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const openEdit = (row) => { setEditing(row._id); setForm({ ...EMPTY, ...row }); setShowForm(true); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this safety stock rule?')) return;
    try { await deleteSafetyStockRule(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const FIELDS = [
    { label: 'Material Name *', key: 'materialName', type: 'text', required: true },
    { label: 'Material SKU',    key: 'materialSKU',  type: 'text' },
    { label: 'Unit',            key: 'unit',          type: 'text' },
    { label: 'Safety Stock Qty *', key: 'safetyStockQty', type: 'number', min: 0, required: true },
    { label: 'Reorder Point *',    key: 'reorderPoint',   type: 'number', min: 0, required: true },
    { label: 'Reorder Qty',        key: 'reorderQty',     type: 'number', min: 0 },
    { label: 'Max Stock Qty',      key: 'maxStockQty',    type: 'number', min: 0 },
    { label: 'Avg Daily Usage',    key: 'averageDailyUsage', type: 'number', min: 0 },
    { label: 'Lead Time (days)',   key: 'leadTimeDays',   type: 'number', min: 0 },
    { label: 'Demand Variability %', key: 'demandVariability', type: 'number', min: 0, max: 100 },
    { label: 'Service Level %',    key: 'serviceLevel',   type: 'number', min: 0, max: 100 },
  ];

  const columns = [
    { key: 'materialName', header: 'Material', render: (v, r) => <div><span style={{ fontWeight: 600 }}>{v}</span><div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{r.materialSKU}</div></div> },
    { key: 'safetyStockQty', header: 'Safety Stock', align: 'center', render: v => <span style={{ fontWeight: 700 }}>{(v || 0).toFixed(2)}</span> },
    { key: 'reorderPoint',   header: 'Reorder Pt.',  align: 'center', render: v => (v || 0).toFixed(2) },
    { key: 'reorderQty',     header: 'Reorder Qty',  align: 'center', render: v => (v || 0).toFixed(2) },
    { key: 'leadTimeDays',   header: 'Lead (days)',   align: 'center' },
    { key: 'serviceLevel',   header: 'Service %',     align: 'center', render: v => `${v}%` },
    { key: 'method',         header: 'Method',        render: v => <span style={{ textTransform: 'capitalize', fontSize: 11, color: '#6B7280' }}>{v}</span> },
    { key: 'isActive', header: 'Active', align: 'center', render: v => <span style={{ padding: '2px 7px', background: v ? '#D1FAE5' : '#F3F4F6', color: v ? '#065F46' : '#6B7280', borderRadius: 5, fontSize: 10, fontWeight: 700 }}>{v ? 'Yes' : 'No'}</span> },
    { key: '_id', header: 'Actions', align: 'center', width: 120,
      render: (id, r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <button onClick={() => openEdit(r)} style={{ padding: '4px 8px', background: '#EFF6FF', color: '#3B82F6', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
          <button onClick={() => handleDelete(id)} style={{ padding: '4px 8px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Del</button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Safety Stock Rules</h1>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <FiPlus size={14} /> Add Rule
        </button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No safety stock rules found" />
      <Pagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 16, padding: 32, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>{editing ? 'Edit' : 'New'} Safety Stock Rule</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {FIELDS.map(({ label, key, type, required, min, max }) => (
                <div key={key} style={{ gridColumn: key === 'materialName' ? '1 / -1' : undefined }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
                  <input type={type} required={required} min={min} max={max} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? +e.target.value : e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Method</label>
                <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
                  {['fixed','dynamic','statistical'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ padding: '9px 20px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : editing ? 'Update Rule' : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

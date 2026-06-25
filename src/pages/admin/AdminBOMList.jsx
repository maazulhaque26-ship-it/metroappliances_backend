import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiCopy, FiList, FiCheck } from 'react-icons/fi';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import SearchToolbar from '../../components/shared/SearchToolbar';
import { getBOMs, createBOM, approveBOM, cloneBOM, deleteBOM } from '../../services/manufacturingAPI';

const EMPTY = { productName: '', productSKU: '', version: '1.0', estimatedCostPerUnit: 0, notes: '' };

export default function AdminBOMList() {
  const [boms,    setBOMs]   = useState([]);
  const [loading, setLoad]   = useState(true);
  const [search,  setSearch] = useState('');
  const [statusF, setStatusF]= useState('');
  const [showForm,setShowForm]=useState(false);
  const [form,    setForm]   = useState(EMPTY);
  const [saving,  setSaving] = useState(false);

  const load = useCallback(() => {
    setLoad(true);
    getBOMs({ search, status: statusF, limit: 100 })
      .then(r => setBOMs(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [search, statusF]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createBOM(form); setShowForm(false); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this BOM?')) return;
    try { await approveBOM(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleClone = async (id) => {
    try { await cloneBOM(id); load(); alert('BOM cloned successfully'); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this BOM?')) return;
    try { await deleteBOM(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const columns = [
    { key: 'bomNumber',   header: 'BOM #', render: (v, r) => <Link to={`/admin/manufacturing/bom/${r._id}`} style={{ color: '#3B82F6', fontWeight: 700, textDecoration: 'none', fontFamily: 'monospace' }}>{v}</Link> },
    { key: 'productName', header: 'Product', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'productSKU',  header: 'SKU' },
    { key: 'version',     header: 'Ver', width: 60, align: 'center' },
    { key: 'items',       header: 'Items', align: 'center', render: v => v?.length || 0 },
    { key: 'estimatedCostPerUnit', header: 'Est. Cost', align: 'right', render: v => v ? `₹${Number(v).toLocaleString()}` : '—' },
    { key: 'status',      header: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'approvedBy',  header: 'Approved By', render: v => v?.name || '—' },
    {
      key: '_id', header: 'Actions', align: 'center', width: 130,
      render: (id, r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {r.status === 'draft' && (
            <button onClick={() => handleApprove(id)} title="Approve" style={{ padding: '3px 8px', background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
              Approve
            </button>
          )}
          <button onClick={() => handleClone(id)} title="Clone" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><FiCopy size={13} /></button>
          {r.status !== 'active' && (
            <button onClick={() => handleDelete(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 12, fontWeight: 600 }}>Del</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Bill of Materials</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{boms.length} BOMs</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          <FiPlus size={14} /> Create BOM
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <SearchToolbar value={search} onChange={setSearch} placeholder="Search BOMs…" />
        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
          <option value="">All Status</option>
          {['draft','approved','active','obsolete'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={boms} loading={loading} emptyIcon={FiList} emptyTitle="No BOMs yet" emptyMessage="Create Bill of Materials for your products." />

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 460 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Create BOM</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>You can add component items after creating the BOM header.</p>
            <form onSubmit={handleCreate}>
              {[['Product Name *', 'productName', true], ['Product SKU', 'productSKU', false], ['Version', 'version', false]].map(([lbl, k, req]) => (
                <div key={k} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{lbl}</label>
                  <input value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} required={req}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Est. Cost Per Unit (₹)</label>
                <input type="number" min="0" value={form.estimatedCostPerUnit || ''} onChange={e => setForm(f => ({ ...f, estimatedCostPerUnit: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Notes</label>
                <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 20px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '9px 20px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>{saving ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

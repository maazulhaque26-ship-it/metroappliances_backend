import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiLayers } from 'react-icons/fi';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import SearchToolbar from '../../components/shared/SearchToolbar';
import { getWorkCenters, createWorkCenter, updateWorkCenter, deleteWorkCenter, getFactories } from '../../services/manufacturingAPI';

const EMPTY = { name: '', code: '', factory: '', type: 'assembly', capacityPerHour: 0, operatorsRequired: 1, status: 'active' };

export default function AdminWorkCenters() {
  const [items,     setItems]     = useState([]);
  const [factories, setFactories] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [factoryF,  setFactoryF]  = useState('');
  const [statusF,   setStatusF]   = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [editing,   setEditing]   = useState(null);
  const [saving,    setSaving]    = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getWorkCenters({ search, factory: factoryF, status: statusF, limit: 100 })
      .then(r => setItems(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, factoryF, statusF]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getFactories({ limit: 100 }).then(r => setFactories(r.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit   = (r) => { setForm({ ...r, factory: r.factory?._id || r.factory }); setEditing(r._id); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      editing ? await updateWorkCenter(editing, form) : await createWorkCenter(form);
      setShowForm(false); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this work center?')) return;
    try { await deleteWorkCenter(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const columns = [
    { key: 'code',   header: 'Code', width: 100 },
    { key: 'name',   header: 'Work Center', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'factory',header: 'Factory', render: v => v?.name || '—' },
    { key: 'type',   header: 'Type', render: v => <StatusBadge status={v} label={v?.replace(/_/g,' ')} /> },
    { key: 'capacityPerHour', header: 'Capacity/Hr', align: 'center', render: v => v ? `${v} u/h` : '—' },
    { key: 'operatorsRequired', header: 'Operators', align: 'center' },
    { key: 'status', header: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: '_id', header: 'Actions', align: 'center', width: 100,
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={() => openEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><FiEdit2 size={14} /></button>
          <button onClick={() => handleDelete(r._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><FiTrash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Work Centers</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{items.length} work centers</p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          <FiPlus size={14} /> Add Work Center
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <SearchToolbar value={search} onChange={setSearch} placeholder="Search work centers…" />
        <select value={factoryF} onChange={e => setFactoryF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
          <option value="">All Factories</option>
          {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
          <option value="">All Status</option>
          {['active','idle','maintenance','breakdown'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={items} loading={loading} emptyIcon={FiLayers} emptyTitle="No work centers" emptyMessage="Create work centers within your factories." />

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 460 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editing ? 'Edit' : 'Add'} Work Center</h2>
            <form onSubmit={handleSubmit}>
              {[['Name *', 'name', true], ['Code', 'code', false]].map(([lbl, k, req]) => (
                <div key={k} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{lbl}</label>
                  <input value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} required={req}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Factory *</label>
                  <select value={form.factory} onChange={e => setForm(f => ({ ...f, factory: e.target.value }))} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
                    <option value="">Select Factory</option>
                    {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
                    {['machining','assembly','quality_check','packaging','finishing','testing','other'].map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Capacity/Hour</label>
                  <input type="number" value={form.capacityPerHour || ''} onChange={e => setForm(f => ({ ...f, capacityPerHour: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Operators Required</label>
                  <input type="number" min="1" value={form.operatorsRequired || ''} onChange={e => setForm(f => ({ ...f, operatorsRequired: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 20px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '9px 20px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

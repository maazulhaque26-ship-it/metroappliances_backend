import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCpu, FiTool } from 'react-icons/fi';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import SearchToolbar from '../../components/shared/SearchToolbar';
import { getMachines, createMachine, updateMachine, deleteMachine, updateMachineStatus, getFactories, getWorkCenters } from '../../services/manufacturingAPI';

const EMPTY = { name: '', code: '', type: '', factory: '', workCenter: '', manufacturer: '', model: '', serialNumber: '', status: 'idle', utilizationRate: 0, oee: 0 };

const STATUS_COLORS = { running: '#10B981', idle: '#9CA3AF', maintenance: '#F59E0B', breakdown: '#EF4444', decommissioned: '#6B7280' };

export default function AdminMachines() {
  const [items,      setItems]      = useState([]);
  const [factories,  setFactories]  = useState([]);
  const [workCenters,setWCs]        = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [factoryF,   setFactoryF]   = useState('');
  const [statusF,    setStatusF]    = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY);
  const [editing,    setEditing]    = useState(null);
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getMachines({ search, factory: factoryF, status: statusF, limit: 100 })
      .then(r => setItems(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, factoryF, statusF]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getFactories({ limit: 100 }).then(r => setFactories(r.data.data || [])).catch(() => {});
  }, []);
  useEffect(() => {
    if (factoryF) getWorkCenters({ factory: factoryF, limit: 100 }).then(r => setWCs(r.data.data || [])).catch(() => {});
    else setWCs([]);
  }, [factoryF]);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit   = (r) => {
    setForm({ ...r, factory: r.factory?._id || r.factory, workCenter: r.workCenter?._id || r.workCenter });
    setEditing(r._id); setShowForm(true);
  };

  const handleStatusChange = async (id, status) => {
    try { await updateMachineStatus(id, status); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      editing ? await updateMachine(editing, form) : await createMachine(form);
      setShowForm(false); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this machine?')) return;
    try { await deleteMachine(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const columns = [
    { key: 'code',       header: 'Code',    width: 110 },
    { key: 'name',       header: 'Machine', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'type',       header: 'Type' },
    { key: 'factory',    header: 'Factory',    render: v => v?.name || '—' },
    { key: 'workCenter', header: 'Work Center', render: v => v?.name || '—' },
    { key: 'utilizationRate', header: 'Utilization', align: 'center', render: v => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
        <div style={{ width: 50, height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${v || 0}%`, height: '100%', background: v > 80 ? '#10B981' : v > 50 ? '#F59E0B' : '#EF4444', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 12 }}>{v || 0}%</span>
      </div>
    )},
    { key: 'oee', header: 'OEE', align: 'center', render: v => `${v || 0}%` },
    { key: 'status', header: 'Status', render: (v, r) => (
      <select value={v} onChange={e => handleStatusChange(r._id, e.target.value)}
        style={{ padding: '3px 8px', border: `1px solid ${STATUS_COLORS[v] || '#E5E7EB'}`, borderRadius: 20, fontSize: 11, fontWeight: 700, color: STATUS_COLORS[v] || '#374151', background: `${STATUS_COLORS[v] || '#9CA3AF'}15`, cursor: 'pointer', outline: 'none' }}>
        {['running','idle','maintenance','breakdown','decommissioned'].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    )},
    {
      key: '_id', header: 'Actions', align: 'center', width: 90,
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
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Machine Registry</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{items.length} machines registered</p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          <FiPlus size={14} /> Add Machine
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <SearchToolbar value={search} onChange={setSearch} placeholder="Search machines…" />
        <select value={factoryF} onChange={e => setFactoryF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
          <option value="">All Factories</option>
          {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
          <option value="">All Status</option>
          {['running','idle','maintenance','breakdown','decommissioned'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={items} loading={loading} emptyIcon={FiCpu} emptyTitle="No machines" emptyMessage="Register your manufacturing machines." />

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editing ? 'Edit' : 'Add'} Machine</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['Machine Name *', 'name', true], ['Code', 'code', false], ['Type *', 'type', true], ['Manufacturer', 'manufacturer', false], ['Model', 'model', false], ['Serial Number', 'serialNumber', false]].map(([lbl, k, req]) => (
                  <div key={k}>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{lbl}</label>
                    <input value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} required={req}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Factory *</label>
                  <select value={form.factory} onChange={e => { setForm(f => ({ ...f, factory: e.target.value, workCenter: '' })); setFactoryF(e.target.value); }} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
                    <option value="">Select Factory</option>
                    {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Work Center *</label>
                  <select value={form.workCenter} onChange={e => setForm(f => ({ ...f, workCenter: e.target.value }))} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
                    <option value="">Select Work Center</option>
                    {workCenters.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>OEE %</label>
                  <input type="number" min="0" max="100" value={form.oee || ''} onChange={e => setForm(f => ({ ...f, oee: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Utilization %</label>
                  <input type="number" min="0" max="100" value={form.utilizationRate || ''} onChange={e => setForm(f => ({ ...f, utilizationRate: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
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

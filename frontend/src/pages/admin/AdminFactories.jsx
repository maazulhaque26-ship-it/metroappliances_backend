import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiBox } from 'react-icons/fi';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import SearchToolbar from '../../components/shared/SearchToolbar';
import { getFactories, createFactory, updateFactory, deleteFactory } from '../../services/manufacturingAPI';

const EMPTY_FORM = { name: '', code: '', type: 'main', address: { city: '', state: '', pincode: '' }, contactPerson: '', contactPhone: '', productionCapacityPerDay: 0, status: 'active' };

export default function AdminFactories() {
  const [factories, setFactories] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [editing,   setEditing]   = useState(null);
  const [saving,    setSaving]    = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getFactories({ search, status: statusFilter, limit: 100 })
      .then(r => setFactories(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true); };
  const openEdit   = (f)  => { setForm({ ...f, address: f.address || {} }); setEditing(f._id); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      editing ? await updateFactory(editing, form) : await createFactory(form);
      setShowForm(false); load();
    } catch (err) { alert(err.response?.data?.message || 'Error saving factory'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this factory?')) return;
    try { await deleteFactory(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error deleting factory'); }
  };

  const columns = [
    { key: 'code',   header: 'Code',   width: 100 },
    { key: 'name',   header: 'Factory Name', render: (v, r) => <Link to={`/admin/manufacturing/factories/${r._id}`} style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>{v}</Link> },
    { key: 'type',   header: 'Type', render: v => <StatusBadge status={v} /> },
    { key: 'address',header: 'City', render: v => v?.city || '—' },
    { key: 'productionCapacityPerDay', header: 'Capacity/Day', align: 'center', render: v => v ? `${v} units` : '—' },
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
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Factories</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{factories.length} factories registered</p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          <FiPlus size={14} /> Add Factory
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <SearchToolbar value={search} onChange={setSearch} placeholder="Search factories…" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <DataTable columns={columns} data={factories} loading={loading} emptyIcon={FiBox} emptyTitle="No factories yet" emptyMessage="Add your first manufacturing facility." />

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editing ? 'Edit Factory' : 'Add Factory'}</h2>
            <form onSubmit={handleSubmit}>
              {[
                { label: 'Factory Name *', key: 'name', required: true },
                { label: 'Code (e.g. FAC-001)', key: 'code' },
                { label: 'Contact Person', key: 'contactPerson' },
                { label: 'Contact Phone', key: 'contactPhone' },
                { label: 'Capacity Per Day (units)', key: 'productionCapacityPerDay', type: 'number' },
              ].map(({ label, key, required, type }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input type={type || 'text'} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required={required}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {[['City *', 'city', true], ['State *', 'state', true], ['Pincode *', 'pincode', true]].map(([label, key, req]) => (
                  <div key={key}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
                    <input value={form.address?.[key] || ''} onChange={e => setForm(f => ({ ...f, address: { ...f.address, [key]: e.target.value } }))} required={req}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
                    {['main', 'assembly', 'packaging', 'warehouse', 'mixed'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
                  {['active', 'inactive', 'maintenance'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 20px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '9px 20px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiClock } from 'react-icons/fi';
import DataTable from '../../components/shared/DataTable';
import SearchToolbar from '../../components/shared/SearchToolbar';
import { getShifts, createShift, updateShift, deleteShift, getFactories } from '../../services/manufacturingAPI';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EMPTY = { name: '', code: '', factory: '', startTime: '06:00', endTime: '14:00', durationHours: 8, daysOfWeek: ['Mon','Tue','Wed','Thu','Fri'], supervisorName: '', operatorCount: 0, targetOutput: 0, isActive: true };

export default function AdminShiftPlanner() {
  const [shifts,    setShifts]    = useState([]);
  const [factories, setFactories] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [factoryF,  setFactoryF]  = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [editing,   setEditing]   = useState(null);
  const [saving,    setSaving]    = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getShifts({ factory: factoryF, limit: 100 })
      .then(r => setShifts(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [factoryF]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getFactories({ limit: 100 }).then(r => setFactories(r.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit   = (r) => { setForm({ ...r, factory: r.factory?._id || r.factory }); setEditing(r._id); setShowForm(true); };

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day) ? f.daysOfWeek.filter(d => d !== day) : [...f.daysOfWeek, day],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      editing ? await updateShift(editing, form) : await createShift(form);
      setShowForm(false); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this shift?')) return;
    try { await deleteShift(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const columns = [
    { key: 'code',     header: 'Code',  width: 100 },
    { key: 'name',     header: 'Shift Name', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'factory',  header: 'Factory', render: v => v?.name || '—' },
    { key: 'startTime',header: 'Start' },
    { key: 'endTime',  header: 'End' },
    { key: 'durationHours', header: 'Hours', align: 'center', render: v => `${v}h` },
    { key: 'daysOfWeek', header: 'Days', render: v => (v || []).join(', ') || '—' },
    { key: 'targetOutput', header: 'Target', align: 'center', render: v => v ? `${v} u` : '—' },
    { key: 'isActive', header: 'Active', align: 'center', render: v => (
      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: v ? '#D1FAE5' : '#F3F4F6', color: v ? '#065F46' : '#6B7280' }}>{v ? 'Active' : 'Inactive'}</span>
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
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Shift Planner</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{shifts.length} shifts configured</p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          <FiPlus size={14} /> Add Shift
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={factoryF} onChange={e => setFactoryF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
          <option value="">All Factories</option>
          {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={shifts} loading={loading} emptyIcon={FiClock} emptyTitle="No shifts defined" emptyMessage="Configure production shifts for your factories." />

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 500 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editing ? 'Edit' : 'Add'} Shift</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Shift Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Factory *</label>
                  <select value={form.factory} onChange={e => setForm(f => ({ ...f, factory: e.target.value }))} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }}>
                    <option value="">Select</option>
                    {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Duration (hours)</label>
                  <input type="number" min="1" max="24" value={form.durationHours} onChange={e => setForm(f => ({ ...f, durationHours: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Start Time *</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>End Time *</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Supervisor</label>
                  <input value={form.supervisorName} onChange={e => setForm(f => ({ ...f, supervisorName: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Target Output (units)</label>
                  <input type="number" min="0" value={form.targetOutput} onChange={e => setForm(f => ({ ...f, targetOutput: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ margin: '16px 0' }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Working Days</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {DAYS.map(d => (
                    <button key={d} type="button" onClick={() => toggleDay(d)}
                      style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: form.daysOfWeek.includes(d) ? '#3B82F6' : '#fff',
                        color: form.daysOfWeek.includes(d) ? '#fff' : '#374151',
                        borderColor: form.daysOfWeek.includes(d) ? '#3B82F6' : '#E5E7EB' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                <label htmlFor="isActive" style={{ fontSize: 13, color: '#374151' }}>Active Shift</label>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
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

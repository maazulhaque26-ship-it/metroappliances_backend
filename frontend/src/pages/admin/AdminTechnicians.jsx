import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiSearch, FiStar, FiEdit2, FiTrash2 } from 'react-icons/fi';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Pagination from '../../components/shared/Pagination';
import MetricCard from '../../components/shared/MetricCard';
import api from '../../services/api';
import { usePagination } from '../../hooks/usePagination';

export default function AdminTechnicians() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { page, setPage, total, setTotal, limit } = usePagination();
  const [form, setForm] = useState({ employeeId: '', name: '', email: '', phone: '', password: '', skills: '', status: 'active' });

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    api.get(`/admin/technicians?${params}`)
      .then(r => { setItems(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, limit, search, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/admin/technicians/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setForm({ employeeId: '', name: '', email: '', phone: '', password: '', skills: '', status: 'active' });
    setEditId(null);
    setModal(true);
  };

  const openEdit = (tech) => {
    setForm({ ...tech, skills: (tech.skills || []).join(', '), password: '' });
    setEditId(tech._id);
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) };
      if (!payload.password) delete payload.password;
      if (editId) {
        await api.put(`/admin/technicians/${editId}`, payload);
      } else {
        await api.post('/admin/technicians', payload);
      }
      setModal(false);
      load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete technician "${name}"?`)) return;
    await api.delete(`/admin/technicians/${id}`);
    load();
  };

  const columns = [
    { key: 'employeeId', header: 'Employee ID', render: r => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.employeeId}</span> },
    { key: 'name', header: 'Name', render: r => <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: '#6B7280' }}>{r.email}</div></div> },
    { key: 'phone', header: 'Phone', render: r => r.phone },
    { key: 'skills', header: 'Skills', render: r => <div style={{ fontSize: 11 }}>{(r.skills || []).slice(0, 3).join(', ')}{r.skills?.length > 3 ? ' ...' : ''}</div> },
    { key: 'workload', header: 'Workload', render: r => <span style={{ fontSize: 12 }}>{r.currentWorkload}/{r.maxWorkload}</span> },
    { key: 'rating', header: 'Rating', render: r => <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><FiStar size={12} color="#F59E0B" /> {r.rating?.average?.toFixed(1) || '0.0'} ({r.rating?.count || 0})</span> },
    { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'avail', header: 'Available', render: r => <StatusBadge status={r.availability?.isAvailable ? 'active' : 'inactive'} label={r.availability?.isAvailable ? 'Yes' : 'No'} /> },
    {
      key: 'actions', header: '', render: r => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => openEdit(r)} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer' }}><FiEdit2 size={14} /></button>
          <button onClick={() => handleDelete(r._id, r.name)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><FiTrash2 size={14} /></button>
        </div>
      )
    },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Technicians</h1>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <FiPlus size={14} /> Add Technician
        </button>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <MetricCard title="Total" value={stats.total || 0} accent="#3B82F6" />
          <MetricCard title="Active" value={stats.active || 0} accent="#10B981" />
          <MetricCard title="Inactive" value={stats.inactive || 0} accent="#6B7280" />
          <MetricCard title="Available Now" value={stats.available || 0} accent="#F59E0B" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search technician..."
            style={{ width: '100%', paddingLeft: 32, height: 36, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ height: 36, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, padding: '0 12px' }}>
          <option value="">All Statuses</option>
          {['active','inactive','on_leave','suspended'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={items} loading={loading} rowKey="_id" emptyTitle="No technicians" emptyMessage="Create your first technician to get started" />
      <div style={{ marginTop: 16 }}><Pagination page={page} total={total} limit={limit} onPageChange={setPage} /></div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 480, maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 20, fontWeight: 700 }}>{editId ? 'Edit' : 'Add'} Technician</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['employeeId', 'Employee ID'],['name', 'Full Name'],
                ['email', 'Email'],['phone', 'Phone'],
                ['password', editId ? 'New Password (optional)' : 'Password'],['skills', 'Skills (comma-separated)'],
              ].map(([key, label]) => (
                <div key={key} style={{ gridColumn: ['skills'].includes(key) ? '1 / -1' : undefined }}>
                  <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{label}</label>
                  <input
                    type={key === 'password' ? 'password' : 'text'}
                    value={form[key] || ''}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Status</label>
                <select value={form.status || 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
                  {['active','inactive','on_leave','suspended'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setModal(false)} style={{ padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                {saving ? 'Saving...' : (editId ? 'Save' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

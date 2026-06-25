import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Pagination from '../../components/shared/Pagination';
import MetricCard from '../../components/shared/MetricCard';
import api from '../../services/api';
import { usePagination } from '../../hooks/usePagination';

export default function AdminSpareParts() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const { page, setPage, total, setTotal, limit } = usePagination();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ partNumber: '', name: '', description: '', category: '', brand: '', quantity: 0, reorderLevel: 5, unitPrice: 0, taxPercent: 18, hsn: '' });

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (categoryFilter) params.set('category', categoryFilter);
    if (lowStockOnly) params.set('lowStock', 'true');
    api.get(`/admin/spare-parts?${params}`)
      .then(r => { setItems(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, limit, search, categoryFilter, lowStockOnly]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/admin/spare-parts/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/admin/spare-parts/categories').then(r => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setForm({ partNumber: '', name: '', description: '', category: '', brand: '', quantity: 0, reorderLevel: 5, unitPrice: 0, taxPercent: 18, hsn: '' });
    setEditId(null);
    setModal(true);
  };

  const openEdit = (part) => {
    setForm({ ...part });
    setEditId(part._id);
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/spare-parts/${editId}`, form);
      } else {
        await api.post('/admin/spare-parts', form);
      }
      setModal(false);
      load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await api.delete(`/admin/spare-parts/${id}`);
    load();
  };

  const columns = [
    { key: 'partNumber', header: 'Part #', render: r => <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{r.partNumber}</span> },
    { key: 'name', header: 'Name', render: r => <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: '#6B7280' }}>{r.category} · {r.brand}</div></div> },
    { key: 'stock', header: 'Stock', render: r => (
      <span style={{ color: r.quantity === 0 ? '#EF4444' : r.quantity <= r.reorderLevel ? '#F59E0B' : '#111827', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
        {r.quantity <= r.reorderLevel && r.quantity > 0 && <FiAlertTriangle size={12} color="#F59E0B" />}
        {r.quantity === 0 && <FiAlertTriangle size={12} color="#EF4444" />}
        {r.quantity}
      </span>
    )},
    { key: 'reorderLevel', header: 'Reorder At', render: r => r.reorderLevel },
    { key: 'unitPrice', header: 'Price', render: r => `₹${r.unitPrice?.toLocaleString('en-IN')}` },
    { key: 'status', header: 'Status', render: r => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
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
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Spare Parts</h1>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <FiPlus size={14} /> Add Part
        </button>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <MetricCard title="Total Parts" value={stats.total || 0} accent="#3B82F6" />
          <MetricCard title="Low Stock" value={stats.lowStock || 0} accent="#F59E0B" />
          <MetricCard title="Out of Stock" value={stats.outOfStock || 0} accent="#EF4444" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search parts..."
            style={{ width: '100%', paddingLeft: 32, height: 36, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
        </div>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          style={{ height: 36, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, padding: '0 12px' }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={lowStockOnly} onChange={e => { setLowStockOnly(e.target.checked); setPage(1); }} />
          Low Stock Only
        </label>
      </div>

      <DataTable columns={columns} data={items} loading={loading} rowKey="_id" emptyTitle="No spare parts" emptyMessage="Add your first spare part to get started" />
      <div style={{ marginTop: 16 }}><Pagination page={page} total={total} limit={limit} onPageChange={setPage} /></div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 500, maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 20, fontWeight: 700 }}>{editId ? 'Edit' : 'Add'} Spare Part</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['partNumber','Part Number'],['name','Name'],
                ['category','Category'],['brand','Brand'],
                ['quantity','Quantity'],['reorderLevel','Reorder Level'],
                ['unitPrice','Unit Price (₹)'],['taxPercent','Tax %'],
                ['hsn','HSN Code'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{label}</label>
                  <input
                    type={['quantity','reorderLevel','unitPrice','taxPercent'].includes(key) ? 'number' : 'text'}
                    value={form[key] ?? ''}
                    onChange={e => setForm(f => ({ ...f, [key]: ['quantity','reorderLevel','unitPrice','taxPercent'].includes(key) ? +e.target.value : e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Description</label>
                <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, height: 60, resize: 'vertical', boxSizing: 'border-box' }} />
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
